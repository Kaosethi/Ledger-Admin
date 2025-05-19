import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { administrators } from "@/lib/db/schema";
import { eq, isNull } from "drizzle-orm";
import mockDataInstance, { AdminUser } from "@/lib/mockData";
import { env } from "@/lib/config";
import { verifyPassword } from "@/lib/auth/password";
import { createJWT } from "@/lib/auth/jwt";

// Authentication schema for login
const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

// TEST credentials - only use in development environment
const TEST_EMAIL = "admin@example.com";
const TEST_PASSWORD = "password";

// POST /api/auth/login - Login as administrator
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input using zod
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation error", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    console.log("[API /auth/login] Attempting login for email:", email);

    // Bypass authentication for test credentials in development
    const isTestEnv = env.NODE_ENV !== "production";
    if (isTestEnv && email === TEST_EMAIL && password === TEST_PASSWORD) {
      // Create a JWT token for test user
      const token = await createJWT({
        sub: "test-admin-id",
        email: TEST_EMAIL,
        role: "admin",
        isAdmin: true,
      });

      const response = NextResponse.json({
        message: "Logged in successfully (test user)",
        user: {
          id: "test-admin-id",
          email: TEST_EMAIL,
          name: "Test Administrator",
          role: "admin",
        },
      });

      response.cookies.set({
        name: "auth-token",
        value: token,
        httpOnly: true,
        path: "/",
        secure: env.NODE_ENV === "production",
        maxAge: 60 * 60 * 12, // 12 hours
      });

      return response;
    }

    // Try to authenticate against the database
    const adminUsers = await db
      .select()
      .from(administrators)
      .where(eq(administrators.email, email.toLowerCase()))
      .limit(1);

    // If no admin found in DB, check mock data
    let admin: AdminUser | typeof administrators.$inferSelect | null = null;

    if (adminUsers.length === 0) {
      console.warn(
        "[API /auth/login] Admin not found in database, checking mock data for:",
        email
      );
      const mockAdmin = mockDataInstance.admins.find((a) => a.email === email);

      if (mockAdmin) {
        admin = mockAdmin;

        // For mock data, use simplified password check
        if (admin.passwordHash !== password) {
          console.warn(
            "[API /auth/login] Invalid password for mock admin:",
            email
          );
          return NextResponse.json(
            { error: "Invalid credentials" },
            { status: 401 }
          );
        }
      } else {
        console.warn("[API /auth/login] Admin not found in mock data:", email);
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        );
      }
    } else {
      admin = adminUsers[0];

      // Check if deleted
      if (admin.deletedAt) {
        console.warn(
          "[API /auth/login] Attempt to login with deleted admin account:",
          email
        );
        return NextResponse.json(
          { error: "Account not found" },
          { status: 404 }
        );
      }

      // Verify password using the proper password verification
      const isPasswordValid = await verifyPassword(
        password,
        admin.passwordHash
      );

      if (!isPasswordValid) {
        console.warn("[API /auth/login] Invalid password for email:", email);
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        );
      }
    }

    // At this point, authentication is successful
    // Update last login time for database admins
    if ("id" in admin && !("isActive" in admin)) {
      try {
        await db
          .update(administrators)
          .set({ lastLoginAt: new Date() })
          .where(eq(administrators.id, admin.id));
      } catch (updateError) {
        console.error(
          "[API /auth/login] Error updating last login time:",
          updateError
        );
        // Continue with login process even if update fails
      }
    }

    // Create JWT using the common createJWT function
    const token = await createJWT({
      sub: String(admin.id),
      email: admin.email,
      role: "isActive" in admin ? "admin" : admin.role,
      isAdmin: true,
    });

    console.log("[API /auth/login] Login successful for email:", email);

    // Remove sensitive data before returning
    const { passwordHash, ...adminDetails } = admin;

    // Create the response with JSON data
    const response = NextResponse.json({
      message: "Logged in successfully",
      user: {
        ...adminDetails,
        name:
          "isActive" in admin
            ? admin.name
            : admin.firstName && admin.lastName
            ? `${admin.firstName} ${admin.lastName}`
            : admin.firstName || "Administrator",
      },
    });

    // Set cookie directly on the response
    response.cookies.set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: env.NODE_ENV === "production",
      maxAge: 60 * 60 * 12, // 12 hours
    });

    return response;
  } catch (error) {
    console.error("[API /auth/login] Error processing login request:", error);
    return NextResponse.json(
      { error: "Internal Server Error during login" },
      { status: 500 }
    );
  }
}
