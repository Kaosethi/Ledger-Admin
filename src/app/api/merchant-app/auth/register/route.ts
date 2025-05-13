// src/app/api/merchant-app/auth/register/route.ts
import { NextResponse } from 'next/server';
// TODO: (Backend Developer) Import Drizzle client and merchant schema
// import { db } from '@/lib/db'; // Assuming your db client is here
// import { merchants } from '@/lib/db/schema'; // Assuming your merchants schema is here
// import { hash } from 'bcryptjs'; // Or your preferred password hashing library

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      password, // Plain text password from app
      location,
      category,
      contactEmail // Optional, could be same as login email
      // Add any other fields your Android registration form will send
    } = body;

    // --- Basic Validation ---
    if (!name || !email || !password || !location || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, password, location, and category are required.' },
        { status: 400 }
      );
    }

    // Optional: More specific validation (email format, password strength) can be added here

    console.log('[API /merchant-app/auth/register] Received registration data:', body);

    // --- Placeholder Logic: Log and return success ---
    // TODO: (Backend Developer)
    // 1. Check if a merchant with this email already exists in the database.
    //    If yes, return an error (e.g., 409 Conflict).
    // 2. Hash the received plain text password.
    // 3. Create a new merchant record in the database using Drizzle.
    //    - Decide on initial status (e.g., 'Pending' for admin approval, or 'Active' directly).
    //    - `submittedAt` should be the current timestamp.
    // 4. Handle any database errors.
    // 5. Return a success response, possibly with some data of the newly created merchant (excluding sensitive info).

    const newMockMerchant = {
      id: `MER-MOCK-${Date.now()}`, // Generate a mock ID
      name,
      email,
      location,
      category,
      contactEmail: contactEmail || email,
      status: 'Pending', // Example: new registrations are pending approval
      submittedAt: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        message: 'Merchant registration request received (mock). Awaiting admin approval.',
        merchant: newMockMerchant,
      },
      { status: 201 } // 201 Created
    );
    // --- End Placeholder Logic ---

  } catch (error) {
    console.error('[API /merchant-app/auth/register] Error:', error);
    if (error instanceof SyntaxError) { // JSON parsing error
        return NextResponse.json({ error: 'Invalid request body. Ensure JSON is well-formed.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error during registration.' }, { status: 500 });
  }
}