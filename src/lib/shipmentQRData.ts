/**
 * Generates structured data payloads for QR codes and barcodes
 * on shipment tracking documents.
 */

export interface QRPayload {
  /** Verification URL */
  url: string;
  /** Compact metadata string for the main document QR */
  fullPayload: string;
  /** Per-signer QR payload */
  signerPayload: (party: { name: string; commercialRegister?: string; role: string }) => string;
  /** Barcode value (CODE128 compatible) */
  barcodeValue: string;
  /** Document integrity hash */
  docHash: string;
}

/**
 * Simple hash for document integrity (not cryptographic, but tamper-evident for printed docs)
 */
function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36).toUpperCase().padStart(8, '0').slice(0, 8);
}

export function generateShipmentQRData(shipment: {
  id: string;
  shipment_number: string;
  status: string;
  waste_type: string;
  quantity: number;
  unit: string;
  created_at: string;
  generator?: { name: string; commercial_register?: string; email?: string } | null;
  transporter?: { name: string; commercial_register?: string; email?: string } | null;
  recycler?: { name: string; commercial_register?: string; email?: string } | null;
  hazard_level?: string | null;
  waste_description?: string | null;
  pickup_address?: string;
  delivery_address?: string;
}): QRPayload {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://irecycle21.lovable.app';

  // Document integrity hash based on critical fields
  const hashInput = [
    shipment.shipment_number,
    shipment.waste_type,
    shipment.quantity,
    shipment.generator?.name || '',
    shipment.transporter?.name || '',
    shipment.recycler?.name || '',
    shipment.created_at,
  ].join('|');
  const docHash = simpleHash(hashInput);

  // Verification URL with hash
  const verifyUrl = `${origin}/verify?type=shipment&code=${shipment.shipment_number}&hash=${docHash}`;

  // Rich QR payload - compact JSON with essential data
  const fullPayload = JSON.stringify({
    v: 2, // payload version
    t: 'WTF', // Waste Transport Form
    n: shipment.shipment_number,
    s: shipment.status,
    h: docHash,
    dt: shipment.created_at?.slice(0, 10),
    w: {
      type: shipment.waste_type,
      desc: shipment.waste_description?.slice(0, 50) || undefined,
      qty: shipment.quantity,
      unit: shipment.unit,
      haz: shipment.hazard_level === 'hazardous' ? 1 : 0,
    },
    p: {
      g: shipment.generator?.name?.slice(0, 30) || undefined,
      gr: shipment.generator?.commercial_register || undefined,
      t: shipment.transporter?.name?.slice(0, 30) || undefined,
      tr: shipment.transporter?.commercial_register || undefined,
      r: shipment.recycler?.name?.slice(0, 30) || undefined,
      rr: shipment.recycler?.commercial_register || undefined,
    },
    loc: {
      from: shipment.pickup_address?.slice(0, 40) || undefined,
      to: shipment.delivery_address?.slice(0, 40) || undefined,
    },
    url: verifyUrl,
  });

  // Barcode: shipment number + hash suffix for integrity check
  const barcodeValue = `${shipment.shipment_number}-${docHash}`;

  // Per-signer QR
  const signerPayload = (party: { name: string; commercialRegister?: string; role: string }) => {
    return JSON.stringify({
      v: 1,
      t: 'SIG', // Signer verification
      doc: shipment.shipment_number,
      hash: docHash,
      signer: {
        name: party.name?.slice(0, 30),
        cr: party.commercialRegister || undefined,
        role: party.role,
      },
      url: `${origin}/qr-verify?type=signer&doc=${encodeURIComponent(shipment.shipment_number)}&role=${party.role}&hash=${docHash}`,
    });
  };

  return {
    url: verifyUrl,
    fullPayload,
    signerPayload,
    barcodeValue,
    docHash,
  };
}
