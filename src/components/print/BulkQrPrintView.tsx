// src/components/print/BulkQrPrintView.tsx
import React from 'react';
import { QRCodeSVG } from 'qrcode.react'; // Import the QR code component
import type { Account } from '@/lib/mockData';

interface BulkQrPrintViewProps {
  accountsToPrint: Account[];
}

// Note: Forwarding ref is necessary for react-to-print to get the DOM node
const BulkQrPrintView = React.forwardRef<HTMLDivElement, BulkQrPrintViewProps>(
  ({ accountsToPrint }, ref) => {
    // Basic styling for print layout
    const printStyles: React.CSSProperties = {
      margin: '20px', // Add some margin around the content
    };

    const accountBlockStyles: React.CSSProperties = {
      border: '1px solid #ccc',
      padding: '15px',
      marginBottom: '20px',
      pageBreakInside: 'avoid', // Try to keep each account block on one page
      width: '100%', // Adjust as needed
      boxSizing: 'border-box',
      textAlign: 'center' // Center content within the block
    };

    const qrCodeContainerStyles: React.CSSProperties = {
      marginTop: '10px',
      marginBottom: '10px',
    };

    const textStyles: React.CSSProperties = {
        fontSize: '14px', // Adjust font size as needed
        fontWeight: 'bold',
        marginBottom: '5px'
    };

    return (
      <div ref={ref} style={printStyles}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '20px' }}>Account QR Codes</h1>
        {accountsToPrint.map((account) => (
          <div key={account.id} style={accountBlockStyles}>
            <p style={textStyles}>Account ID: {account.id}</p>
            <p style={textStyles}>Name: {account.name}</p>
            {/* You might want to include the balance or other details */}
            {/* <p style={textStyles}>Balance: {formatCurrency(account.balance)}</p> */}

            {/* Render the QR Code */}
            {/* The 'value' should be the data you want encoded in the QR */}
            {/* Often this is the Account ID, or a URL related to the account */}
            <div style={qrCodeContainerStyles}>
              <QRCodeSVG
                value={account.id} // CHANGE THIS if you need to encode different data
                size={128} // Size of the QR code in pixels (adjust as needed)
                bgColor={"#ffffff"} // Background color
                fgColor={"#000000"} // Foreground color
                level={"L"} // Error correction level (L, M, Q, H)
                includeMargin={false} // Set to true if you want whitespace margin included
              />
            </div>
             {/* You can add a placeholder for scanning instructions if needed */}
             {/* <p style={{fontSize: '10px', color: '#555'}}>Scan for details</p> */}
          </div>
        ))}
      </div>
    );
  }
);

// Set a display name for debugging purposes (good practice with forwardRef)
BulkQrPrintView.displayName = 'BulkQrPrintView';

export default BulkQrPrintView;