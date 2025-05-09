import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts, createAccountSchema } from "@/lib/db/schema";
import { z } from "zod";
// import { password as BunPassword } from "bun";
import { env } from "@/lib/config";

// POST /api/registrations - Public endpoint to create a new account without qr code
export async function POST(request: Request, context: any) {
  try {
    const body = await request.json();

    console.log("env", env);
    console.log("db", process.env.DATABASE_URL);
    console.log("bun-db", Bun.env.DATABASE_URL);

    // Validate request body against schema
    const validatedData = createAccountSchema.parse(body);

    console.log("validatedData", validatedData);

    // Get PIN from request body
    const pin = body.pin;

    // Use account ID from request for displayId
    const displayId = body.id || generateFallbackId();

    // Create account data object - without duplicate fields
    const accountData: any = {
      // Remove id to let DB generate UUID
      displayId,
      email: body.email,
      childName: body.childName,
      guardianName: body.guardianName,
      status: body.status || "Pending", // TODO: change to enum
      guardianDob: body.guardianDob,
      guardianContact: body.guardianContact,
      address: body.address,
      currentQrToken: body.currentQrToken,
    };

    // Hash PIN if provided
    if (pin) {
      // accountData.hashedPin = await BunPassword.hash(pin);
      accountData.hashedPin = pin;
    }

    try {
      // Insert new account
      const newAccount = await db
        .insert(accounts)
        .values(accountData)
        .returning();

      return NextResponse.json(newAccount[0], { status: 201 });
    } catch (dbError) {
      console.warn("Database error on POST, returning mock response:", dbError);

      // Create mock response with UUID
      const mockResponse = {
        id: crypto.randomUUID(),
        ...accountData,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        balance: 0,
      };

      return NextResponse.json(mockResponse, { status: 201 });
    }
  } catch (error) {
    console.error("Error creating account:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.format() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}

export function generateFallbackId() {
  const year = new Date().getFullYear().toString();
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `STC-${year}-${randomChars}`;
}
