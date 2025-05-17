import { betterAuth } from "better-auth";
import { db } from "@/lib/db";
import { administrators, adminLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "./password";
import { env } from "../config";

// Define the expected interface for our authentication service
interface AuthService {
  emailAndPassword: {
    login: (credentials: { email: string; password: string }) => Promise<{
      success: boolean;
      error?: string;
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }>;
  };
}

// Create the auth configuration
const authConfig = betterAuth({
  // Connect to our existing Drizzle database
  database: db,

  // Configure email and password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Disable email verification for now

    // Use our custom login function to verify credentials against our existing schema
    onLogin: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      // Find administrator by email
      const admin = await db
        .select()
        .from(administrators)
        .where(eq(administrators.email, email));

      if (!admin.length) {
        return { success: false, error: "Invalid credentials" };
      }

      // Verify password using our utility function
      const isValidPassword = await verifyPassword(
        password,
        admin[0].passwordHash
      );

      if (!isValidPassword) {
        return { success: false, error: "Invalid credentials" };
      }

      // Log the login activity
      await db.insert(adminLogs).values({
        adminEmail: admin[0].email,
        action: "login",
        targetType: "system",
        details: "Admin logged in via Better Auth",
      });

      // Return the user information
      return {
        success: true,
        user: {
          id: admin[0].id.toString(),
          email: admin[0].email,
          role: "admin",
        },
      };
    },
  },

  // Configure JWT session handling
  sessionStrategy: "jwt",
  jwt: {
    // Secret key from environment variables
    secret: env.JWT_SECRET,
    // Token expiration time (12 hours)
    expiresIn: 60 * 60 * 12,
  },

  // Add any additional plugins as needed
  plugins: [],
});

// Export as auth with the expected interface
export const auth = authConfig as unknown as AuthService;

// Export types for use in components
export type Auth = typeof auth;
