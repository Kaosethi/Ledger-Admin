// src/components/print/BulkQrPrintView.tsx
// FIXED: Used 'childName' instead of 'name'.

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Account } from '@/lib/mockData'; // Ensure path is correct

interface BulkQrPrintViewProps {
  accountsToPrint: Account[];
}

const BulkQrPrintView = React.forwardRef<HTMLDivElement, BulkQrPrintViewProps>(
  ({ accountsToPrint }, ref) => {
    // Basic styling for print layout
    const printStyles: React.CSSProperties = {
      margin: '20px',
    };

    const accountBlockStyles: React.CSSProperties = {
      border: '1px solid #ccc',
      padding: '15px',
      marginBottom: '20px',
      pageBreakInside: 'avoid',
      width: '100%',
      boxSizing: 'border-box',
      textAlign: 'center'
    };

    const qrCodeContainerStyles: React.CSSProperties = {
      marginTop: '10px',
      marginBottom: '10px',
    };

    const textStyles: React.CSSProperties = {
        fontSize: '14px',
        fontWeight: 'bold',
        marginBottom: '5px'
    };

    // Decide what data to encode in the QR code.
    // For the "Unique Token per Generation" strategy, this component wouldn't
    // be suitable because the token is generated just-in-time in the modal.
    // For the simpler "ID only" strategy, encoding account.id is correct.
    // If you implemented the backend token generation, printing QR codes this way
    // would likely print *old/invalid* tokens unless this component fetched
    // the *current* token for each account right before printing, which is complex.
    // For now, assuming we print the static ID:
    const getQrValue = (account: Account): string => {
        return account.id;
        // OR if you had a persistent qrCodeUrl field in Account:
        // return account.qrCodeUrl || account.id;
    };


    return (
      <div ref={ref} style={printStyles}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '20px' }}>Account QR Codes</h1>
        {accountsToPrint.map((account) => (
          <div key={account.id} style={accountBlockStyles}>
            <p style={textStyles}>Account ID: {account.id}</p>
            {/* MODIFIED: Use childName */}
            <p style={textStyles}>Child Name: {account.childName || 'N/A'}</p>
            {/* Optionally display Guardian Name */}
            <p style={textStyles}>Guardian: {account.guardianName || 'N/A'}</p>
            {/* Balance might not be appropriate for a printed QR card */}
            {/* <p style={textStyles}>Balance: {formatCurrency(account.balance)}</p> */}

            <div style={qrCodeContainerStyles}>
              <QRCodeSVG
                value={getQrValue(account)} // Use helper function for clarity
                size={128}
                bgColor={"#ffffff"}
                fgColor={"#000000"}
                level={"H"} // Higher error correction for printing
                includeMargin={true} // Add margin for better scanning from print
              />
            </div>
             {/* Optional placeholder */}
             {/* <p style={{fontSize: '10px', color: '#555'}}>Scan for details</p> */}
          </div>
        ))}
        {accountsToPrint.length === 0 && (
            <p style={{textAlign: 'center', color: '#666'}}>No accounts selected for printing.</p>
        )}
      </div>
    );
  }
);

BulkQrPrintView.displayName = 'BulkQrPrintView';

export default BulkQrPrintView;