import React, { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { Account } from "@/lib/mockData";

interface QrCodePrintableProps {
  qrCodeString: string;
  account: Account;
  copies?: number; // Number of QR code copies to display on the page (max 8)
}

const QrCodePrintable = forwardRef<HTMLDivElement, QrCodePrintableProps>(
  ({ qrCodeString, account, copies = 8 }, ref) => {
    // Limit copies to 8 (for A4 paper)
    const actualCopies = Math.min(copies, 8);

    // Create an array with the number of copies
    const qrCodeCopies = Array.from({ length: actualCopies }, (_, i) => i);

    return (
      <div
        ref={ref}
        className="a4-page bg-white p-4"
        style={{
          width: "210mm",
          height: "297mm",
          margin: "0 auto",
          boxSizing: "border-box",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          {qrCodeCopies.map((index) => (
            <div
              key={index}
              className="qr-card border border-gray-300 rounded-md p-4 flex flex-col items-center"
              style={{
                height: "132mm",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#ffffff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <div
                className="text-center mb-2 font-bold"
                style={{ fontSize: "18px" }}
              >
                Account ID: {account.displayId}
              </div>
              <div className="text-center mb-2" style={{ fontSize: "16px" }}>
                Child: <strong>{account.childName}</strong>
              </div>
              <div className="text-center mb-4" style={{ fontSize: "14px" }}>
                Guardian: {account.guardianName}
              </div>

              <div
                style={{
                  padding: "10px",
                  border: "1px solid #eee",
                  borderRadius: "8px",
                  backgroundColor: "#f9f9f9",
                }}
              >
                <QRCodeSVG
                  value={qrCodeString}
                  size={200}
                  bgColor={"#ffffff"}
                  fgColor={"#000000"}
                  level={"H"}
                  includeMargin={true}
                />
              </div>

              <div
                className="mt-4 text-xs text-center text-gray-500"
                style={{ fontSize: "10px" }}
              >
                Ledger Admin • QR Code Generated on{}
                {new Date().toLocaleDateString()}
              </div>
              <div className="text-center mt-2" style={{ fontSize: "12px" }}>
                Scan to process transaction
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "10mm",
            left: 0,
            width: "100%",
            textAlign: "center",
            fontSize: "10px",
            color: "#999",
          }}
        >
          Page 1 of 1 • QR Codes for {account.displayId} •{}
          {new Date().toISOString().split("T")[0]}
        </div>
      </div>
    );
  }
);

QrCodePrintable.displayName = "QrCodePrintable";

export default QrCodePrintable;
