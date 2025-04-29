// src/app/components/Navbar.tsx
import React from "react";

interface NavbarProps {
  adminEmail: string;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ adminEmail, onLogout }) => {
  return (
    <nav className="bg-white shadow-md mb-6 rounded-lg">
      {/* Top Section */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary">
              Aid Distribution System
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">{adminEmail || "Admin User"}</span>
            <button
              onClick={onLogout}
              className="text-sm text-gray-700 hover:text-primary"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
