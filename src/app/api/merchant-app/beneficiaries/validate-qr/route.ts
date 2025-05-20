// src/app/api/merchant-app/beneficiaries/validate-qr/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { accounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const QrPayloadSchema = z.object({
  type: z.string().optional(),
  account: z.string().uuid("Account ID from QR must be a valid UUID"), // This 'account' field from QR is the UUID that matches accounts.id
  version: z.string().optional(),
  signature: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = QrPayloadSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid QR payload structure.',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // 'accountFromQr' is the UUID from the QR code, which maps to the 'id' column in the database
    const { account: accountIdFromQr } = validationResult.data;

    const foundAccounts = await db
      .select({
        // What the client receives as 'id' should probably be the user-friendly display_id
        id: accounts.displayId,    // e.g., "STC-2025-685V"
        name: accounts.childName,
        status: accounts.status,
        // If the client also needs the internal UUID that was scanned, you can add it:
        // scannedUuid: accounts.id
      })
      .from(accounts)
      .where(eq(accounts.id, accountIdFromQr)); // <--- CORRECTED: Query by accounts.id

    if (foundAccounts.length === 0) {
      return NextResponse.json(
        // You might want to refine this error message slightly if 'display_id' is no longer the query term for UUIDs
        { error: 'Beneficiary account (ID) not found.' },
        { status: 404 }
      );
    }

    const accountFromDb = foundAccounts[0];

    if (accountFromDb.status !== 'Active') {
      return NextResponse.json(
        { error: 'Beneficiary account is not active.' },
        { status: 403 }
      );
    }

    // If found and active, return beneficiary details
    // The 'id' field in the response will be the accounts.displayId
    return NextResponse.json(
      {
        id: accountFromDb.id, // This is accounts.displayId from the select statement
        name: accountFromDb.name,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error validating QR:', error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}