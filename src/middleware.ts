import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth/jwt";

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /api/auth/* (authentication endpoints)
     * - /login (login page)
     * - /_next/static (static files)
     * - /_next/image (image optimization files)
     * - /favicon.ico (favicon file)
     * - /public/* (public assets)
     */
    "/((?!api/auth|login|_next/static|_next/image|favicon.ico|public/).*)",
  ],
};

export async function middleware(request: NextRequest) {
  // Get the token from the cookies
  const token = request.cookies.get("auth-token")?.value;

  // If there's no token and the path is not the login page, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Verify the token
  const payload = await verifyJWT(token);

  // If the token is invalid, redirect to login
  if (!payload) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("auth-token");
    return response;
  }

  // Continue to the requested page
  return NextResponse.next();
}
