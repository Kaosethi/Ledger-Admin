import { db } from "@/lib/db";
import { administrators, adminLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "./password";
import { createJWT } from "./jwt";
import { env } from "../env";

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
      token?: string;
    }>;
  };
}

// Create our custom authentication service
const authConfig: AuthService = {
  emailAndPassword: {
    login: async ({ email, password }: { email: string; password: string }) => {
      try {
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

        // Log the login activity using the audit system
        await db.insert(adminLogs).values({
          adminEmail: admin[0].email,
          action: "login",
          targetType: "system",
          details: "Admin logged in",
        });

        // Create user object
        const user = {
          id: admin[0].id.toString(),
          email: admin[0].email,
          role: "admin",
        };

        // Generate JWT token
        const token = await createJWT({
          sub: user.id,
          email: user.email,
          role: user.role,
        });

        // Return the user information and token
        return {
          success: true,
          user,
          token,
        };
      } catch (error) {
        console.error("Login error:", error);
        return { success: false, error: "Authentication failed" };
      }
    },
  },
};

// Export the auth service
export const auth = authConfig;

// Export types for use in components
export type Auth = typeof auth;
