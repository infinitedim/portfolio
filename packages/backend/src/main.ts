import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { mountTrpc } from "./trpc/router";
import type { NextFunction, Request, Response } from "express";
import { GlobalExceptionFilter } from "./common/global-exception.filter";
import { GlobalErrorHandler } from "./common/error-handler";
import { PrismaService } from "./prisma/prisma.service";
import { RedisService } from "./redis/redis.service";
import { securityLogger } from "./logging/logger";

/**
 * @description Bootstrap the NestJS application
 * @returns {Promise<void>}
 */
export async function createExpressApp(): Promise<import("express").Express> {
  const app = await NestFactory.create(AppModule);

  // Set up global exception filter
  const globalErrorHandler = app.get(GlobalErrorHandler);
  app.useGlobalFilters(new GlobalExceptionFilter(globalErrorHandler));

  const allowed = (process.env.IP_ALLOW_LIST || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowed.length > 0) {
    app.use((req: Request, res: Response, next: NextFunction) => {
      const xf = (req.headers["x-forwarded-for"] as string) || "";
      const clientIp = req.ip || req.socket.remoteAddress || "";
      const ip = (xf.split(",")[0] || clientIp).trim();
      if (!ip) return res.status(403).json({ error: "Forbidden" });
      // Simple exact match; for CIDR, use a library like ip-cidr in future
      if (!allowed.includes(ip))
        return res.status(403).json({ error: "Forbidden" });
      next();
    });
  }

  // Enhanced security headers with Helmet
  const cspReportUri = process.env.CSP_REPORT_URI || "/api/csp-report";
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
          ],
          imgSrc: ["'self'", "data:", "https:"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          connectSrc: ["'self'", "https://api.github.com"],
          mediaSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: [],
          // Report CSP violations to the specified endpoint
          reportUri: [cspReportUri],
        },
      },
      crossOriginOpenerPolicy: { policy: "same-origin" },
      crossOriginResourcePolicy: { policy: "same-origin" },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      noSniff: true,
      frameguard: { action: "deny" },
      xssFilter: true,
      hidePoweredBy: true,
      ieNoOpen: true,
      permittedCrossDomainPolicies: { permittedPolicies: "none" },
    }),
  );

  // CORS configuration with secure origin validation
  const allowedOrigin = process.env.FRONTEND_ORIGIN || "http://127.0.0.1:3000";

  // Parse allowed origins (support comma-separated list for multiple environments)
  const allowedOrigins = allowedOrigin
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    // Secure origin validation using callback
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (server-to-server, curl, etc.)
      // In production, you might want to be stricter about this
      if (!origin) {
        return callback(null, true);
      }

      // Exact match against allowed origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Reject disallowed origins
      securityLogger.warn("CORS origin rejected", {
        origin,
        allowedOrigins,
        component: "CORS",
        operation: "originValidation",
      });
      return callback(new Error("CORS origin not allowed"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
    exposedHeaders: [
      "X-RateLimit-Limit",
      "X-RateLimit-Remaining",
      "X-RateLimit-Reset",
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidUnknownValues: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: true,
      disableErrorMessages: process.env.NODE_ENV === "production",
    }),
  );

  const expressApp = app.getHttpAdapter().getInstance();
  mountTrpc(expressApp);
  await app.init();

  // Register Prisma shutdown hooks (if available)
  try {
    const prismaService = app.get(PrismaService, { strict: false });
    if (
      prismaService &&
      typeof prismaService.enableShutdownHooks === "function"
    ) {
      prismaService.enableShutdownHooks(app).catch((err: unknown) => {
        // Don't block startup for hook registration failures - log and continue
        const errorMessage = err instanceof Error ? err.message : String(err);
        securityLogger.error("Failed to enable Prisma shutdown hooks", {
          error: errorMessage,
          stack: err instanceof Error ? err.stack : undefined,
          component: "ApplicationLifecycle",
          operation: "enablePrismaShutdownHooks",
        });

        securityLogger.warn(
          "Application may not shut down gracefully without Prisma hooks",
          {
            component: "ApplicationLifecycle",
            operation: "enablePrismaShutdownHooks",
          },
        );
      });
    }
  } catch (err: unknown) {
    // If PrismaService isn't available in some contexts, log the reason
    const errorMessage = err instanceof Error ? err.message : String(err);
    securityLogger.warn("PrismaService not available for shutdown hooks", {
      error: errorMessage,
      note: "This is expected in some deployment contexts (e.g., serverless)",
      component: "ApplicationLifecycle",
      operation: "enablePrismaShutdownHooks",
    });
  }

  // Track shutdown state to prevent multiple shutdowns
  let isShuttingDown = false;
  const SHUTDOWN_TIMEOUT = 10000; // 10 seconds for graceful shutdown

  // Graceful shutdown helper with improved error handling
  const gracefulShutdown = async (reason?: string, error?: unknown) => {
    // Prevent multiple shutdown attempts
    if (isShuttingDown) {
      securityLogger.debug("Shutdown already in progress, skipping duplicate", {
        reason: reason || "Unknown",
        component: "ApplicationLifecycle",
        operation: "gracefulShutdown",
      });
      return;
    }
    isShuttingDown = true;

    const severity = error ? "error" : "info";
    securityLogger[severity]("Application shutdown initiated", {
      reason: reason || "Unknown",
      error: error instanceof Error ? error.message : String(error || ""),
      stack: error instanceof Error ? error.stack : undefined,
      component: "ApplicationLifecycle",
      operation: "gracefulShutdown",
    });

    // Create a timeout promise to force exit if cleanup takes too long
    const forceExitTimeout = setTimeout(() => {
      securityLogger.error("Forced shutdown after timeout", {
        timeoutMs: SHUTDOWN_TIMEOUT,
        reason: reason || "Unknown",
        component: "ApplicationLifecycle",
        operation: "gracefulShutdown",
      });
      process.exit(error ? 1 : 0);
    }, SHUTDOWN_TIMEOUT).unref();

    try {
      // Stop accepting new connections first
      securityLogger.debug("Stopping new connections", {
        component: "ApplicationLifecycle",
        operation: "gracefulShutdown",
      });

      // attempt to close the Nest application
      await app.close();

      securityLogger.debug("Nest application closed", {
        component: "ApplicationLifecycle",
        operation: "gracefulShutdown",
      });
    } catch (e) {
      securityLogger.error("Failed to close Nest application", {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
        component: "ApplicationLifecycle",
        operation: "gracefulShutdown",
      });
    }

    try {
      const prismaService = app.get(PrismaService, { strict: false });
      if (prismaService && typeof prismaService.$disconnect === "function") {
        await prismaService.$disconnect();
        securityLogger.debug("Prisma disconnected", {
          component: "ApplicationLifecycle",
          operation: "gracefulShutdown",
        });
      }
    } catch (e) {
      securityLogger.error("Failed to disconnect Prisma", {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
        component: "ApplicationLifecycle",
        operation: "gracefulShutdown",
      });
    }

    try {
      const redisService = app.get(RedisService, { strict: false });
      // Upstash REST client is stateless; attempt ping for diagnostics only
      if (redisService && typeof redisService.ping === "function") {
        try {
          await redisService.ping();
        } catch (_pingErr) {
          // ignore ping errors during shutdown
        }
      }
    } catch (e) {
      securityLogger.error("Failed to handle Redis during shutdown", {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
        component: "ApplicationLifecycle",
        operation: "gracefulShutdown",
      });
    }

    // Clear the force exit timeout since we completed cleanup
    clearTimeout(forceExitTimeout);

    securityLogger.info("Graceful shutdown complete", {
      reason: reason || "Unknown",
      component: "ApplicationLifecycle",
      operation: "gracefulShutdown",
    });

    // give process a moment to flush logs, then exit
    setTimeout(() => process.exit(error ? 1 : 0), 500).unref();
  };

  // Global process handlers to ensure graceful shutdown
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

  // For unhandled rejections, log but don't immediately shutdown in development
  // In production, we should fail-fast
  process.on("unhandledRejection", (reason) => {
    securityLogger.error("Unhandled promise rejection detected", {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
      component: "ApplicationLifecycle",
      operation: "unhandledRejection",
    });

    // In production, trigger graceful shutdown on unhandled rejections
    // In development, log and continue to allow debugging
    if (process.env.NODE_ENV === "production") {
      gracefulShutdown("unhandledRejection", reason);
    } else {
      securityLogger.warn(
        "Continuing despite unhandled rejection (development mode)",
        {
          component: "ApplicationLifecycle",
          operation: "unhandledRejection",
        },
      );
    }
  });

  // Uncaught exceptions always trigger shutdown
  process.on("uncaughtException", (err) => {
    securityLogger.error("Uncaught exception - triggering shutdown", {
      error: err.message,
      stack: err.stack,
      component: "ApplicationLifecycle",
      operation: "uncaughtException",
    });
    gracefulShutdown("uncaughtException", err);
  });

  // Start the server only in development mode (not in serverless)
  if (process.env.NODE_ENV === "development") {
    const port = process.env.PORT || 4000;
    await app.listen(port);

    securityLogger.info("Server started successfully", {
      port,
      url: `http://localhost:${port}`,
      environment: "development",
      component: "ApplicationLifecycle",
      operation: "startServer",
    });
  }

  return expressApp;
}
