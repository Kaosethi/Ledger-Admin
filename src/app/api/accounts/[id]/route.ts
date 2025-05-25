import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { eq, ne, isNull, and } from "drizzle-orm";
import { withAuth } from '@/lib/audit';
import { JWTPayload } from "@/lib/auth/jwt";
import { z } from "zod";
import { removeSensitiveData } from "@/lib/utils";

// Schema for updating insensitive data only
const updateSchema = z.object({
  guardianName: z.string().min(1, "Guardian name is required").optional(),
  guardianDob: z.string().optional(),
  guardianContact: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/accounts/[id] - Get a specific account by ID
export const GET = withAuth(
  async (request: NextRequest, context: any, payload: JWTPayload) => {
    try {
      const account = await db
        .select()
        .from(accounts)
        // filter soft deleted accounts
        .where(
          and(isNull(accounts.deletedAt), eq(accounts.id, context.params.id))
        );

      if (!account.length) {
        return NextResponse.json(
          { error: "Account not found" },
          { status: 404 }
        );
      }

      // Remove sensitive data before returning
      const safeAccount = removeSensitiveData(account[0]);
      return NextResponse.json(safeAccount);
    } catch (error) {
      console.error("Error fetching account:", error);
      return NextResponse.json(
        { error: "Failed to fetch account" },
        { status: 500 }
      );
    }
  }
);

// PATCH /api/accounts/[id] - Update an account (insensitive fields only)
export const PATCH = withAuth(
  async (request: NextRequest, context: any, payload: JWTPayload) => {
    try {
      const body = await request.json();

      // Validate that only insensitive fields are being updated
      const validatedData = updateSchema.parse(body);

      // Update account with only the validated insensitive fields
      const updatedAccount = await db
        .update(accounts)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(
          and(
            isNull(accounts.deletedAt),
            eq(accounts.id, context.params.id),
            ne(accounts.status, "Suspended")
          )
        )
        .returning();

      if (!updatedAccount.length) {
        return NextResponse.json(
          { error: "Account not found" },
          { status: 404 }
        );
      }

      // Remove sensitive data before returning
      const safeAccount = removeSensitiveData(updatedAccount[0]);
      return NextResponse.json(safeAccount);
    } catch (error) {
      console.error("Error updating account:", error);

      // Handle validation errors
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "Validation error",
            details: error.format(),
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Failed to update account" },
        { status: 500 }
      );
    }
  }
);

// DELETE /api/accounts/[id] - Delete an account
export const DELETE = withAuth(
  async (request: NextRequest, context: any, payload: JWTPayload) => {
    try {
      const deletedAccount = await db
        .delete(accounts)
        .where(eq(accounts.id, context.params.id))
        .returning();

      if (!deletedAccount.length) {
        return NextResponse.json(
          { error: "Account not found" },
          { status: 404 }
        );
      }

      // Remove sensitive data before returning
      const safeAccount = removeSensitiveData(deletedAccount[0]);
      return NextResponse.json(safeAccount);
    } catch (error) {
      console.error("Error deleting account:", error);
      return NextResponse.json(
        { error: "Failed to delete account" },
        { status: 500 }
      );
    }
  }
);
