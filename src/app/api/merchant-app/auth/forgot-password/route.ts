// src/app/api/merchant-app/auth/forgot-password/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db'; // ENSURE THIS PATH IS CORRECT for your db instance
import { merchants, passwordResetTokens } from '@/lib/db/schema'; // ENSURE THIS PATH IS CORRECT for your schema file
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// Environment variable for OTP expiry (e.g., in .env.local)
// OTP_EXPIRY_MINUTES=15
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);

// Zod schema for request body validation
const requestBodySchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

// This function will handle POST requests to the URL:
// /api/merchant-app/auth/forgot-password
export async function POST(req: NextRequest) {
  try {
    // 1. Parse and validate request body
    let body;
    try {
      body = await req.json(); // For App Router, get JSON body this way
    } catch (error) {
      // If body is not valid JSON
      return NextResponse.json({ message: 'Invalid JSON body. Please provide a valid JSON object.' }, { status: 400 });
    }
    
    const validationResult = requestBodySchema.safeParse(body);
    if (!validationResult.success) {
      // Extracting more detailed Zod errors can be helpful for debugging
      const errors = validationResult.error.flatten().fieldErrors;
      return NextResponse.json(
        {
          message: 'Invalid request body. Please check your input.',
          errors: errors, 
        },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;

    // 2. Find merchant by email (case-insensitive)
    const existingMerchant = await db
      .select({
        id: merchants.id,
        contactEmail: merchants.contactEmail,
        businessName: merchants.businessName, // For use in email template
      })
      .from(merchants)
      .where(eq(merchants.contactEmail, email.toLowerCase())) // Normalize email for lookup
      .limit(1)
      .then((rows) => rows[0] || null); // Get the first result or null

    if (existingMerchant) {
      // 3. Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit numeric OTP

      // 4. Hash the OTP (using SHA256)
      const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

      // 5. Calculate expiry time for the OTP
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      // 6. Store the OTP hash, merchant ID, and expiry time in the database
      // Consider logic here to invalidate/mark previous tokens for this merchant as used/expired.
      // For now, simply inserting a new one.
      await db.insert(passwordResetTokens).values({
        merchantId: existingMerchant.id,
        tokenHash: otpHash,
        expiresAt: expiresAt,
        // If you re-add taskId, generate and include it here:
        // taskId: uuidv4(), 
      });

      // 7. Send email with OTP (STUBBED FOR NOW - IMPLEMENT THIS)
      console.log(`Password Reset OTP for ${existingMerchant.contactEmail} (Merchant ID: ${existingMerchant.id}): ${otp}`);
      // TODO: Replace this with actual email sending logic (e.g., SendGrid, Nodemailer)
      // Example:
      // await sendPasswordResetEmailService(existingMerchant.contactEmail, existingMerchant.businessName, otp);
      // Ensure this function is robust and handles errors without breaking the flow for the user.
    }

    // 8. Return a generic success message (CRUCIAL for security - prevents email enumeration)
    // This response is sent whether the email was found or not.
    return NextResponse.json(
      {
        message: 'If an account with that email exists, instructions to reset your password have been sent.',
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Forgot password request process failed:', error);
    // Log the error for server-side debugging
    // Return a generic error message to the client
    return NextResponse.json(
      { message: 'An internal server error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}

// You can add other HTTP method handlers here if needed for this specific route
// export async function GET(req: NextRequest) { ... }