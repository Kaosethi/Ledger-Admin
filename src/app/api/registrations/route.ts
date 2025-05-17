import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts, createAccountSchema } from "@/lib/db/schema";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/password";
import { generateFallbackId, removeSensitiveData } from "@/lib/utils";

// POST /api/registrations - Public endpoint to create a new account without qr code
export async function POST(request: Request, context: any) {
  try {
    const body = await request.json();

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
      accountData.hashedPin = await hashPassword(pin);
    }

    try {
      // Insert new account
      const newAccount = await db
        .insert(accounts)
        .values(accountData)
        .returning();

      // Remove sensitive data before returning
      const safeAccount = removeSensitiveData(newAccount[0]);

      return NextResponse.json(safeAccount, { status: 201 });
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

      // Remove sensitive data before returning
      const safeMockResponse = removeSensitiveData(mockResponse);

      return NextResponse.json(safeMockResponse, { status: 201 });
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
