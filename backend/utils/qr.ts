import QRCode from 'qrcode';

export async function generateQRCode(studentId: string): Promise<string> {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(studentId, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

