import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts, createAccountSchema } from "@/lib/db/schema";
import { z } from "zod";
import mockDataInstance from "@/lib/mockData";
import { password as BunPassword } from "bun";
import { generateFallbackId } from "../registrations/route";
import { withAuth } from "@/lib/auth/middleware";
import { JWTPayload } from "@/lib/auth/jwt";
import { env } from "@/lib/config";

// GET /api/accounts - Get all accounts (protected)
export const GET = withAuth(
  async (request: NextRequest, context: any, payload: JWTPayload) => {
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
);

// POST /api/accounts - Create a new account (protected)
export const POST = withAuth(
  async (request: NextRequest, context: any, payload: JWTPayload) => {
    console.log("env", env);
    try {
      const body = await request.json();

      // Validate request body against schema
      const validatedData = createAccountSchema.parse(body);

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
        status: body.status || "Pending",
        guardianDob: body.guardianDob,
        guardianContact: body.guardianContact,
        address: body.address,
        currentQrToken: body.currentQrToken,
      };

      // Hash PIN if provided
      if (pin) {
        accountData.hashedPin = await BunPassword.hash(pin);
      }

      try {
        // Insert new account
        const newAccount = await db
          .insert(accounts)
          .values(accountData)
          .returning();

        return NextResponse.json(newAccount[0], { status: 201 });
      } catch (dbError) {
        console.warn(
          "Database error on POST, returning mock response:",
          dbError
        );

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
);
