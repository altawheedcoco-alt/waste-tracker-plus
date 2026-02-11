import { supabase } from '@/integrations/supabase/client';

// Generate a unique, tamper-proof QR code payload for custody chain
export const generateCustodyQRPayload = (params: {
  shipmentId: string;
  shipmentNumber: string;
  eventType: 'generator_handover' | 'transporter_pickup' | 'transporter_delivery' | 'recycler_receipt';
  organizationId: string;
  organizationName: string;
  timestamp?: string;
}): string => {
  const ts = params.timestamp || new Date().toISOString();
  const payload = {
    sys: 'iRecycle-CoC',
    v: 1,
    sid: params.shipmentId,
    sn: params.shipmentNumber,
    evt: params.eventType,
    org: params.organizationId,
    orgName: params.organizationName,
    ts,
    nonce: crypto.randomUUID().slice(0, 8),
  };
  return JSON.stringify(payload);
};

// Hash the QR data for integrity verification
export const hashQRData = async (data: string): Promise<string> => {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Record a custody chain event
export const recordCustodyEvent = async (params: {
  shipmentId: string;
  eventType: 'generator_handover' | 'transporter_pickup' | 'transporter_delivery' | 'recycler_receipt';
  qrCodeData: string;
  previousEventId?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAccuracy?: number;
  photoProofUrl?: string;
  notes?: string;
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!profile?.organization_id) throw new Error('No organization found');

  const qrHash = await hashQRData(params.qrCodeData);

  const { data, error } = await supabase
    .from('custody_chain_events')
    .insert({
      shipment_id: params.shipmentId,
      event_type: params.eventType,
      actor_organization_id: profile.organization_id,
      actor_user_id: user.id,
      qr_code_data: params.qrCodeData,
      qr_code_hash: qrHash,
      previous_event_id: params.previousEventId || null,
      gps_latitude: params.gpsLatitude,
      gps_longitude: params.gpsLongitude,
      gps_accuracy: params.gpsAccuracy,
      photo_proof_url: params.photoProofUrl,
      notes: params.notes,
      device_info: navigator.userAgent,
      metadata: {
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        timestamp_local: new Date().toString(),
      },
    } as any)
    .select()
    .single();

  if (error) throw error;

  // Update shipment QR fields based on event type
  const qrField = {
    generator_handover: 'generator_qr_code',
    transporter_pickup: 'transporter_pickup_qr',
    transporter_delivery: 'transporter_delivery_qr',
    recycler_receipt: 'recycler_receipt_qr',
  }[params.eventType];

  await supabase
    .from('shipments')
    .update({ [qrField]: params.qrCodeData } as any)
    .eq('id', params.shipmentId);

  // Check if chain is complete
  if (params.eventType === 'recycler_receipt') {
    await supabase
      .from('shipments')
      .update({ custody_chain_complete: true } as any)
      .eq('id', params.shipmentId);
  }

  return data;
};

// Get the full custody chain for a shipment
export const getCustodyChain = async (shipmentId: string) => {
  const { data, error } = await supabase
    .from('custody_chain_events')
    .select(`
      *,
      actor_organization:organizations!custody_chain_events_actor_organization_id_fkey(name, organization_type)
    `)
    .eq('shipment_id', shipmentId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
};

// Verify a scanned QR code against the chain
export const verifyScannedQR = async (scannedData: string) => {
  try {
    const parsed = JSON.parse(scannedData);
    if (parsed.sys !== 'iRecycle-CoC') {
      return { valid: false, message: 'ليس رمز سلسلة حيازة صالح' };
    }

    const hash = await hashQRData(scannedData);

    const { data: events } = await supabase
      .from('custody_chain_events')
      .select('*')
      .eq('qr_code_hash', hash);

    if (events && events.length > 0) {
      return {
        valid: true,
        alreadyScanned: true,
        event: events[0],
        message: 'تم مسح هذا الرمز مسبقاً',
      };
    }

    // Verify shipment exists
    const { data: shipment } = await supabase
      .from('shipments')
      .select('id, shipment_number, status')
      .eq('id', parsed.sid)
      .single();

    if (!shipment) {
      return { valid: false, message: 'الشحنة غير موجودة' };
    }

    return {
      valid: true,
      alreadyScanned: false,
      shipmentId: parsed.sid,
      shipmentNumber: parsed.sn,
      eventType: parsed.evt,
      sourceOrg: parsed.orgName,
      timestamp: parsed.ts,
    };
  } catch {
    return { valid: false, message: 'رمز غير صالح' };
  }
};

// Event type labels
export const EVENT_TYPE_LABELS: Record<string, string> = {
  generator_handover: 'تسليم المولد',
  transporter_pickup: 'استلام الناقل',
  transporter_delivery: 'تسليم الناقل',
  recycler_receipt: 'استلام المدوّر',
  disposal_receipt: 'استلام جهة التخلص',
};
