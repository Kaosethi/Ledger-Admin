// MODIFIED: src/app/api/merchant-app/auth/login/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { merchants } from '@/lib/db/schema'; // Ensure this is your merchants table object
import { eq } from 'drizzle-orm';
import { compare } from 'bcryptjs';
import * as jose from 'jose'; // MODIFIED: Import jose

// Ensure you have a JWT_SECRET in your .env.local or environment variables
// This secret needs to be a Uint8Array for jose's SignJWT
// We'll encode the string secret from environment variables.
const JWT_SECRET_STRING = process.env.JWT_SECRET;
const JWT_ALGORITHM = 'HS256'; // Standard algorithm for symmetric secrets
const JWT_EXPIRES_IN = '7d'; // Token expiry time (e.g., 7 days)

// Helper function to get the secret key as Uint8Array
function getJwtSecretKey(): Uint8Array {
  if (!JWT_SECRET_STRING) {
    throw new Error('JWT_SECRET environment variable is not set.');
  }
  return new TextEncoder().encode(JWT_SECRET_STRING);
}

export async function POST(request: Request) {
  let secretKey: Uint8Array;
  try {
    secretKey = getJwtSecretKey();
  } catch (error) {
    console.error('[API /merchant-app/auth/login] JWT Secret configuration error:', (error as Error).message);
    return NextResponse.json({ error: 'Server configuration error for signing tokens.' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    console.log('[API /merchant-app/auth/login] Attempting login for email:', email);

    const foundMerchants = await db
      .select()
      .from(merchants)
      .where(eq(merchants.contactEmail, email.toLowerCase()))
      .limit(1);

    if (foundMerchants.length === 0) {
      console.warn('[API /merchant-app/auth/login] Merchant not found for email:', email);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const merchant = foundMerchants[0];

    // Ensure hashedPassword is not null before comparison
    // (This check assumes your schema might still allow null, or as a safeguard)
    if (!merchant.hashedPassword) {
        console.error('[API /merchant-app/auth/login] Merchant found but has no hashed password. Email:', email);
        return NextResponse.json({ error: 'Account configuration issue.' }, { status: 500 });
    }
    const isPasswordValid = await compare(password, merchant.hashedPassword);

    if (!isPasswordValid) {
      console.warn('[API /merchant-app/auth/login] Invalid password for email:', email);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (merchant.status !== 'active') {
      console.warn(`[API /merchant-app/auth/login] Login attempt for non-active merchant. Email: ${email}, Status: ${merchant.status}`);
      let errorMessage = 'Login failed. Your account is not active.';
      if (merchant.status === 'pending_approval') {
        errorMessage = 'Your account is pending administrator approval.';
      } else if (merchant.status === 'rejected') {
        errorMessage = 'Your account application has been rejected.';
      } else if (merchant.status === 'suspended') {
        errorMessage = 'Your account has been suspended.';
      }
      return NextResponse.json({ error: errorMessage }, { status: 403 });
    }

    // Create JWT with jose
    const token = await new jose.SignJWT({
        merchantId: merchant.id,
        email: merchant.contactEmail,
        // Add any other claims, like roles, if needed
        // 'urn:example:claim': true, // Example custom claim
      })
      .setProtectedHeader({ alg: JWT_ALGORITHM })
      .setIssuedAt()
      // .setIssuer('urn:example:issuer') // Optional: identify the issuer
      // .setAudience('urn:example:audience') // Optional: identify the audience
      .setExpirationTime(JWT_EXPIRES_IN)
      .sign(secretKey);

    console.log('[API /merchant-app/auth/login] Login successful for email:', email);

    const { hashedPassword, ...merchantDetailsForClient } = merchant;

    const response = NextResponse.json({
      message: 'Login successful',
      merchant: merchantDetailsForClient,
      token: token,
    });

    return response;

  } catch (error) {
    console.error('[API /merchant-app/auth/login] Error processing login request:', error);
    // Differentiate between known errors (like JWT config) and unexpected ones
    if (error instanceof Error && error.message.includes('JWT_SECRET')) {
        // Already handled by the initial secretKey retrieval block, but as a fallback
        return NextResponse.json({ error: 'Server configuration error for signing tokens.' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal Server Error during login.' }, { status: 500 });
  }
}