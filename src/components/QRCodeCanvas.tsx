// src/components/QRCodeCanvas.tsx
import React, { useRef, useEffect } from 'react';
import QRCode from 'qrcode';

interface QRCodeCanvasProps {
  data: string | null | undefined; // Data to encode
  width?: number; // Canvas width
  options?: QRCode.QRCodeToCanvasOptions; // Pass through QR code options
  onError?: (error: any) => void; // Callback for errors
  onSuccess?: (canvas: HTMLCanvasElement) => void; // Callback on success
}

const QRCodeCanvas: React.FC<QRCodeCanvasProps> = ({
  data,
  width = 128, // Default width
  options = {},
  onError,
  onSuccess
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && data) {
      const canvasElement = canvasRef.current;
      const qrOptions: QRCode.QRCodeToCanvasOptions = {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: width,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        ...options, // Allow overriding defaults
      };

      QRCode.toCanvas(canvasElement, data, qrOptions, (error) => {
        if (error) {
          console.error('QR Code generation error:', error);
          if (onError) {
            onError(error);
          }
           // Display error message on canvas placeholder?
           canvasElement.getContext('2d')?.clearRect(0, 0, width, width); // Clear previous
           canvasElement.getContext('2d')?.fillText('QR Error', 10, 20);

        } else {
          // console.log('QR Code generated successfully!');
          if (onSuccess) {
              onSuccess(canvasElement);
          }
        }
      });
    } else if (canvasRef.current) {
        // Clear canvas if data is null/undefined
         const ctx = canvasRef.current.getContext('2d');
         if (ctx) {
             ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
             ctx.font = '10px sans-serif';
             ctx.fillStyle = '#9ca3af'; // gray-400
             ctx.textAlign = 'center';
             ctx.fillText('No data for QR code', canvasRef.current.width / 2, canvasRef.current.height / 2);
         }
    }
  }, [data, width, options, onError, onSuccess]); // Re-run effect if these change

  return (
    <canvas ref={canvasRef} width={width} height={width} style={{ display: 'block' }}>
      {/* Fallback text for screen readers or if canvas fails */}
      QR Code for {data || 'data unavailable'}
    </canvas>
  );
};

export default QRCodeCanvas;