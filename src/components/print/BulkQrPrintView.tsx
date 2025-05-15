// src/components/print/BulkQrPrintView.tsx
// Enhanced with multi-page support and grid layout for A4 printing

import React from "react";
import { QRCodeSVG } from "qrcode.react";
import type { Account } from "@/lib/mockData"; // Ensure path is correct

interface BulkQrPrintViewProps {
  accountsToPrint: Account[];
}

// Define a type for our filled account array that may contain null placeholders
type FilledAccountArray = (Account | null)[];

const BulkQrPrintView = React.forwardRef<HTMLDivElement, BulkQrPrintViewProps>(
  ({ accountsToPrint }, ref) => {
    // No accounts selected
    if (accountsToPrint.length === 0) {
      return (
        <div ref={ref} style={{ padding: "20px", textAlign: "center" }}>
          <p>No accounts selected for printing.</p>
        </div>
      );
    }

    // Calculate number of pages needed (8 QR codes per page)
    const itemsPerPage = 8;
    const pageCount = Math.ceil(accountsToPrint.length / itemsPerPage);

    // Create an array of pages
    const pages = Array.from({ length: pageCount }, (_, pageIndex) => {
      // Get accounts for this page
      const pageAccounts = accountsToPrint.slice(
        pageIndex * itemsPerPage,
        (pageIndex + 1) * itemsPerPage
      );

      // Fill remaining slots with empty placeholders to maintain grid layout
      const emptySlots = itemsPerPage - pageAccounts.length;
      const filledPageAccounts: FilledAccountArray = [...pageAccounts];

      if (emptySlots > 0 && emptySlots < itemsPerPage) {
        for (let i = 0; i < emptySlots; i++) {
          filledPageAccounts.push(null);
        }
      }

      return (
        <div
          key={`page-${pageIndex}`}
          className="a4-page print-page"
          style={{
            width: "210mm",
            height: "297mm",
            margin: "0 auto",
            marginBottom: "20mm", // Space between pages when previewing
            boxSizing: "border-box",
            fontFamily: "Arial, sans-serif",
            backgroundColor: "white",
            position: "relative",
            pageBreakAfter: "always",
            border: "1px solid #e0e0e0", // Make visible in preview
          }}
        >
          <div
            className="grid-layout"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gridTemplateRows: "repeat(4, 1fr)",
              gap: "10mm",
              padding: "10mm",
              height: "100%",
            }}
          >
            {filledPageAccounts.map((account, index) => {
              if (!account) {
                // Empty placeholder for grid alignment
                return (
                  <div
                    key={`empty-${index}`}
                    style={{ border: "1px dashed #eee", borderRadius: "5px" }}
                  ></div>
                );
              }

              // Determine QR code value - use account QR code if available, otherwise use ID
              let qrValue = account.id;
              let qrPayload = null;

              if (account.currentQrToken) {
                const qrString = account.currentQrToken || "";
                qrValue = qrString;

                // Try to decode for debugging purposes
                try {
                  const decodedString = atob(qrString);
                  qrPayload = JSON.parse(decodedString);
                } catch (e) {
                  // Silent fail - just use the raw string if can't decode
                }
              }

              return (
                <div
                  key={`qr-${account.id}`}
                  className="qr-card"
                  style={{
                    border: "1px dashed #bbb",
                    borderRadius: "5px",
                    padding: "5mm",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "bold",
                      marginBottom: "3mm",
                      textAlign: "center",
                    }}
                  >
                    {account.displayId || account.id}
                  </div>

                  <div
                    style={{
                      fontSize: "11px",
                      marginBottom: "5mm",
                      textAlign: "center",
                    }}
                  >
                    {account.childName || "N/A"} /{}
                    {account.guardianName || "N/A"}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      padding: "2mm",
                      backgroundColor: "#f9f9f9",
                      borderRadius: "5px",
                      marginBottom: "3mm",
                    }}
                  >
                    <QRCodeSVG
                      value={qrValue}
                      size={150} // Larger size for better scanning
                      bgColor={"#ffffff"}
                      fgColor={"#000000"}
                      level={"H"}
                      includeMargin={true}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Page footer */}
          <div
            style={{
              position: "absolute",
              bottom: "5mm",
              left: 0,
              width: "100%",
              textAlign: "center",
              fontSize: "8px",
              color: "#999",
            }}
          >
            Page {pageIndex + 1} of {pageCount} • Generated on{}
            {new Date().toLocaleDateString()} • Ledger Admin
          </div>
        </div>
      );
    });

    return (
      <div
        ref={ref}
        className="bulk-print-container print-section"
        style={{
          display: "block", // Ensure it's visible
          width: "100%",
          backgroundColor: "#fff",
          visibility: "visible", // Override any CSS that might hide it
        }}
      >
        {pages}
      </div>
    );
  }
);

BulkQrPrintView.displayName = "BulkQrPrintView";

export default BulkQrPrintView;
