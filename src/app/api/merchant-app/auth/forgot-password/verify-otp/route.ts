// src/app/api/merchant-app/auth/forgot-password/verify-otp/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db'; // Adjust path
import { merchants, passwordResetTokens } from '@/lib/db/schema'; // Adjust path
import { and, eq, desc, isNull, gte } from 'drizzle-orm';
import crypto from 'crypto';
import * as jose from 'jose'; // For generating the reset authorization token
import { env } from '@/lib/env'; // Import centralized environment variables

// Zod schema for request body validation
const verifyOtpBodySchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  otp: z.string().length(6, { message: 'OTP must be 6 digits' }).regex(/^\d+$/, { message: 'OTP must contain only digits' }),
});

export async function POST(req: NextRequest) {
  if (!env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables.');
    return NextResponse.json({ message: 'Server configuration error.' }, { status: 500 });
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json({ message: 'Invalid JSON body.' }, { status: 400 });
    }

    const validationResult = verifyOtpBodySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid request body.', errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, otp } = validationResult.data;

    // 1. Find the merchant
    const merchant = await db
      .select({ id: merchants.id, contactEmail: merchants.contactEmail })
      .from(merchants)
      .where(eq(merchants.contactEmail, email.toLowerCase()))
      .limit(1)
      .then((rows) => rows[0] || null);

    if (!merchant) {
      // Though we try to avoid email enumeration, at this stage, if the email wasn't valid
      // for an OTP request, it's unlikely they'd have a valid OTP.
      // However, a generic message is still safer.
      return NextResponse.json({ message: 'Invalid OTP or email.' }, { status: 400 });
    }

    // 2. Find the latest, valid (non-expired, non-used) OTP token for this merchant
    const now = new Date();
    const tokenRecord = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.merchantId, merchant.id),
          isNull(passwordResetTokens.usedAt),       // Not already used
          gte(passwordResetTokens.expiresAt, now) // Not expired
        )
      )
      .orderBy(desc(passwordResetTokens.createdAt)) // Get the most recent one
      .limit(1)
      .then((rows) => rows[0] || null);

    if (!tokenRecord) {
      return NextResponse.json({ message: 'Invalid or expired OTP. Please request a new one.' }, { status: 400 });
    }

    // 3. Hash the submitted OTP and compare with the stored hash
    const submittedOtpHash = crypto.createHash('sha256').update(otp).digest('hex');

    if (submittedOtpHash !== tokenRecord.tokenHash) {
      // Optional: Implement attempt tracking on the tokenRecord if desired
      return NextResponse.json({ message: 'Invalid OTP. Please check the code and try again.' }, { status: 400 });
    }

    // 4. OTP is valid! Mark it as used.
    await db
      .update(passwordResetTokens)
      .set({ usedAt: now })
      .where(eq(passwordResetTokens.id, tokenRecord.id));

    // 5. Generate a short-lived "Reset Authorization Token" (JWT)
    // This token will be used to authorize the actual password change.
    const resetAuthTokenPayload = {
      merchantId: merchant.id,
      email: merchant.contactEmail, // Could be useful for logging or confirmation
      purpose: 'password-reset-authorization', // Good practice to scope tokens
    };
    
    // Create a new JWT with jose
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const resetAuthorizationToken = await new jose.SignJWT(resetAuthTokenPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${env.RESET_AUTH_TOKEN_EXPIRY_MINUTES}m`)
      .sign(secret);

    // 6. Return the reset authorization token to the client
    return NextResponse.json(
      {
        message: 'OTP verified successfully. You can now reset your password.',
        resetAuthorizationToken: resetAuthorizationToken,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Verify OTP process failed:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}