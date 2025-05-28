// src/app/api/merchant-app/beneficiaries/validate-qr/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts, accountStatusEnum } from "@/lib/db/schema"; // Ensure accountStatusEnum is imported
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  console.log("[API POST /validate-qr] Received request to validate QR.");
  try {
    const body = await request.json();
    console.log(body);

    // Extract account ID directly from the request body
    const { account: accountIdFromQr } = body;

    if (!accountIdFromQr) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }

    console.log(
      `[API POST /validate-qr] Attempting to find account by UUID: ${accountIdFromQr}`
    );

    const foundAccounts = await db
      .select({
        retrievedAccountUUID: accounts.id, // The internal UUID of the account
        retrievedAccountDisplayId: accounts.displayId, // The human-readable displayId
        retrievedAccountName: accounts.childName,
        retrievedAccountStatus: accounts.status,
      })
      .from(accounts)
      .where(eq(accounts.id, accountIdFromQr)) // Query by the account's primary UUID key
      .limit(1); // Expecting only one account for a given UUID

    if (foundAccounts.length === 0) {
      console.warn(
        `[API POST /validate-qr] Account with UUID '${accountIdFromQr}' not found in database.`
      );
      return NextResponse.json(
        { error: `Beneficiary account (ID: ${accountIdFromQr}) not found.` },
        { status: 404 }
      );
    }

    const accountFromDb = foundAccounts[0];
    console.log(
      `[API POST /validate-qr] Account found: UUID=${accountFromDb.retrievedAccountUUID}, DisplayID=${accountFromDb.retrievedAccountDisplayId}, Status=${accountFromDb.retrievedAccountStatus}`
    );

    // Check if the account is active using the imported enum for type safety
    if (
      accountFromDb.retrievedAccountStatus !==
      accountStatusEnum.enumValues.find((s) => s === "Active")
    ) {
      console.warn(
        `[API POST /validate-qr] Account ${accountFromDb.retrievedAccountDisplayId} (UUID: ${accountFromDb.retrievedAccountUUID}) is not active. Status: ${accountFromDb.retrievedAccountStatus}`
      );
      return NextResponse.json(
        {
          error: "Beneficiary account is not active.",
          currentStatus: accountFromDb.retrievedAccountStatus,
        },
        { status: 403 } // 403 Forbidden is appropriate for a valid account that cannot be used
      );
    }

    console.log(
      `[API POST /validate-qr] Account ${accountFromDb.retrievedAccountDisplayId} is active. Returning details to client.`
    );
    // If found and active, return beneficiary details to the client.
    // Client will need UUID for processing, and DisplayID/Name for showing to user.
    return NextResponse.json(
      {
        accountId: accountFromDb.retrievedAccountUUID, // The internal UUID (client uses this for next API calls)
        accountDisplayId: accountFromDb.retrievedAccountDisplayId, // The human-readable ID (for display on client)
        name: accountFromDb.retrievedAccountName, // Account holder's name (for display on client)
        // status: accountFromDb.retrievedAccountStatus,     // Optionally return status if client needs it
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(
      "[API POST /validate-qr] Error during QR validation process:",
      {
        message: error.message,
        stack: error.stack, // Full stack for server-side debugging
        errorObject: JSON.stringify(error, Object.getOwnPropertyNames(error)), // Log the whole error object
      }
    );
    if (
      error instanceof SyntaxError &&
      error.message.toLowerCase().includes("json")
    ) {
      return NextResponse.json(
        { error: "Invalid JSON payload provided to server." },
        { status: 400 }
      );
    }
    // Add more specific error handling here if needed (e.g. for custom ApiError types if thrown from helpers)
    return NextResponse.json(
      {
        error:
          error.message || "An unexpected error occurred during QR validation.",
      },
      { status: 500 }
    );
  }
}
