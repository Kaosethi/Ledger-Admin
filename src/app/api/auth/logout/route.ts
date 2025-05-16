import { NextRequest, NextResponse } from "next/server";
// import { db } from "@/lib/db"; // Removed
// import { adminLogs } from "@/lib/db/schema"; // Removed
// import { verifyJWT } from "@/lib/auth/jwt"; // Removed

// POST /api/auth/logout - Logout the current user
export async function POST(request: NextRequest) {
  try {
    // Get the token from cookies
    // const token = request.cookies.get("auth-token")?.value; // No longer needed for logging

    // If there's a token, log the logout -- REMOVED LOGIC
    // if (token) {
    //   const payload = await verifyJWT(token);
    //
    //   if (payload?.email) {
    //     // Log the logout action
    //     await db.insert(adminLogs).values({
    //       adminEmail: payload.email,
    //       action: "logout",
    //       targetType: "system",
    //       details: "Admin logged out",
    //     });
    //   }
    // }

    // Create a response that clears the auth cookie
    const response = NextResponse.json({
      message: "Logged out successfully",
    });

    // Remove the auth cookie
    response.cookies.delete("auth-token");

    return response;
  } catch (error) {
    console.error("Error during logout:", error);
    // Even if there was an error, attempt to clear the cookie on the client
    const errorResponse = NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    );
    errorResponse.cookies.delete("auth-token");
    return errorResponse;
  }
}
