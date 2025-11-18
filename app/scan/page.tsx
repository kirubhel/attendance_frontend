'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { qrApi } from '@/lib/api';
import Layout from '@/components/Layout';
import toast from 'react-hot-toast';
import { Html5Qrcode } from 'html5-qrcode';

export default function ScanPage() {
  const router = useRouter();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameraId, setCameraId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Cleanup on unmount
    return () => {
      stopScanning();
    };
  }, [router]);

  const getCameraId = async (): Promise<string> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      // Prefer back camera on mobile
      const backCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      );
      
      return backCamera?.deviceId || videoDevices[0]?.deviceId || '';
    } catch (err) {
      console.error('Error getting camera devices:', err);
      return '';
    }
  };

  const startScanning = async () => {
    try {
      setError('');
      setResult(null);

      // Get camera ID
      const camId = await getCameraId();
      setCameraId(camId);

      // Create scanner instance
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      // Start scanning
      await scanner.start(
        camId || { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // QR code detected
          console.log('QR Code detected:', decodedText);
          scanQRCode(decodedText);
        },
        (errorMessage) => {
          // Ignore scanning errors (just means no QR code detected yet)
          // console.log('Scan error:', errorMessage);
        }
      );

      setScanning(true);
      toast.success('Camera started! Point at QR code.');
    } catch (err: any) {
      console.error('Scanner error:', err);
      let errorMsg = 'Failed to start camera. ';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg += 'Please allow camera permissions.';
      } else if (err.name === 'NotFoundError') {
        errorMsg += 'No camera found.';
      } else if (err.name === 'NotReadableError') {
        errorMsg += 'Camera is in use by another app.';
      } else {
        errorMsg += err.message || 'Please try again.';
      }
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleManualInput = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const qrData = formData.get('qrData') as string;
    if (qrData) {
      await scanQRCode(qrData);
    }
  };

  const scanQRCode = async (qrData: string) => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await qrApi.scan(qrData);
      setResult(response);
      toast.success('QR code scanned successfully!');
      await stopScanning();
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to process QR code';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 p-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">QR Code Scanner</h1>

        {/* Manual Input (Fallback) */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Manual QR Code Input</h2>
          <form onSubmit={handleManualInput} className="space-y-4">
            <div>
              <label htmlFor="qrData" className="block text-sm font-medium text-gray-700 mb-1">
                Enter QR Code Data
              </label>
              <input
                id="qrData"
                name="qrData"
                type="text"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Paste QR code data here"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processing...' : 'Submit'}
            </button>
          </form>
        </div>

        {/* Camera Scanner */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Camera Scanner</h2>
          
          {!scanning ? (
            <button
              onClick={startScanning}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-medium"
            >
              Start Camera Scanner
            </button>
          ) : (
            <div className="space-y-4">
              <div 
                id="qr-reader" 
                className="w-full rounded-lg overflow-hidden"
                style={{ minHeight: '300px' }}
              />
              <button
                onClick={stopScanning}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors font-medium"
              >
                Stop Scanner
              </button>
              <p className="text-sm text-gray-500 text-center">
                Point camera at QR code. The scanner will automatically detect it.
              </p>
            </div>
          )}
        </div>

        {/* Results */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-2">Scan Successful!</h3>
            {result.student && (
              <div className="space-y-2 text-green-800">
                <p><strong>Student:</strong> {result.student.fullname}</p>
                <p><strong>Email:</strong> {result.student.email}</p>
              </div>
            )}
            {result.attendance && (
              <div className="mt-4">
                <p className="text-green-700 font-medium">
                  {result.attendance.message || 'Attendance recorded'}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  Status: {result.attendance.status}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Mobile-friendly instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Instructions</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Click "Start Camera Scanner" and allow camera permissions</li>
            <li>Point your camera at the student's QR code</li>
            <li>Ensure good lighting and hold the device steady</li>
            <li>The scanner will automatically detect and process the QR code</li>
            <li>If camera doesn't work, use the manual input field above</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
