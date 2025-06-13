"use client";

import { Inter } from "next/font/google";
import "../globals.css";

// Initialize font
const inter = Inter({ subsets: ["latin"] });

// This is a completely standalone layout for the HR Portal
// No connection to the Aid Distribution System app
export default function HRPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>HR Admin Portal</title>
        <meta name="description" content="HR Admin Portal for employee management" />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  );
}
