// src/app/api/merchant-app/auth/forgot-password/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db'; // Adjust path
import { merchants, passwordResetTokens } from '@/lib/db/schema'; // Adjust path
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '15', 10);

const requestBodySchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }
    
    const validationResult = requestBodySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: 'Invalid request body',
          // errors: validationResult.error.flatten().fieldErrors, 
        },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;

    const existingMerchant = await db
      .select({
        id: merchants.id,
        contactEmail: merchants.contactEmail,
        businessName: merchants.businessName,
      })
      .from(merchants)
      .where(eq(merchants.contactEmail, email.toLowerCase()))
      .limit(1)
      .then((rows) => rows[0] || null);

    if (existingMerchant) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      await db.insert(passwordResetTokens).values({
        merchantId: existingMerchant.id,
        tokenHash: otpHash,
        expiresAt: expiresAt,
      });

      console.log(`Password Reset OTP for ${existingMerchant.contactEmail} (Merchant ID: ${existingMerchant.id}): ${otp}`);
      // TODO: Implement actual email sending logic here
    }

    return NextResponse.json(
      {
        message: 'If an account with that email exists, instructions to reset your password have been sent.',
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Forgot password request failed:', error);
    return NextResponse.json(
      { message: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}