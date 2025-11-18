'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { qrApi } from '@/lib/api';
import Layout from '@/components/Layout';
import toast from 'react-hot-toast';

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
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  const startScanning = async () => {
    try {
      setError('');
      setResult(null);
      
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Request camera access with better constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' }, // Use back camera on mobile
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        
        // Set up event handlers
        const handleLoadedMetadata = () => {
          video.play()
            .then(() => {
              console.log('Video playing successfully');
              setScanning(true);
              startQRDetection();
            })
            .catch((playErr) => {
              console.error('Error playing video:', playErr);
              setError('Failed to start camera. Please try again.');
              stopScanning();
            });
        };

        const handleError = (err: Event) => {
          console.error('Video error:', err);
          setError('Camera error. Please refresh and try again.');
          stopScanning();
        };

        video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
        video.addEventListener('error', handleError);
        
        // Fallback: if loadedmetadata doesn't fire, try playing anyway
        setTimeout(() => {
          if (!scanning && video.readyState >= 2) {
            video.play()
              .then(() => {
                console.log('Video playing (fallback)');
                setScanning(true);
                startQRDetection();
              })
              .catch((err) => {
                console.error('Fallback play error:', err);
              });
          }
        }, 1000);
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      let errorMsg = 'Failed to access camera. ';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg += 'Please allow camera permissions in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg += 'No camera found on this device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMsg += 'Camera is already in use by another application.';
      } else {
        errorMsg += err.message || 'Please check your camera settings.';
      }
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const stopScanning = () => {
    // Clear scanning interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.removeEventListener('loadedmetadata', () => {});
      videoRef.current.removeEventListener('error', () => {});
    }

    setScanning(false);
  };

  const startQRDetection = () => {
    if (!videoRef.current || !canvasRef.current) return;

    scanIntervalRef.current = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        return;
      }

      // Only scan if video is actually playing and has dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data for QR code detection
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Simple QR code detection placeholder
      // For production, integrate jsQR or html5-qrcode library here
      // This would decode the QR code from imageData
    }, 300); // Check every 300ms
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
      stopScanning();
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
              <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3', minHeight: '300px' }}>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  autoPlay
                  muted
                  style={{ display: 'block', width: '100%', height: '100%' }}
                />
                <canvas ref={canvasRef} className="hidden" />
                {/* Scanning overlay */}
                <div className="absolute inset-0 border-4 border-green-500 rounded-lg pointer-events-none">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500"></div>
                </div>
                {/* Loading indicator */}
                {!videoRef.current?.readyState && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="text-white text-center">
                      <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-sm">Initializing camera...</p>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={stopScanning}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors font-medium"
              >
                Stop Scanner
              </button>
              <p className="text-sm text-gray-500 text-center">
                Point camera at QR code. Ensure good lighting and hold steady.
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
            <li>If camera doesn't work, use the manual input field above</li>
            <li>On mobile, the back camera will be used automatically</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
