import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = [
  "/dashboard",
  "/accounts",
  "/merchants",
  "/transactions",
  "/onboarding",
  "/activity-log",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Check if the path is protected
  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
  if (!isProtected) {
    return NextResponse.next();
  }

  // Check for auth-token cookie
  const authToken = request.cookies.get("auth-token");
  if (!authToken) {
    // Redirect to login if not authenticated
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated, allow request
  return NextResponse.next();
}

// Optionally, specify which paths to run middleware on
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/accounts/:path*",
    "/merchants/:path*",
    "/transactions/:path*",
    "/onboarding/:path*",
    "/activity-log/:path*",
  ],
};
