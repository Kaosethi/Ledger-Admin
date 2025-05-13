import { NextRequest, NextResponse } from "next/server";
import { verifyJWT, JWTPayload } from "./jwt";

// Define auth result type
type AuthResult =
  | { authenticated: false; response: NextResponse }
  | { authenticated: true; payload: JWTPayload };

/**
 * Middleware function to check authentication for API routes
 * @param request The Next.js request object
 * @returns Object with auth status and optionally the payload
 */
export async function checkAuth(request: NextRequest): Promise<AuthResult> {
  // Get the token from cookies
  const token = request.cookies.get("auth-token")?.value;

  // If there's no token, return unauthorized
  if (!token) {
    return {
      authenticated: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  // Verify the token
  const payload = await verifyJWT(token);

  // If token is invalid, return unauthorized
  if (!payload) {
    return {
      authenticated: false,
      response: NextResponse.json({ error: "Invalid token" }, { status: 401 }),
    };
  }

  // Token is valid
  return {
    authenticated: true,
    payload,
  };
}

/**
 * Higher-order function that wraps an API handler with authentication
 * @param handler The API handler function to wrap
 * @returns A new handler function with authentication
 */
export function withAuth(
  handler: (
    request: NextRequest,
    context: any,
    payload: JWTPayload
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: any) => {
    const auth = await checkAuth(request);

    if (!auth.authenticated) {
      return auth.response;
    }

    // Call the original handler with the authenticated request
    return handler(request, context, auth.payload);
  };
}
