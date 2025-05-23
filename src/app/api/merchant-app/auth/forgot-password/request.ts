// pages/api/merchant-app/auth/forgot-password/request.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { db } from '@/lib/db'; // Adjust path if your db instance is elsewhere
import { merchants, passwordResetTokens } from '@/lib/db/schema'; // Adjust path to your schema
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid'; // For generating UUIDs if needed for taskId (we removed taskId, but good to have if needed elsewhere)

// Environment variable for OTP expiry (e.g., in .env.local)
// OTP_EXPIRY_MINUTES=15
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);

// Zod schema for request body validation
const requestBodySchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

type Data = {
  message: string;
  // error?: string; // Optionally include for detailed server errors in dev
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  try {
    // 1. Validate request body
    const validationResult = requestBodySchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Invalid request body',
        // error: validationResult.error.flatten().fieldErrors.email?.[0] || 'Validation failed',
      });
    }

    const { email } = validationResult.data;

    // 2. Find merchant by email
    // We execute this part regardless, but only proceed if merchant exists.
    // The response will be the same to prevent email enumeration.
    const existingMerchant = await db
      .select({
        id: merchants.id,
        contactEmail: merchants.contactEmail,
        // You might want to fetch businessName for the email template later
        businessName: merchants.businessName,
      })
      .from(merchants)
      .where(eq(merchants.contactEmail, email.toLowerCase())) // Ensure case-insensitivity for email lookup
      .limit(1)
      .then((rows) => rows[0] || null);

    if (existingMerchant) {
      // 3. Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit numeric OTP

      // 4. Hash the OTP (using SHA256 for OTPs as they are short-lived)
      const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

      // 5. Calculate expiry time
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      // 6. Store the OTP hash, merchant ID, and expiry time
      // Consider invalidating old tokens here if needed:
      // await db.delete(passwordResetTokens).where(eq(passwordResetTokens.merchantId, existingMerchant.id));
      // Or update existing ones to be 'used' or expired if your logic requires one active token.
      // For simplicity now, we're just inserting a new one. Multiple valid tokens might exist briefly.

      await db.insert(passwordResetTokens).values({
        merchantId: existingMerchant.id,
        tokenHash: otpHash,
        expiresAt: expiresAt,
        // taskId: uuidv4(), // If you were to add taskId back
      });

      // 7. Send email with OTP (STUBBED FOR NOW)
      console.log(`Password Reset OTP for ${existingMerchant.contactEmail} (Merchant ID: ${existingMerchant.id}): ${otp}`);
      // TODO: Implement actual email sending logic here (e.g., using SendGrid)
      // Example:
      // await sendPasswordResetEmail(existingMerchant.contactEmail, existingMerchant.businessName, otp);
      // Ensure this email sending is robust and handles errors gracefully without exposing issues to the client.
    }

    // 8. Return a generic success message (CRUCIAL for security)
    // This is returned whether the email was found or not, to prevent email enumeration.
    return res.status(200).json({
      message: 'If an account with that email exists, instructions to reset your password have been sent.',
    });

  } catch (error) {
    console.error('Forgot password request failed:', error);
    // Generic error for the client
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
}

// Optional: Placeholder for email sending function
// async function sendPasswordResetEmail(to: string, businessName: string | null, otp: string) {
//   // Use your email provider (SendGrid, etc.)
//   console.log(`Simulating email to ${to} for ${businessName || 'Merchant'}: Your OTP is ${otp}`);
//   // Example with SendGrid:
//   // const msg = {
//   //   to: to,
//   //   from: 'noreply@yourdomain.com',
//   //   subject: `Your Password Reset Code for ${process.env.APP_NAME || 'Our App'}`,
//   //   html: `<p>Hi ${businessName || ''},</p><p>Your One-Time Password (OTP) for resetting your password is: <strong>${otp}</strong>.</p><p>This code will expire in ${OTP_EXPIRY_MINUTES} minutes.</p><p>If you did not request this, please ignore this email.</p>`,
//   // };
//   // await sgMail.send(msg);
// }