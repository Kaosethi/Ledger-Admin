import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { createJWT } from "@/lib/auth/jwt";

// Authentication schema for login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// TEST credentials - only use in development environment
const TEST_EMAIL = "admin@example.com";
const TEST_PASSWORD = "password";

// POST /api/auth/login - Login as administrator
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    // Test bypass for development
    let loginResult;
    if (email === TEST_EMAIL && password === TEST_PASSWORD) {
      console.log("Using test bypass for authentication");
      loginResult = {
        success: true,
        user: {
          id: "test-admin-id",
          email: TEST_EMAIL,
          role: "admin",
        },
      };
    } else {
      // Regular authentication using Better Auth
      loginResult = await auth.emailAndPassword.login({
        email,
        password,
      });
    }

    if (!loginResult.success) {
      return NextResponse.json(
        { error: loginResult.error || "Authentication failed" },
        { status: 401 }
      );
    }

    // Check if user object exists
    if (!loginResult.user) {
      return NextResponse.json(
        { error: "Authentication succeeded but user data is missing" },
        { status: 500 }
      );
    }

    // Create a JWT token
    const token = await createJWT({
      sub: loginResult.user.id,
      email: loginResult.user.email,
      role: loginResult.user.role,
    });

    // Create the response
    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: loginResult.user.id,
        email: loginResult.user.email,
        role: loginResult.user.role,
      },
    });

    // Set the JWT token as a cookie
    response.cookies.set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12, // 12 hours
    });

    return response;
  } catch (error) {
    console.error("Error during login:", error);
    return NextResponse.json({ error: "Failed to login" }, { status: 500 });
  }
}
