import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { merchants, createMerchantSchema } from "@/lib/db/schema";
import { z } from "zod";

// GET /api/merchants - Get all merchants
export async function GET(request: Request, context: any) {
  try {
    const allMerchants = await db.select().from(merchants);
    return NextResponse.json(allMerchants);
  } catch (error) {
    console.error("Error fetching merchants:", error);
    return NextResponse.json(
      { error: "Failed to fetch merchants" },
      { status: 500 }
    );
  }
}

// POST /api/merchants - Create a new merchant
export async function POST(request: Request, context: any) {
  try {
    const body = await request.json();

    // Validate request body against schema
    const validatedData = createMerchantSchema.parse(body);

    // Extract password and id for hashing
    const { password, id, ...merchantData } = validatedData;

    // Generate unique ID for merchant
    const merchantId = `MERCH${Date.now()}`;

    // In a real application, you would hash the password here
    // For example: const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new merchant
    const newMerchant = await db
      .insert(merchants)
      .values({
        id: merchantId,
        ...merchantData,
        hashedPassword: password, // Replace with actual password hashing
      })
      .returning();

    return NextResponse.json(newMerchant[0], { status: 201 });
  } catch (error) {
    console.error("Error creating merchant:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.format() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create merchant" },
      { status: 500 }
    );
  }
}
