/**
 * Document Identity Generator
 * Generates verification codes, barcode data, and QR data for documents.
 * Used by auto-creation utilities to stamp mandatory verification identity on every document.
 */

/** Generate a unique verification code (format: XXXX-XXXX-XXXX) */
export function generateVerificationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments: string[] = [];
  for (let s = 0; s < 3; s++) {
    let seg = '';
    for (let i = 0; i < 4; i++) {
      seg += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(seg);
  }
  return segments.join('-');
}

/** Generate barcode data string for a document */
export function generateBarcodeData(documentType: string, documentNumber: string): string {
  return `${documentType.toUpperCase()}|${documentNumber}|${Date.now()}`;
}

/** Generate QR data JSON string for a document */
export function generateQRData(params: {
  type: string;
  number: string;
  verificationCode: string;
  shipmentNumber?: string;
  organizationName?: string;
}): string {
  return JSON.stringify({
    platform: 'iRecycle',
    type: params.type,
    doc_number: params.number,
    verification_code: params.verificationCode,
    shipment: params.shipmentNumber || null,
    org: params.organizationName || null,
    issued_at: new Date().toISOString(),
    verify_url: `${typeof window !== 'undefined' ? window.location.origin : ''}/qr-verify?type=${params.type}&code=${params.verificationCode}`,
  });
}

/** Generate complete document identity (verification code + barcode + QR) */
export function generateDocumentIdentity(documentType: string, documentNumber: string, extra?: {
  shipmentNumber?: string;
  organizationName?: string;
}) {
  const verificationCode = generateVerificationCode();
  const barcodeData = generateBarcodeData(documentType, documentNumber);
  const qrData = generateQRData({
    type: documentType,
    number: documentNumber,
    verificationCode,
    shipmentNumber: extra?.shipmentNumber,
    organizationName: extra?.organizationName,
  });

  return { verification_code: verificationCode, barcode_data: barcodeData, qr_data: qrData };
}
