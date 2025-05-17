// MODIFIED: src/app/api/merchant-app/profile/route.ts
import { NextRequest, NextResponse } from 'next/server'; // Use NextRequest for easier header access
import { db } from '@/lib/db'; // MODIFIED: Import Drizzle client
import { merchants } from '@/lib/db/schema'; // MODIFIED: Import merchants schema
import { eq } from 'drizzle-orm'; // MODIFIED: Import Drizzle 'eq' operator
import * as jose from 'jose'; // MODIFIED: Import jose
import { env } from '@/lib/config';

const JWT_ALGORITHM = "HS256";

interface AuthenticatedMerchantPayload extends jose.JWTPayload {
  merchantId: string; // Expect merchantId in the JWT payload
  email: string;
  // Add other fields if they are in your JWT payload
}

// Helper function to get the secret key as Uint8Array
function getJwtSecretKey(): Uint8Array {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set.');
  }
  return new TextEncoder().encode(env.JWT_SECRET);
}

async function getAuthenticatedMerchantId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('[API Profile] No or invalid Authorization header');
    return null;
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  if (!token) {
    console.warn('[API Profile] Token missing after Bearer prefix');
    return null;
  }

  try {
    const secretKey = getJwtSecretKey();
    const { payload } = await jose.jwtVerify<AuthenticatedMerchantPayload>(token, secretKey, {
      algorithms: [JWT_ALGORITHM],
      // Specify issuer/audience if you set them during signing
      // issuer: 'urn:example:issuer',
      // audience: 'urn:example:audience',
    });

    // The payload type is AuthenticatedMerchantPayload, so payload.merchantId is available
    if (payload && payload.merchantId) {
      return payload.merchantId;
    }
    console.warn('[API Profile] JWT valid, but merchantId missing in payload');
    return null;
  } catch (error) {
    if (error instanceof Error) {
      console.warn('[API Profile] JWT Verification Error:', error.name, error.message);
      if (error.name === 'JWTExpired') {
        // Specific handling for expired token if needed, though jwtVerify throws general error
      }
    } else {
      console.warn('[API Profile] Unknown JWT Verification Error:', error);
    }
    return null;
  }
}

export async function GET(request: NextRequest) { // Changed to NextRequest
  let secretKeyForErrorCheck: Uint8Array;
  try {
    secretKeyForErrorCheck = getJwtSecretKey(); // Check JWT_SECRET upfront
  } catch (error) {
    console.error('[API Profile] JWT Secret configuration error:', (error as Error).message);
    return NextResponse.json({ error: 'Server configuration error for token verification.' }, { status: 500 });
  }

  try {
    const merchantId = await getAuthenticatedMerchantId(request);

    if (!merchantId) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or missing token.' }, { status: 401 });
    }

    console.log('[API /merchant-app/profile] Authenticated Merchant ID:', merchantId);

    // Fetch real merchant details from the database using Drizzle
    // Ensure 'merchants.id' matches your schema for the ID column.
    const foundMerchants = await db
      .select()
      .from(merchants)
      .where(eq(merchants.id, merchantId)) // Assuming merchantId from token is UUID string
      .limit(1);

    if (foundMerchants.length === 0) {
      console.warn('[API /merchant-app/profile] Merchant not found in DB for ID from token:', merchantId);
      // This case implies a valid token for a non-existent/deleted merchant,
      // or an issue with ID matching (e.g., type mismatch if DB ID is not UUID string)
      return NextResponse.json({ error: 'Authenticated user not found.' }, { status: 404 });
    }

    const merchantFromDb = foundMerchants[0];

    // Exclude sensitive information like hashedPassword from the response
    const { hashedPassword, ...profileData } = merchantFromDb;

    return NextResponse.json(profileData); // Return the merchant's data

  } catch (error) {
    console.error('[API /merchant-app/profile] Error processing profile request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}