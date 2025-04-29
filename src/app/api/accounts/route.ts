import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts, createAccountSchema } from "@/lib/db/schema";
import { z } from "zod";
import mockDataInstance from "@/lib/mockData";

// GET /api/accounts - Get all accounts
export async function GET(request: Request, context: any) {
  try {
    // Try to fetch from the database
    try {
      const allAccounts = await db.select().from(accounts);
      if (allAccounts && allAccounts.length > 0) {
        return NextResponse.json(allAccounts);
      }
    } catch (dbError) {
      console.warn("Database error, falling back to mock data:", dbError);
    }

    // If database fetch fails or returns empty, use mock data
    return NextResponse.json(mockDataInstance.accounts);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    // Final fallback to mock data
    return NextResponse.json(mockDataInstance.accounts);
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

    try {
      // Insert new account with our generated id
      const newAccount = await db
        .insert(accounts)
        .values({
          id: accountId,
          ...accountData,
        })
        .returning();

      return NextResponse.json(newAccount[0], { status: 201 });
    } catch (dbError) {
      console.warn("Database error on POST, returning mock response:", dbError);
      // Return a mock response that would make sense for the client
      return NextResponse.json(
        {
          id: accountId,
          ...accountData,
          // Add any required fields that might be missing
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          status: "Active",
          balance: 0,
        },
        { status: 201 }
      );
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
