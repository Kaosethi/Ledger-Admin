import * as jose from "jose";
import { env } from "../config";

// Define the payload structure - make it compatible with jose's JWTPayload
export interface JWTPayload extends jose.JWTPayload {
  sub: string; // subject (user ID)
  email: string;
  role: string;
  iat?: number; // issued at
  exp?: number; // expiration time
  [key: string]: unknown; // Index signature for compatibility
}

// Create a new JWT token
export async function createJWT(payload: JWTPayload): Promise<string> {
  const secret = new TextEncoder().encode(env.JWT_SECRET);

  const token = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret);

  return token;
}

// Verify a JWT token
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET);

    const { payload } = await jose.jwtVerify(token, secret);

    // Check that the payload has the required fields
    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.role !== "string"
    ) {
      console.error("JWT payload missing required fields");
      return null;
    }

    return payload as JWTPayload;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

// Decode a JWT token without verification
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const decoded = jose.decodeJwt(token);

    // Check that the payload has the required fields
    if (
      typeof decoded.sub !== "string" ||
      typeof decoded.email !== "string" ||
      typeof decoded.role !== "string"
    ) {
      console.error("JWT payload missing required fields");
      return null;
    }

    return decoded as JWTPayload;
  } catch (error) {
    console.error("JWT decoding failed:", error);
    return null;
  }
}
