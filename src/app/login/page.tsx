import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJWT, JWTPayload } from "@/lib/auth/jwt"; // Assuming verifyJWT and JWTPayload are exported
import LoginForm from "@/components/LoginForm"; // Import the new client component
import React from "react";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const authTokenCookie = cookieStore.get("auth-token");
  const authToken = authTokenCookie?.value;

  let isAuthenticated = false;
  let userPayload: JWTPayload | null = null;

  if (authToken) {
    userPayload = await verifyJWT(authToken);
    if (userPayload && userPayload.sub) {
      // Check for subject or other essential claims
      // Optionally, you could do a quick DB check here if needed to ensure user still active
      isAuthenticated = true;
    }
  }

  if (isAuthenticated) {
    redirect("/dashboard"); // Redirect to dashboard if authenticated
  }

  // If not authenticated, render the LoginForm client component
  // The overall page structure (background, centering) is kept here
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <LoginForm />
    </div>
  );
}
