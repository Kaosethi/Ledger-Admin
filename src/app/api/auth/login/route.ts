import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SignJWT } from "jose";
import { db } from "@/lib/db";
import { administrators } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import mockDataInstance, { AdminUser } from "@/lib/mockData";

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
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Bypass authentication for test credentials
    if (email === TEST_EMAIL && password === TEST_PASSWORD) {
      // Create a JWT token for test user
      const jwtSecret =
        process.env.JWT_SECRET ||
        "default-mock-secret-do-not-use-in-production";
      const token = await new SignJWT({
        sub: "test-admin-id",
        email: TEST_EMAIL,
        role: "Admin",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("8h")
        .sign(new TextEncoder().encode(jwtSecret));

      const response = NextResponse.json({
        message: "Logged in successfully (test user)",
        user: {
          id: "test-admin-id",
          email: TEST_EMAIL,
          name: "Test Administrator",
          role: "Admin",
        },
      });

      response.cookies.set({
        name: "auth-token",
        value: token,
        httpOnly: true,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 8, // 8 hours
      });

      return response;
    }

    // First try to authenticate against the database
    let admin;
    try {
      admin = await db
        .select()
        .from(administrators)
        .where(eq(administrators.email, email))
        .limit(1);

      if (admin && admin.length > 0) {
        const adminUser = admin[0];
        // In a real app, you would use a proper password comparison
        // e.g., const isPasswordValid = await bcrypt.compare(password, adminUser.passwordHash);
        const isPasswordValid = adminUser.passwordHash === password; // Simplified for demo

        if (!isPasswordValid) {
          return NextResponse.json(
            { error: "Invalid credentials" },
            { status: 401 }
          );
        }
      }
    } catch (dbError) {
      console.warn(
        "Database error, falling back to mock authentication:",
        dbError
      );
      admin = null;
    }

    // If no admin found in DB or DB error occurred, check mock data
    if (!admin || admin.length === 0) {
      const mockAdmin = mockDataInstance.admins.find(
        (a) => a.email === email && a.passwordHash === password
      );

      if (!mockAdmin) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        );
      }

      admin = [mockAdmin];
    }

    // Create a JWT token
    const jwtSecret =
      process.env.JWT_SECRET || "default-mock-secret-do-not-use-in-production";
    const token = await new SignJWT({
      sub: String(admin[0].id),
      email: admin[0].email,
      role: (admin[0] as AdminUser).role || "Admin", // Cast to AdminUser type for mock data
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(new TextEncoder().encode(jwtSecret));

    // Create the response with JSON data
    const response = NextResponse.json({
      message: "Logged in successfully",
      user: {
        id: admin[0].id,
        email: admin[0].email,
        name: (admin[0] as AdminUser).name || "Administrator",
        role: (admin[0] as AdminUser).role || "Admin",
      },
    });

    // Set cookie directly on the response
    response.cookies.set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 8, // 8 hours
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
