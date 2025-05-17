// src/components/modals/PendingRegistrationDetailModal.tsx
"use client";

import React from "react";
import { DateTime } from "luxon";
import type { PendingRegistration } from "@/lib/mockData";
import { formatDdMmYyyyHhMmSs, formatDate } from "@/lib/utils"; // Assuming formatDate can handle YYYY-MM-DD

interface PendingRegistrationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  registration: PendingRegistration | null;
}

const PendingRegistrationDetailModal: React.FC<
  PendingRegistrationDetailModalProps
> = ({ isOpen, onClose, registration }) => {
  if (!isOpen || !registration) return null;

  // Helper to render definition list items
  const renderDetailItem = (
    label: string,
    value: string | undefined | null
  ) => (
    <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
        {value || "N/A"}
      </dd>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-75 transition-opacity duration-300 ease-in-out"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose} // Close if overlay is clicked
    >
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          ​
        </span>

        {/* Modal Panel */}
        <div
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              {/* Optional Icon */}
              {/* <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                 <svg className="h-6 w-6 text-blue-600" ... /> // Add an icon if desired
               </div> */}
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3
                  className="text-lg leading-6 font-medium text-gray-900"
                  id="modal-title"
                >
                  Pending Registration Details
                </h3>
                <div className="mt-4 border-t border-b border-gray-200">
                  <dl className="divide-y divide-gray-200">
                    {renderDetailItem(
                      "Registration ID",
                      registration.displayId
                    )}
                    {renderDetailItem(
                      "Submitted At",
                      DateTime.fromISO(registration.createdAt).toString()
                    )}
                    {renderDetailItem(
                      "Guardian Name",
                      registration.guardianName
                    )}
                    {/* Display DOB directly or use formatDate if it handles YYYY-MM-DD */}
                    {renderDetailItem("Guardian DOB", registration.guardianDob)}
                    {renderDetailItem(
                      "Guardian Contact",
                      registration.guardianContact
                    )}
                    {renderDetailItem("Address", registration.address)}
                    {renderDetailItem("Child Name", registration.childName)}
                    {renderDetailItem("PIN Set", "****")} {/* Mask PIN */}
                    {/* {renderDetailItem('PIN Set', registration.pin)} */}
                    {}
                    {/* Uncomment to show PIN (mock only!) */}
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingRegistrationDetailModal;
