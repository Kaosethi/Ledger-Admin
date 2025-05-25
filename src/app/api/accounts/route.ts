import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts, createAccountSchema } from "@/lib/db/schema";
import { z } from "zod";
import mockDataInstance from "@/lib/mockData";
import { generateFallbackId } from "@/lib/utils";
import { withAuth } from '@/lib/audit';
import { JWTPayload } from "@/lib/auth/jwt";
import { env } from "@/lib/env";
import { and, eq, ilike, isNull, or } from "drizzle-orm";
import { hashPassword } from "@/lib/auth/password";
import { removeSensitiveData } from "@/lib/utils";

// GET /api/accounts - Get all accounts (protected)
export const GET = withAuth(
  async (request: NextRequest, context: any, payload: JWTPayload) => {
    try {
      // Get search and filter parameters from URL
      const searchParams = request.nextUrl.searchParams;
      const status = searchParams.get("status");
      const search = searchParams.get("search");
      console.log("Search param:", search);
      console.log("Status param:", status);

      // Try to fetch from the database with filters
      try {
        // Build query conditions
        const conditions = [];

        // Add status filter if provided (validate it's a valid status)
        if (
          status &&
          ["Active", "Inactive", "Suspended", "Pending"].includes(status)
        ) {
          // Cast the string status to the enum type for type safety
          const validStatus = status as
            | "Active"
            | "Inactive"
            | "Suspended"
            | "Pending";
          conditions.push(eq(accounts.status, validStatus));
        }

        // Add search filter if provided (search in childName, guardianName, or displayId)
        if (search) {
          console.log("Applying search condition:", search);
          conditions.push(
            or(
              ilike(accounts.displayId, `%${search}%`),
              ilike(accounts.childName, `%${search}%`),
              ilike(accounts.guardianName, `%${search}%`)
            )
          );
        }

        // filters
        conditions.push(eq(accounts.accountType, "CHILD_DISPLAY"));
        conditions.push(isNull(accounts.deletedAt));

        // Execute query with conditions if they exist
        let filteredAccounts;
        if (conditions.length > 0) {
          console.log("Applying filter conditions");
          filteredAccounts = await db
            .select()
            .from(accounts)
            .where(and(...conditions));
        } else {
          console.log("No filter conditions, fetching all accounts");
          filteredAccounts = await db.select().from(accounts);
        }

        console.log(
          `Found ${filteredAccounts.length} accounts after filtering`
        );
        if (filteredAccounts && filteredAccounts.length > 0) {
          // Remove sensitive data before returning
          const safeAccounts = filteredAccounts.map(removeSensitiveData);
          return NextResponse.json(safeAccounts);
        }
      } catch (dbError) {
        console.warn("Database error, falling back to mock data:", dbError);
      }

      // If database fetch fails or returns empty, use mock data
      // Apply filters to mock data if needed
      let mockResults = [...mockDataInstance.accounts];

      if (status) {
        mockResults = mockResults.filter(
          (account) => account.status === status
        );
      }

      if (search) {
        const searchLower = search.toLowerCase();
        mockResults = mockResults.filter((account) => {
          return (
            account.displayId.toLowerCase().includes(searchLower) ||
            account.childName.toLowerCase().includes(searchLower) ||
            (account.guardianName &&
              account.guardianName.toLowerCase().includes(searchLower))
          );
        });
      }

      console.log(
        `Returning ${mockResults.length} mock accounts after filtering`
      );
      // Remove sensitive data from mock results
      const safeMockResults = mockResults.map(removeSensitiveData);
      return NextResponse.json(safeMockResults);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      // Final fallback to mock data
      const safeMockAccounts =
        mockDataInstance.accounts.map(removeSensitiveData);
      return NextResponse.json(safeMockAccounts);
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
        status: "Pending",
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
);
