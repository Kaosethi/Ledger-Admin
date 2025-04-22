// src/components/modals/ConfirmActionModal.tsx
import React from 'react';

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode; // Allow React nodes for potentially richer messages
  confirmButtonText?: string;
  confirmButtonVariant?: 'primary' | 'danger' | 'success'; // Optional styling hint
}

const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = 'Confirm',
  confirmButtonVariant = 'primary',
}) => {
  if (!isOpen) {
    return null;
  }

  let confirmButtonClasses = 'bg-primary hover:bg-secondary text-white'; // Default: primary
  if (confirmButtonVariant === 'danger') {
    confirmButtonClasses = 'bg-red-600 hover:bg-red-700 text-white';
  } else if (confirmButtonVariant === 'success') {
      confirmButtonClasses = 'bg-green-600 hover:bg-green-700 text-white';
  }

  const handleConfirm = () => {
    onConfirm();
    onClose(); // Close after confirming
  }

  return (
    <div
      className={`fixed inset-0 z-[60] overflow-y-auto bg-black bg-opacity-60 transition-opacity duration-300 ${ // Increased z-index
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      aria-labelledby="confirm-action-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-center min-h-screen px-4 py-6">
        {/* Modal Panel */}
        <div
          className={`bg-white rounded-lg shadow-xl transform transition-all duration-300 ease-out w-full max-w-md ${
            isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900" id="confirm-action-title">
              {title}
            </h3>
          </div>

          {/* Modal Body */}
          <div className="px-6 py-5">
            <div className="text-sm text-gray-700">
              {typeof message === 'string' ? <p>{message}</p> : message}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3 bg-gray-50 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
            >
              Cancel
            </button>
             <button
              type="button"
              onClick={handleConfirm}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmButtonClasses}`}
            >
              {confirmButtonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmActionModal;