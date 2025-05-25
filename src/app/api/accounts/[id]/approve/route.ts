import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuditLogging, logAccountStatusChange } from "@/lib/audit";
import { JWTPayload } from "@/lib/auth/jwt";
import { removeSensitiveData } from "@/lib/utils";

// PATCH /api/accounts/[id]/approve - Approve an account (set status to Active)
export const PATCH = withAuditLogging(
  async (
    request: NextRequest,
    context: any,
    payload: JWTPayload,
    auditContext
  ) => {
    try {
      const accountId = context.params.id;

      // First, get the current account to log the status change
      const currentAccount = await db
        .select()
        .from(accounts)
        .where(and(isNull(accounts.deletedAt), eq(accounts.id, accountId)));

      if (!currentAccount.length) {
        return NextResponse.json(
          { error: "Account not found" },
          { status: 404 }
        );
      }

      const oldStatus = currentAccount[0].status;
      const now = new Date();

      // Update account status to Active
      const updatedAccount = await db
        .update(accounts)
        .set({
          status: "Active",
          updatedAt: now,
          lastActivity: now,
        })
        .where(and(isNull(accounts.deletedAt), eq(accounts.id, accountId)))
        .returning();

      // Log the status change using the audit helper
      await logAccountStatusChange(
        auditContext,
        accountId,
        oldStatus,
        "Active",
        "Account approved by administrator"
      );

      // Remove sensitive data before returning
      const safeAccount = removeSensitiveData(updatedAccount[0]);
      return NextResponse.json(safeAccount);
    } catch (error) {
      console.error("Error approving account:", error);
      return NextResponse.json(
        { error: "Failed to approve account" },
        { status: 500 }
      );
    }
  }
);
