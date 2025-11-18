import QRCode from 'qrcode';

export async function generateQRCode(studentId: string): Promise<string> {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(studentId, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

