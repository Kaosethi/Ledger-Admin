// src/app/api/merchant-app/auth/forgot-password/reset/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { merchants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import * as jose from 'jose';
// Import your existing password hashing function
import { hashPassword } from '@/lib/auth/password';
import { env } from '@/lib/env'; // Import centralized environment variables

// Zod schema for request body validation
const resetPasswordBodySchema = z.object({
  resetAuthorizationToken: z.string().min(1, { message: 'Reset token is required' }),
  newPassword: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
  // Add more password complexity rules if needed
});

interface DecodedResetToken {
  merchantId: string;
  email?: string;
  purpose: string;
  iat: number;
  exp: number;
}

export async function POST(req: NextRequest) {
  if (!env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined. Password reset cannot proceed.');
    return NextResponse.json({ message: 'Server configuration error.' }, { status: 500 });
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json({ message: 'Invalid JSON body.' }, { status: 400 });
    }

    const validationResult = resetPasswordBodySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid request body.', errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { resetAuthorizationToken, newPassword } = validationResult.data;

    let decodedTokenPayload: DecodedResetToken;
    try {
      const secret = new TextEncoder().encode(env.JWT_SECRET);
      const { payload } = await jose.jwtVerify(resetAuthorizationToken, secret);
      decodedTokenPayload = payload as unknown as DecodedResetToken;
    } catch (error: any) {
      console.error("JWT verification failed:", error.message);
      if (error.code === 'ERR_JWT_EXPIRED') {
        return NextResponse.json({ message: 'Password reset session has expired. Please start over.' }, { status: 401 });
      }
      return NextResponse.json({ message: 'Invalid or malformed reset token. Please start over.' }, { status: 401 });
    }

    if (decodedTokenPayload.purpose !== 'password-reset-authorization') {
      console.warn(`Invalid JWT purpose: ${decodedTokenPayload.purpose}`);
      return NextResponse.json({ message: 'Invalid reset token (purpose mismatch). Please start over.' }, { status: 401 });
    }

    const merchantId = decodedTokenPayload.merchantId;
    if (!merchantId) {
        console.error("Merchant ID not found in JWT payload.");
        return NextResponse.json({ message: 'Invalid reset token (missing merchant ID). Please start over.' }, { status: 401 });
    }

    const merchantExists = await db
      .select({ id: merchants.id })
      .from(merchants)
      .where(eq(merchants.id, merchantId))
      .limit(1)
      .then((rows) => rows[0] || null);

    if (!merchantExists) {
      console.error(`Merchant with ID ${merchantId} not found during password reset.`);
      return NextResponse.json({ message: 'Could not reset password. User not found.' }, { status: 404 });
    }

    // Use your existing hashPassword function.
    // It handles salt generation and formatting the hash string correctly.
    const newHashedPassword = await hashPassword(newPassword);

    // Update the merchant's hashedPassword in the database.
    // Your `merchants` table only needs a `hashedPassword` column as the salt is part of the hash string.
    await db
      .update(merchants)
      .set({ 
          hashedPassword: newHashedPassword,
          // No separate 'salt' column update needed because your hashPassword function embeds it
        })
      .where(eq(merchants.id, merchantId));

    console.log(`Password reset successfully for merchant ID: ${merchantId}`);

    return NextResponse.json(
      { message: 'Your password has been reset successfully. You can now log in with your new password.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Reset password process failed:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}