import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { Express } from "express";
import { createExpressApp } from "../src/main";

// Global variable to cache the Express app instance
let appInstance: Express | undefined;

/**
 * Serverless function handler for Vercel
 * Optimized for cold starts and connection reuse
 * @param {VercelRequest} req - The Vercel request object
 * @param {VercelResponse} res - The Vercel response object
 * @returns {Promise<void>}
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  try {
    // Initialize the app instance on first request (cold start)
    if (!appInstance) {
      console.log("🚀 Initializing NestJS app for serverless environment...");
      appInstance = await createExpressApp();
      console.log("✅ NestJS app initialized successfully");
    }

    // Handle the request through the Express app
    return appInstance(req, res);
  } catch (error) {
    console.error("❌ Error in serverless handler:", error);

    // Return a proper error response
    res.status(500).json({
      error: "Internal Server Error",
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Something went wrong",
    });
  }
}
