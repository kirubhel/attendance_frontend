'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { qrApi } from '@/lib/api';
import Layout from '@/components/Layout';

// Simple QR code scanner using camera
export default function ScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
  }, [router]);

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Use back camera on mobile
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setScanning(true);
      setError('');
      setResult(null);
    } catch (err) {
      setError('Failed to access camera. Please allow camera permissions.');
      console.error('Camera error:', err);
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
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
      stopScanning();
    } catch (err: any) {
      setError(err.message || 'Failed to process QR code');
    } finally {
      setLoading(false);
    }
  };

  // Simple QR code detection using canvas (basic implementation)
  // For production, use a library like html5-qrcode or jsQR
  useEffect(() => {
    if (!scanning || !videoRef.current || !canvasRef.current) return;

    const interval = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // For a real implementation, use jsQR or similar library here
      // This is a placeholder - you would decode the QR code from the canvas
    }, 500);

    return () => clearInterval(interval);
  }, [scanning]);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">QR Code Scanner</h1>

        {/* Manual Input (Fallback) */}
        <div className="bg-white rounded-lg shadow p-6">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Camera Scanner</h2>
          
          {!scanning ? (
            <button
              onClick={startScanning}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              Start Camera Scanner
            </button>
          ) : (
            <div className="space-y-4">
              <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '1' }}>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 border-4 border-green-500 rounded-lg pointer-events-none">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500"></div>
                </div>
              </div>
              <button
                onClick={stopScanning}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                Stop Scanner
              </button>
              <p className="text-sm text-gray-500 text-center">
                Point camera at QR code. For best results, use a QR code scanning library.
              </p>
            </div>
          )}
        </div>

        {/* Results */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
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
          <h3 className="font-semibold text-blue-900 mb-2">Mobile Instructions</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Allow camera permissions when prompted</li>
            <li>Point your camera at the student's QR code</li>
            <li>Ensure good lighting and steady hands</li>
            <li>Alternatively, use the manual input field above</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}

