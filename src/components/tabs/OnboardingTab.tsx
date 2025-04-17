// src/app/components/tabs/OnboardingTab.tsx
import React from 'react';
// Import types if needed
// import type { Account } from '@/lib/mockData';

interface OnboardingTabProps {
  // Add props
}

const OnboardingTab: React.FC<OnboardingTabProps> = ({ /* props */ }) => {
  return (
    // Added classes from #onboarding-tab div
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">New Beneficiary Registration (via Guardian)</h2>
      {/* Added form classes */}
      <form id="onboarding-form" className="space-y-6">
        {/* Added grid classes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left Column - Added spacing */}
          <div className="space-y-4">
            {/* Added section header styles */}
            <h3 className="text-lg font-medium text-gray-800 border-b pb-2">Guardian's Information</h3>
            <div>
              <label htmlFor="guardian-name" className="block text-sm font-medium text-gray-700">Guardian's Full Name</label>
              {/* Added input field styles */}
              <input type="text" id="guardian-name" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary placeholder-gray-400" placeholder="Guardian's Full Name" />
            </div>
            <div>
              <label htmlFor="guardian-dob" className="block text-sm font-medium text-gray-700">Guardian's Date of Birth</label>
              <input type="date" id="guardian-dob" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary placeholder-gray-400" />
            </div>
            <div>
              <label htmlFor="guardian-contact" className="block text-sm font-medium text-gray-700">Guardian's Contact Number</label>
              <input type="tel" id="guardian-contact" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary placeholder-gray-400" placeholder="Contact number" />
            </div>
            <div>
              <label htmlFor="guardian-address" className="block text-sm font-medium text-gray-700">Address</label>
              <textarea id="guardian-address" rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary placeholder-gray-400" placeholder="Enter address"></textarea>
            </div>

            {/* Added section header styles */}
            <h3 className="text-lg font-medium text-gray-800 border-b pb-2 pt-4">Child's Information</h3>
            <div>
              <label htmlFor="child-name" className="block text-sm font-medium text-gray-700">Child's Full Name</label>
              <input type="text" id="child-name" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary placeholder-gray-400" placeholder="Child's Full Name" />
            </div>
          </div>

          {/* Right Column - Added spacing */}
          <div className="space-y-4">
            {/* Added section header styles */}
            <h3 className="text-lg font-medium text-gray-800 border-b pb-2">Account Setup</h3>
            <div>
              <label htmlFor="account-id" className="block text-sm font-medium text-gray-700">Account ID</label>
              {/* Added flex container styles */}
              <div className="mt-1 flex rounded-md shadow-sm">
                {/* Added input styles */}
                <input type="text" id="account-id" readOnly className="flex-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-none rounded-l-md focus:outline-none text-base text-gray-500" placeholder="STC-YYYY-XXXX" />
                {/* Added button styles */}
                <button type="button" id="generate-account-id-btn" className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-600 hover:bg-gray-100 text-sm font-medium">Generate</button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Auto-generated unique identifier.</p>
            </div>
            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-700">4-Digit PIN</label>
              <input type="password" id="pin" required maxLength={4} pattern="[0-9]{4}" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary placeholder-gray-400" placeholder="Enter 4-digit PIN" />
            </div>
            <div>
              <label htmlFor="confirm-pin" className="block text-sm font-medium text-gray-700">Confirm PIN</label>
              <input type="password" id="confirm-pin" required maxLength={4} pattern="[0-9]{4}" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary placeholder-gray-400" placeholder="Confirm 4-digit PIN" />
            </div>
            <div>
              <label htmlFor="initial-balance" className="block text-sm font-medium text-gray-700">Initial Balance</label>
              {/* Added input group styles */}
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">$</span></div>
                <input type="number" id="initial-balance" required className="block w-full pl-7 pr-12 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary placeholder-gray-400" placeholder="0.00" step="0.01" min="0" />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">USD</span></div>
              </div>
            </div>

            {/* QR Code Section - Added wrapper styles */}
            <div className="mt-6 p-4 border border-gray-200 rounded-md bg-gray-50">
              <h3 className="text-lg font-medium text-gray-800 mb-2">Account QR Code</h3>
              <div className="mt-4">
                 {/* Added button styles */}
                <button type="button" id="generate-qr-btn" disabled className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed">Generate QR Code</button>
                <p className="mt-1 text-xs text-gray-500">Generate Account ID first.</p>
              </div>
              {/* QR Preview Area - Added wrapper styles */}
              <div id="qr-preview" className="hidden mt-4"> {/* Toggle 'hidden' with state */}
                <div className="flex flex-col md:flex-row items-center">
                  {/* Added QR container styles */}
                  <div id="qr-code-container" className="mb-4 md:mb-0 md:mr-6 bg-white p-2 rounded-md inline-block border border-gray-300 min-w-[144px] min-h-[144px] flex justify-center items-center">
                    <p className="text-xs text-gray-400 italic text-center">QR Code will appear here (128x128)</p>
                  </div>
                  {/* Added text container styles */}
                  <div className="space-y-1 text-center md:text-left">
                    <p className="text-sm text-gray-600">Account ID: <span id="qr-account-id" className="font-medium text-gray-800"></span></p>
                    <p className="text-sm text-gray-600">Child's Name: <span id="qr-child-name" className="font-medium text-gray-800"></span></p>
                    <p className="text-sm text-gray-600">Guardian: <span id="qr-guardian-name" className="font-medium text-gray-800"></span></p>
                    <p className="text-sm text-gray-600">Initial Balance: <span id="qr-balance" className="font-medium text-gray-800"></span></p>
                    {/* Added button styles */}
                    <button type="button" id="print-onboarding-qr-btn" disabled className="mt-2 py-1 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed">Print QR Code</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button - Added wrapper and button styles */}
        <div className="flex justify-end pt-4 border-t">
          <button type="submit" className="py-2 px-6 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">Register Beneficiary Account</button>
        </div>
      </form>
    </div>
  );
};

export default OnboardingTab;