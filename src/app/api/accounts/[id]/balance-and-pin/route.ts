import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts, adminLogs } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/password";

// Define a schema for the request body
const updateSchema = z.object({
  balance: z.number().min(0).max(5000).optional(),
  pin: z
    .string()
    .regex(/^\d{4}$/, "PIN must be exactly 4 digits")
    .optional(),
  qrCode: z.string().optional(),
});

// PATCH /api/accounts/[id]/balance-and-pin - Update balance and 4-digit pin
export const PATCH = withAuth(
  async (request: NextRequest, context: any): Promise<NextResponse> => {
    try {
      // Validate the input
      const parsedBody = await request.json().catch(() => {
        throw new Error("Invalid JSON body");
      });

      const { balance, pin, qrCode } = updateSchema.parse(parsedBody);

      // Make sure at least one field is provided
      if (balance === undefined && pin === undefined) {
        return NextResponse.json(
          { error: "At least one field (balance or pin) must be provided" },
          { status: 400 }
        );
      }

      const now = new Date();
      const accountId = context.params.id;

      // First, check if the account exists and get current data
      const existingAccount = await db
        .select({
          id: accounts.id,
          displayId: accounts.displayId,
          childName: accounts.childName,
          guardianName: accounts.guardianName,
          status: accounts.status,
          balance: accounts.balance,
        })
        .from(accounts)
        .where(and(isNull(accounts.deletedAt), eq(accounts.id, accountId)))
        .limit(1);

      if (!existingAccount.length) {
        return NextResponse.json(
          { error: "Account not found" },
          { status: 404 }
        );
      }

      // Prepare the update object
      const update: Record<string, any> = {
        updatedAt: now,
        lastActivity: now,
      };

      // Add balance update if provided
      if (balance !== undefined) {
        update.balance = balance;
      }

      // Hash and add PIN if provided
      if (pin) {
        // Hash the PIN before storing
        update.hashedPin = await hashPassword(pin);
      }

      // Add qrCode if provided
      if (qrCode) {
        update.currentQrToken = qrCode;
      }

      // Update the account
      const updatedAccount = await db
        .update(accounts)
        .set(update)
        .where(and(isNull(accounts.deletedAt), eq(accounts.id, accountId)))
        .returning({
          id: accounts.id,
          displayId: accounts.displayId,
          childName: accounts.childName,
          guardianName: accounts.guardianName,
          status: accounts.status,
          balance: accounts.balance,
          updatedAt: accounts.updatedAt,
          lastActivity: accounts.lastActivity,
          // Include other fields needed by the frontend
          guardianDob: accounts.guardianDob,
          guardianContact: accounts.guardianContact,
          email: accounts.email,
          address: accounts.address,
          createdAt: accounts.createdAt,
        });
      return NextResponse.json(updatedAccount);
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
        {
          error: "Failed to update account",
          message: (error as Error).message,
        },
        { status: 500 }
      );
    }
  }
);
