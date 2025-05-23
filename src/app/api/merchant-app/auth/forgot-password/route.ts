// src/app/api/merchant-app/auth/forgot-password/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db'; // ENSURE THIS PATH IS CORRECT
import { merchants, passwordResetTokens } from '@/lib/db/schema'; // ENSURE THIS PATH IS CORRECT
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import sgMail from '@sendgrid/mail';

// Environment variables
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '15', 10);
// These are loaded once when the module is initialized
const MODULE_SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const MODULE_APP_NAME = process.env.APP_NAME || 'Our Application';
const MODULE_SENDER_EMAIL_ADDRESS = process.env.SENDER_EMAIL_ADDRESS;

// Configure SendGrid (This part runs when the module is first loaded/cached by Node)
if (MODULE_SENDGRID_API_KEY) {
  sgMail.setApiKey(MODULE_SENDGRID_API_KEY);
  console.log("DEBUG: SendGrid API key found at module load time and configured.");
} else {
  console.warn('DEBUG: WARNING - SENDGRID_API_KEY was NOT found at module load time.');
}
if (!MODULE_SENDER_EMAIL_ADDRESS) {
    console.warn('DEBUG: WARNING - SENDER_EMAIL_ADDRESS was NOT found at module load time.');
}


const requestBodySchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

async function sendPasswordResetEmail(to: string, businessName: string | null, otp: string): Promise<void> {
  // Explicitly log the values *inside* the function when it's called, using process.env directly for up-to-date check
  const currentSendGridApiKey = process.env.SENDGRID_API_KEY;
  const currentSenderEmail = process.env.SENDER_EMAIL_ADDRESS;
  const currentAppName = process.env.APP_NAME || 'Our Application'; // Use process.env here too

  console.log(`DEBUG sendPasswordResetEmail: SENDGRID_API_KEY is "${currentSendGridApiKey}"`);
  console.log(`DEBUG sendPasswordResetEmail: SENDER_EMAIL_ADDRESS is "${currentSenderEmail}"`);
  console.log(`DEBUG sendPasswordResetEmail: APP_NAME is "${currentAppName}"`);


  if (!currentSendGridApiKey || !currentSenderEmail) {
    console.error('SendGrid not fully configured (API Key or Sender Email missing according to process.env). OTP will be logged to console.');
    console.log(`Password Reset OTP for ${to} (${businessName || 'Merchant'}): ${otp}`);
    return;
  }

  const msg = {
    to: to,
    from: {
      email: currentSenderEmail, // Use value directly from process.env
      name: currentAppName,      // Use value directly from process.env
    },
    subject: `Your Password Reset Code for ${currentAppName}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #0056b3;">Password Reset Request</h2>
        <p>Hi ${businessName || 'Merchant'},</p>
        <p>We received a request to reset the password for your account associated with ${currentAppName}.</p>
        <p>Your One-Time Password (OTP) is: <strong style="font-size: 1.2em; color: #d9534f;">${otp}</strong></p>
        <p>This code is valid for <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.</p>
        <p>If you did not request a password reset, please ignore this email. No changes will be made to your account.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 0.9em; color: #777;">
          Thanks,<br>
          The ${currentAppName} Team
        </p>
      </div>
    `,
    text: `Hi ${businessName || 'Merchant'},\n\nYour One-Time Password (OTP) for resetting your password for ${currentAppName} is: ${otp}\nThis code will expire in ${OTP_EXPIRY_MINUTES} minutes.\nIf you did not request this, please ignore this email.\n\nThanks,\nThe ${currentAppName} Team`,
  };

  try {
    await sgMail.send(msg);
    console.log(`Password reset OTP email successfully sent to ${to} via SendGrid.`);
  } catch (error: any) {
    console.error('Error sending password reset email via SendGrid:');
    if (error.response && error.response.body && error.response.body.errors) {
        console.error('SendGrid Error Details:', JSON.stringify(error.response.body.errors, null, 2));
    } else if (error.response && error.response.body) {
        console.error('SendGrid Error Body:', JSON.stringify(error.response.body, null, 2));
    } else {
        console.error(error.message || error);
    }
    console.log(`Fallback (SendGrid Error): OTP for ${to} (${businessName || 'Merchant'}): ${otp}`);
  }
}


export async function POST(req: NextRequest) {
  // Add a debug log at the start of the POST handler
  console.log("DEBUG: POST /api/merchant-app/auth/forgot-password called.");
  console.log(`DEBUG POST handler: SENDGRID_API_KEY (from process.env) is "${process.env.SENDGRID_API_KEY}"`);
  console.log(`DEBUG POST handler: SENDER_EMAIL_ADDRESS (from process.env) is "${process.env.SENDER_EMAIL_ADDRESS}"`);

  try {
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json({ message: 'Invalid JSON body. Please provide a valid JSON object.' }, { status: 400 });
    }
    
    const validationResult = requestBodySchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      return NextResponse.json(
        {
          message: 'Invalid request body. Please check your input.',
          errors: errors, 
        },
        { status: 400 }
      );
    }

    // Now validationResult.data is guaranteed to be defined and have the 'email' property
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
        
        // Corrected db.insert call
        await db.insert(passwordResetTokens).values({
            merchantId: existingMerchant.id,
            tokenHash: otpHash,
            expiresAt: expiresAt,
            // No taskId as per previous decision
        });
        
        await sendPasswordResetEmail(existingMerchant.contactEmail, existingMerchant.businessName, otp);
    }
    
    return NextResponse.json(
        { message: 'If an account with that email exists, instructions to reset your password have been sent.' }, 
        { status: 200 }
    );

  } catch (error) {
    console.error('Forgot password request process failed:', error);
    return NextResponse.json(
        { message: 'An internal server error occurred. Please try again later.' }, 
        { status: 500 }
    );
  }
}