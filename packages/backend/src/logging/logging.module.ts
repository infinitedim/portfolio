import { Module } from "@nestjs/common";
import { WinstonModule } from "nest-winston";
// import {
//   PortfolioLoggerModule,
//   PortfolioLoggerService,
//   createNestWinstonConfig,
//   type LogLevel
// } from "@portfolio/logger";
import { LoggingService } from "./logging.service";

/**
 * NestJS Logging Module that integrates Winston with the centralized logger
 * This module provides Winston integration for NestJS while maintaining
 * compatibility with the centralized logging system
 */
@Module({
  imports: [
    // Import the centralized logger module
    PortfolioLoggerModule,

    // Configure Winston for NestJS
    WinstonModule.forRootAsync({
      useFactory: () => {
        return createNestWinstonConfig({
          level:
            (process.env.LOG_LEVEL as LogLevel) ||
            (process.env.NODE_ENV === "production" ? "info" : "debug"),
          enableConsole: true,
          enableFile: process.env.NODE_ENV === "production",
          logDir: "logs",
          maskSensitiveData: true,
          includeTimestamp: true,
          includeMetadata: true,
          service: "portfolio-backend",
          environment: process.env.NODE_ENV || "development",
        });
      },
    }),
  ],
  providers: [
    // Provide the centralized logger service
    {
      provide: "LOGGER",
      useFactory: () => {
        return new PortfolioLoggerService({
          level:
            (process.env.LOG_LEVEL as LogLevel) ||
            (process.env.NODE_ENV === "production" ? "info" : "debug"),
          enableConsole: true,
          enableFile: process.env.NODE_ENV === "production",
          logDir: "logs",
          maskSensitiveData: true,
          includeTimestamp: true,
          includeMetadata: true,
          service: "portfolio-backend",
          environment: process.env.NODE_ENV || "development",
        });
      },
    },

    // Provide specialized loggers
    {
      provide: "SECURITY_LOGGER",
      useFactory: () => {
        return new PortfolioLoggerService({
          level: "info",
          enableConsole: process.env.NODE_ENV !== "production",
          enableFile: true,
          logDir: "logs",
          maskSensitiveData: true,
          service: "portfolio-security",
          environment: process.env.NODE_ENV || "development",
        });
      },
    },

    {
      provide: "PERFORMANCE_LOGGER",
      useFactory: () => {
        return new PortfolioLoggerService({
          level: "info",
          enableConsole: false,
          enableFile: true,
          logDir: "logs",
          maskSensitiveData: false,
          service: "portfolio-performance",
          environment: process.env.NODE_ENV || "development",
        });
      },
    },

    // Provide the logging service
    LoggingService,
  ],
  exports: [
    "LOGGER",
    "SECURITY_LOGGER",
    "PERFORMANCE_LOGGER",
    LoggingService,
    PortfolioLoggerModule,
  ],
})
export class LoggingModule {}
