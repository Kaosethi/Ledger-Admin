import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/accounts/[id] - Get a specific account by ID
export async function GET(request: Request, context: any) {
  try {
    const account = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, context.params.id));

    if (!account.length) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json(account[0]);
  } catch (error) {
    console.error("Error fetching account:", error);
    return NextResponse.json(
      { error: "Failed to fetch account" },
      { status: 500 }
    );
  }
}

// PATCH /api/accounts/[id] - Update an account
export async function PATCH(request: Request, context: any) {
  try {
    const body = await request.json();

    // Update account
    const updatedAccount = await db
      .update(accounts)
      .set(body)
      .where(eq(accounts.id, context.params.id))
      .returning();

    if (!updatedAccount.length) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json(updatedAccount[0]);
  } catch (error) {
    console.error("Error updating account:", error);
    return NextResponse.json(
      { error: "Failed to update account" },
      { status: 500 }
    );
  }
}

// DELETE /api/accounts/[id] - Delete an account
export async function DELETE(request: Request, context: any) {
  try {
    const deletedAccount = await db
      .delete(accounts)
      .where(eq(accounts.id, context.params.id))
      .returning();

    if (!deletedAccount.length) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json(deletedAccount[0]);
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
