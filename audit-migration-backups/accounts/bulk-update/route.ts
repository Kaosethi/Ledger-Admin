import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { withAuth } from "@/lib/auth/middleware";
import { z } from "zod";
import { removeSensitiveData } from "@/lib/utils";

export const POST = withAuth(async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accountIds, balanceAction, amount, statusAction } = body;

    // Validate input
    if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
      return NextResponse.json(
        { error: "No account IDs provided" },
        { status: 400 }
      );
    }

    if (
      balanceAction !== "add" &&
      balanceAction !== "set" &&
      balanceAction !== "nochange"
    ) {
      return NextResponse.json(
        { error: "Invalid balance action" },
        { status: 400 }
      );
    }

    if (
      statusAction !== "nochange" &&
      statusAction !== "activate" &&
      statusAction !== "suspend"
    ) {
      return NextResponse.json(
        { error: "Invalid status action" },
        { status: 400 }
      );
    }

    if (
      (balanceAction === "add" || balanceAction === "set") &&
      (amount === undefined || isNaN(amount) || amount < 0)
    ) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Get current accounts to track changes and for logging
    const currentAccounts = await db
      .select()
      .from(accounts)
      .where(inArray(accounts.id, accountIds));
    if (currentAccounts.length === 0) {
      return NextResponse.json(
        { error: "No accounts found with the provided IDs" },
        { status: 404 }
      );
    }

    // Process each account
    const updatedAccounts = [];
    let failedUpdates = 0;

    for (const account of currentAccounts) {
      try {
        // Prepare update data
        const updateData: Record<string, any> = {
          updatedAt: new Date(),
        };

        // Handle balance changes
        if (balanceAction === "add" && amount !== undefined) {
          updateData.balance = Number(account.balance || 0) + amount;
        } else if (balanceAction === "set" && amount !== undefined) {
          updateData.balance = amount;
        }

        // Handle status changes
        if (statusAction === "activate") {
          updateData.status = "Active";
        } else if (statusAction === "suspend") {
          updateData.status = "Suspended";
        }

        // Update the account
        const [updatedAccount] = await db
          .update(accounts)
          .set(updateData)
          .where(eq(accounts.id, account.id))
          .returning();

        if (updatedAccount) {
          // Remove sensitive data before adding to response
          const safeAccount = removeSensitiveData(updatedAccount);
          updatedAccounts.push(safeAccount);

          // Log the activity
          const changes = [];
          if (balanceAction !== "nochange") {
            changes.push(
              `balance ${
                balanceAction === "add" ? "increased by" : "set to"
              } ${amount}`
            );
          }
          if (statusAction !== "nochange") {
            changes.push(
              `status ${
                statusAction === "activate" ? "activated" : "suspended"
              }`
            );
          }
        } else {
          failedUpdates++;
        }
      } catch (error) {
        console.error(`Error updating account ${account.id}:`, error);
        failedUpdates++;
      }
    }

    // Revalidate the accounts page to reflect changes
    revalidatePath("/accounts");

    return NextResponse.json({
      success: true,
      updatedAccounts,
      totalUpdated: updatedAccounts.length,
      totalFailed: failedUpdates,
    });
  } catch (error) {
    console.error("Error in bulk update:", error);
    return NextResponse.json(
      { error: "Failed to process bulk update" },
      { status: 500 }
    );
  }
});
