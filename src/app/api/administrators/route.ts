import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { administrators, createAdministratorSchema } from "@/lib/db/schema";
import { z } from "zod";

// GET /api/administrators - Get all administrators
export async function GET(request: Request, context: any) {
  try {
    const allAdmins = await db.select().from(administrators);
    return NextResponse.json(allAdmins);
  } catch (error) {
    console.error("Error fetching administrators:", error);
    return NextResponse.json(
      { error: "Failed to fetch administrators" },
      { status: 500 }
    );
  }
}

// POST /api/administrators - Create a new administrator
export async function POST(request: Request, context: any) {
  try {
    const body = await request.json();

    // Validate request body against schema
    const validatedData = createAdministratorSchema.parse(body);

    // Extract password for hashing
    const { password, ...adminData } = validatedData;

    // In a real application, you would hash the password here
    // For example: const passwordHash = await bcrypt.hash(password, 10);

    // Insert new administrator with hashed password
    const newAdmin = await db
      .insert(administrators)
      .values({
        ...adminData,
        passwordHash: password, // Replace with actual password hashing
      })
      .returning();

    return NextResponse.json(newAdmin[0], { status: 201 });
  } catch (error) {
    console.error("Error creating administrator:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.format() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create administrator" },
      { status: 500 }
    );
  }
}
