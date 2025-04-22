import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts, createAccountSchema } from "@/lib/db/schema";
import { z } from "zod";

// GET /api/accounts - Get all accounts
export async function GET(request: Request, context: any) {
  try {
    const allAccounts = await db.select().from(accounts);
    return NextResponse.json(allAccounts);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}

// POST /api/accounts - Create a new account
export async function POST(request: Request, context: any) {
  try {
    const body = await request.json();

    // Validate request body against schema
    const validatedData = createAccountSchema.parse(body);

    // Generate unique ID for account
    const accountId = `ACC${Date.now()}`;

    // Extract id from validatedData if it exists to avoid overwriting
    const { id, ...accountData } = validatedData;

    // Insert new account with our generated id
    const newAccount = await db
      .insert(accounts)
      .values({
        id: accountId,
        ...accountData,
      })
      .returning();

    return NextResponse.json(newAccount[0], { status: 201 });
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
