import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, CameraOff } from 'lucide-react';

const BarcodeScanner = ({ onScan, onClose }) => {
  const scannerRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (scannerRef.current) {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      const onScanSuccess = (decodedText, decodedResult) => {
        // handle the scanned code as you like, for example:
        onScan(decodedText);
        html5QrcodeScanner.clear();
      };

      const onScanFailure = (error) => {
        // handle scan failure, usually better to ignore and keep scanning.
        // for example:
        // console.warn(`Code scan error = ${error}`);
      };

      html5QrcodeScanner.render(onScanSuccess, onScanFailure);

      return () => {
        html5QrcodeScanner.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner.", error);
        });
      };
    }
  }, [onScan]);

  return (
    <div className="w-full h-full">
      <div id="reader" ref={scannerRef} width="100%"></div>
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-100 text-red-700">
          <CameraOff className="w-12 h-12 mb-4" />
          <p className="text-lg font-semibold">Camera Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;
