// src/components/Login.tsx
// MODIFIED: Check against mockDataInstance.admins, check isActive, store email in localStorage
import React, { useState } from "react";
import mockDataInstance, { AdminUser } from "@/lib/mockData"; // ADDED: Import mock data and AdminUser type

// Define the props (inputs) the component expects
interface LoginProps {
  onLoginSuccess: (adminEmail: string) => void; // Function to call when login is successful
}

// ADDED: Constant for localStorage key
const ADMIN_EMAIL_STORAGE_KEY = "loggedInAdminEmail";

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  // State for form inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // State for error messages
  const [error, setError] = useState<string | null>(null);

  // Handle form submission
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault(); // Prevent default browser form submission
    setError(null); // Clear previous errors

    if (!email || !password) {
      setError("Email and password required");
      return;
    }

    // --- MODIFIED: MOCK LOGIN CHECK ---
    // Find admin by email in the mock data
    const adminUser = mockDataInstance.admins.find(
      (admin) => admin.email === email
    );

    // Check if admin exists and password matches (MOCK check, replace with secure hash comparison)
    if (adminUser && adminUser.passwordHash === password) {
      // ADDED: Check if the admin account is active
      if (!adminUser.isActive) {
        setError("This admin account is inactive. Please contact support.");
        return; // Stop login process
      }

      // ADDED: Store admin email in localStorage upon successful login
      try {
        localStorage.setItem(ADMIN_EMAIL_STORAGE_KEY, adminUser.email);
        console.log("Admin email stored in localStorage:", adminUser.email);
      } catch (storageError) {
        console.error("Failed to save admin email to localStorage:", storageError);
        // Optionally inform the user or handle appropriately
        setError("Login failed: Could not save session information.");
        return;
      }

      onLoginSuccess(adminUser.email); // Call the function passed from the parent page
    } else {
      setError("Invalid admin credentials.");
    }
    // --- END MODIFIED MOCK LOGIN CHECK ---
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen -mt-16">
      <div className="w-full max-w-md p-6 space-y-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">
            Aid Distribution System
          </h1>
          <p className="mt-2 text-gray-600">Admin Login</p>
        </div>
        {/* Use onSubmit on the form element */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email} // Bind input value to state
              onChange={(e) => setEmail(e.target.value)} // Update state on change
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-base"
              placeholder="admin@example.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password} // Bind input value to state
              onChange={(e) => setPassword(e.target.value)} // Update state on change
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-base"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          {/* Display error message if 'error' state is not null */}
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          <div>
            {/* Use type="submit" for the button within the form */}
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;