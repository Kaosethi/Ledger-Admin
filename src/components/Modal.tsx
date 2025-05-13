// src/components/Modal.tsx
import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode; // Content of the modal body
  footer?: ReactNode; // Optional footer content
  maxWidthClass?: string; // e.g., 'max-w-lg', 'max-w-xl'
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidthClass = 'max-w-lg' // Default max-width
}) => {
  if (!isOpen) return null;

  return (
    // Use portal? For now, keep it simple. In real app, use a portal for better DOM structure.
    <div
      className="modal-container" // Use class from globals.css
      onClick={onClose} // Close on backdrop click
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`modal-content ${maxWidthClass}`} // Use classes from globals.css
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside content
      >
        {/* Modal Header */}
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        {/* Wrap children in modal-body for consistent padding/scrolling */}
        <div className="modal-body">
             {children}
        </div>


        {/* Modal Footer (optional) */}
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;