// src/app/page.tsx
'use client'; // Keep this for client-side interactivity (useState, useEffect)

import React, { useState, useEffect } from 'react';
// Imports from the 'components' folder, relative to 'src/app'
import Login from '../components/Login';
import AdminDashboard from '../components/AdminDashboard';

// Define the main page component
export default function HomePage() {
  // State for login status and admin email
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  // State for initial loading check
  const [isLoading, setIsLoading] = useState(true);

  // Function to handle successful login, passed to Login component
  const handleLoginSuccess = (email: string) => {
    setAdminEmail(email);
    setIsLoggedIn(true);
    // You might want to save login state (e.g., in localStorage) here
  };

  // Function to handle logout, passed to AdminDashboard component
  const handleLogout = () => {
    setAdminEmail(null);
    setIsLoggedIn(false);
    // You might want to clear saved login state here
  };

  // Effect to check initial login state (replace with actual check)
  useEffect(() => {
    // --- Replace this block with your actual session/token check ---
    // Example: Check localStorage for a token
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   setIsLoggedIn(true);
    //   setAdminEmail("user@example.com"); // Get email from token or API
    // }
    // --- End of example check ---

    setIsLoading(false); // Mark loading as complete
  }, []); // Empty dependency array ensures this runs only once on mount

  // Show loading indicator while checking auth status
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  // Render Login or Dashboard based on login state
  return (
    <main className="bg-gray-50 min-h-screen">
      <div className="max-w-screen-xl mx-auto px-4 py-2">
        {!isLoggedIn ? (
          <Login onLoginSuccess={handleLoginSuccess} />
        ) : (
          <AdminDashboard onLogout={handleLogout} adminEmail={adminEmail || 'Admin User'} />
        )}
      </div>
    </main>
  );
}