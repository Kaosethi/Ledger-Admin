// src/app/api/merchant-app/beneficiaries/validate-qr/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { accounts, accountStatusEnum } from '@/lib/db/schema'; // Ensure this path is correct
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// QrPayloadSchema expects 'account' which will be matched against 'display_id'
const QrPayloadSchema = z.object({
  type: z.string().optional(), // Or whatever your actual schema is
  account: z.string().uuid("Account ID from QR must be a valid UUID"), // <--- THIS IS THE LINE TO CHANGE
  version: z.string().optional(),
  signature: z.string().optional(),
});

interface ValidatedBeneficiaryResponse {
  id: string;   // This will be the account's displayId
  name: string; // This will be the account's childName
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[API /validate-qr] Received body for validation:', JSON.stringify(body, null, 2));

    const validationResult = QrPayloadSchema.safeParse(body);

    if (!validationResult.success) {
      console.error('[API /validate-qr] Invalid QR payload structure:', validationResult.error.flatten());
      return NextResponse.json(
        { error: 'Invalid QR payload structure.', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const qrPayload = validationResult.data;
    const accountDisplayIdFromQr = qrPayload.account; // This is the UUID like "aad91..."

    console.log('[API /validate-qr] Attempting to validate display_id from QR:', accountDisplayIdFromQr);

    const foundAccounts = await db
      .select({
        dbDisplayId: accounts.displayId,
        dbChildName: accounts.childName,
        dbStatus: accounts.status,
      })
      .from(accounts)
      .where(eq(accounts.displayId, accountDisplayIdFromQr)) // Match the 'account' from QR with 'display_id' in DB
      .limit(1);

    if (foundAccounts.length === 0) {
      console.warn('[API /validate-qr] Account not found for display_id:', accountDisplayIdFromQr);
      return NextResponse.json({ error: 'Beneficiary account (display_id) not found.' }, { status: 404 });
    }

    const accountFromDb = foundAccounts[0];
    console.log('[API /validate-qr] Found account in DB:', accountFromDb);

    // Check account status
    if (accountFromDb.dbStatus !== accountStatusEnum.enumValues[1]) { // 'Active'
      console.warn(`[API /validate-qr] Account found but not active. Display ID: ${accountDisplayIdFromQr}, Status: ${accountFromDb.dbStatus}`);
      return NextResponse.json(
        { error: `Beneficiary account is not active (status: ${accountFromDb.dbStatus}).` },
        { status: 403 }
      );
    }

    const responsePayload: ValidatedBeneficiaryResponse = {
      id: accountFromDb.dbDisplayId, // Return the display_id as 'id'
      name: accountFromDb.dbChildName,
    };

    console.log('[API /validate-qr] Validation successful. Responding with:', responsePayload);
    return NextResponse.json(responsePayload, { status: 200 });

  } catch (error) {
    console.error('[API /validate-qr] Critical error during QR validation:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON payload provided.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error while validating QR code.' }, { status: 500 });
  }
}
