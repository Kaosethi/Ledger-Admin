// src/app/register/success/page.tsx
"use client";

import React from "react";
// import Link from 'next/link'; // Keep if you plan to use the Link below

const RegistrationSuccessPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 md:p-12 rounded-lg shadow-xl text-center max-w-lg">
        <svg
          className="w-16 h-16 text-green-500 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
          Registration Submitted!
        </h1>
        <p className="text-gray-600 mb-6">
          Thank you for submitting your registration details. Your request has
          been received and is now pending review by an administrator.
        </p>
        {/* MODIFIED: Removed the potentially misleading sentence about notification */}
        <p className="text-sm text-gray-500 mb-8">
          You may now close this window.
        </p>
        {/* Optional: Add a button to go back to a public homepage if you have one */}
        {/* <Link href="/">
                    <a className="inline-block px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out">
                        Go to Homepage
                    </a>
                </Link> */}
        {/* Example: Add a button that closes the tab/window - works in some contexts */}
        {/* <button
                     onClick={() => window.close()}
                     className="mt-4 px-6 py-2 bg-gray-500 text-white font-semibold rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition duration-150 ease-in-out"
                 >
                    Close Window
                 </button> */}
      </div>
    </div>
  );
};

export default RegistrationSuccessPage;
