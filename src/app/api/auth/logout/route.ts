import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminLogs } from "@/lib/db/schema";
import { verifyJWT } from "@/lib/auth/jwt";

// POST /api/auth/logout - Logout the current user
export async function POST(request: NextRequest) {
  try {
    // Get the token from cookies
    const token = request.cookies.get("auth-token")?.value;

    // If there's a token, log the logout
    if (token) {
      const payload = await verifyJWT(token);

      if (payload?.email) {
        // Log the logout action
        await db.insert(adminLogs).values({
          adminEmail: payload.email,
          action: "logout",
          targetType: "system",
          details: "Admin logged out",
        });
      }
    }

    // Create a response that clears the auth cookie
    const response = NextResponse.json({
      message: "Logged out successfully",
    });

    // Remove the auth cookie
    response.cookies.delete("auth-token");

    return response;
  } catch (error) {
    console.error("Error during logout:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
