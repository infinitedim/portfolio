import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

/**
 * Handle admin login with secure httpOnly cookies
 * @param request
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    // Validate credentials (this should be replaced with actual database lookup)
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminHashPassword = process.env.ADMIN_HASH_PASSWORD;

    if (!adminEmail) {
      return NextResponse.json(
        { error: "Admin account not configured" },
        { status: 500 },
      );
    }

    // Check email
    if (email !== adminEmail) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Check password (either plain text for development or hashed for production)
    let isValidPassword = false;

    if (adminHashPassword) {
      // Production: use hashed password
      isValidPassword = await bcrypt.compare(password, adminHashPassword);
    } else if (adminPassword) {
      // Development: use plain text password
      isValidPassword = password === adminPassword;
    } else {
      return NextResponse.json(
        { error: "Admin password not configured" },
        { status: 500 },
      );
    }

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const tokenPayload = {
      userId: "admin",
      email: adminEmail,
      role: "admin",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
    };

    const token = jwt.sign(tokenPayload, jwtSecret);

    // Set secure httpOnly cookie
    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === "production";

    cookieStore.set("adminToken", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      path: "/",
      maxAge: 15 * 60, // 15 minutes
    });

    return NextResponse.json({
      success: true,
      user: {
        userId: "admin",
        email: adminEmail,
        role: "admin",
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * Handle OPTIONS for CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin":
        process.env.FRONTEND_ORIGIN || "http://127.0.0.1:3000",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}
