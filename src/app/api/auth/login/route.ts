import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { administrators, adminLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Authentication schema for login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/auth/login - Login as administrator
export async function POST(request: Request, context: any) {
  try {
    const { email, password } = await request.json();

    // Find administrator by email
    const admin = await db
      .select()
      .from(administrators)
      .where(eq(administrators.email, email));

    if (!admin.length) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(
      password,
      admin[0].passwordHash
    );
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Create admin log
    await db.insert(adminLogs).values({
      id: `LOG${Date.now()}`,
      adminEmail: admin[0].email,
      action: "login",
      timestamp: new Date(),
    });

    // Return success response
    return NextResponse.json({
      message: "Login successful",
      admin: {
        id: admin[0].id,
        email: admin[0].email,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    return NextResponse.json({ error: "Failed to login" }, { status: 500 });
  }
}
