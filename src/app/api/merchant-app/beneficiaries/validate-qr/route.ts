// src/app/api/merchant-app/beneficiaries/validate-qr/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { accounts, accountStatusEnum } from '@/lib/db/schema'; // Import accountStatusEnum
import { eq } from 'drizzle-orm';

// Define a regex that matches your account displayId format
// Example: STC-YYYY-NNNN or MIA-YYYY-NNNN etc. Adjust if format varies.
const accountDisplayIdRegex = /^[A-Z]{3}-\d{4}-[A-Z0-9]{4}(?:-[A-Z0-9]{1,4})?$/; 
// Example STC-2025-3T6W. If it's always 4 alphanumeric for the last part: /^[A-Z]{3}-\d{4}-[A-Z0-9]{4}$/

const QrPayloadSchema = z.object({
  type: z.string().optional(),
  account: z.string().regex(accountDisplayIdRegex, "Account identifier from QR must be a valid display ID format"), // <<< CHANGED: Expect displayId format
  // version: z.string().optional(), // 'version' was in your schema, 'ver' in client log. Standardize.
  ver: z.string().optional(), // Matching client log
  // signature: z.string().optional(), // 'signature' was in your schema, 'sig' in client log. Standardize.
  sig: z.string().optional(), // Matching client log
});

export async function POST(request: NextRequest) {
  console.log("[API POST /validate-qr] Received request.");
  try {
    const body = await request.json();
    console.log("[API POST /validate-qr] Raw body:", JSON.stringify(body));
    const validationResult = QrPayloadSchema.safeParse(body);

    if (!validationResult.success) {
      console.warn("[API POST /validate-qr] Zod validation failed:", validationResult.error.flatten().fieldErrors);
      return NextResponse.json(
        {
          error: 'Invalid QR payload structure.',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    console.log("[API POST /validate-qr] Zod validation successful.");

    // 'accountDisplayIdFromQr' is the displayId from the QR code (e.g., "STC-2025-3T6W")
    const { account: accountDisplayIdFromQr } = validationResult.data;
    console.log(`[API POST /validate-qr] Attempting to find account by displayId: ${accountDisplayIdFromQr}`);

    const foundAccounts = await db
      .select({
        id: accounts.id, // The internal UUID of the account
        displayId: accounts.displayId, // The human-readable displayId (which was scanned)
        name: accounts.childName,
        status: accounts.status,
        // Add any other fields needed by the client after validation
      })
      .from(accounts)
      .where(eq(accounts.displayId, accountDisplayIdFromQr)); // <<< CHANGED: Query by accounts.displayId

    if (foundAccounts.length === 0) {
      console.warn(`[API POST /validate-qr] Account with displayId '${accountDisplayIdFromQr}' not found.`);
      return NextResponse.json(
        { error: `Beneficiary account with identifier '${accountDisplayIdFromQr}' not found.` },
        { status: 404 }
      );
    }

    const accountFromDb = foundAccounts[0];
    console.log(`[API POST /validate-qr] Account found: UUID=${accountFromDb.id}, DisplayID=${accountFromDb.displayId}, Status=${accountFromDb.status}`);

    // Use the imported enum for status comparison for type safety
    if (accountFromDb.status !== accountStatusEnum.enumValues.find(s => s === 'Active')) {
      console.warn(`[API POST /validate-qr] Account ${accountFromDb.displayId} is not active. Status: ${accountFromDb.status}`);
      return NextResponse.json(
        { error: 'Beneficiary account is not active.' },
        { status: 403 } // 403 Forbidden is appropriate for a valid account that cannot be used
      );
    }

    console.log(`[API POST /validate-qr] Account ${accountFromDb.displayId} is active. Returning details.`);
    // If found and active, return beneficiary details.
    // The client will receive the displayId (which it scanned) and the name.
    // It might also need the internal UUID (accountFromDb.id) for subsequent operations like creating a transaction.
    return NextResponse.json(
      {
        accountId: accountFromDb.id,         // The internal UUID, useful for further processing
        accountDisplayId: accountFromDb.displayId, // The scanned displayId
        name: accountFromDb.name,
        // You can add other safe-to-expose details if needed
      },
      { status: 200 }
    );
  } catch (error: any) { // Catch as 'any'
    console.error('[API POST /validate-qr] Error validating QR:', error);
    if (error instanceof SyntaxError && error.message.toLowerCase().includes("json")) { // More specific JSON error check
        return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
    }
    // If you have custom ApiError types and they are thrown, they could be handled here
    // if (error instanceof ApiError) { 
    //   return NextResponse.json({ error: error.message, details: error.details }, { status: error.statusCode });
    // }
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred during QR validation.' },
      { status: 500 }
    );
  }
}