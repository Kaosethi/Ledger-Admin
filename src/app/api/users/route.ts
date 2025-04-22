import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createUserSchema, users } from "@/lib/db/schema";
import { z } from "zod";

// GET /api/users - Get all users
export async function GET() {
  try {
    const allUsers = await db.select().from(users);
    return NextResponse.json(allUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request body against schema
    const validatedData = createUserSchema.parse(body);

    // Insert new user
    const newUser = await db.insert(users).values(validatedData).returning();

    return NextResponse.json(newUser[0], { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.format() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
