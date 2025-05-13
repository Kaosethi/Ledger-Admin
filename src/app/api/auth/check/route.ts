import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth/jwt";

// GET /api/auth/check - Check if user is authenticated
export async function GET(request: NextRequest) {
  try {
    // Get the token from cookies
    const token = request.cookies.get("auth-token")?.value;

    // If there's no token, return unauthorized
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Verify the token
    const payload = await verifyJWT(token);

    // If token is invalid, return unauthorized
    if (!payload) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Token is valid, return user information
    return NextResponse.json({
      authenticated: true,
      user: {
        id: payload.sub,
        email: payload.email ?? "",
        role: payload.role ?? "user",
      },
    });
  } catch (error) {
    console.error("Error checking authentication:", error);
    return NextResponse.json(
      { error: "Failed to check authentication" },
      { status: 500 }
    );
  }
}
