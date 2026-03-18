/**
 * Unified hook for fetching and preparing shipment print data
 */
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { resolveShipmentOrgUrls } from '@/utils/resolveOrgStorageUrls';
import { generateShipmentQRData } from '@/lib/shipmentQRData';
import type { ShipmentPrintData, ShipmentLogEntry, MovementSupervisor, DocumentSignatureData } from './types';

const SHIPMENT_SELECT = `
  id, shipment_number, waste_type, quantity, unit, status, created_at,
  pickup_address, delivery_address, pickup_date, expected_delivery_date,
  notes, generator_notes, recycler_notes, waste_description, hazard_level,
  packaging_method, disposal_method, approved_at, collection_started_at,
  in_transit_at, delivered_at, confirmed_at, manual_driver_name, manual_vehicle_plate,
  weighbridge_net_weight, generator_id, transporter_id, recycler_id,
  generator:organizations!shipments_generator_id_fkey(
    name, name_en, email, phone, secondary_phone, address, city, region,
    representative_name, representative_phone, representative_email,
    client_code, stamp_url, signature_url, logo_url,
    commercial_register, tax_card, environmental_approval_number,
    environmental_license, wmra_license, establishment_registration,
    registered_activity, activity_type, organization_type
  ),
  transporter:organizations!shipments_transporter_id_fkey(
    name, name_en, email, phone, secondary_phone, address, city, region,
    representative_name, representative_phone, representative_email,
    client_code, stamp_url, signature_url, logo_url,
    commercial_register, tax_card, environmental_approval_number,
    wmra_license, establishment_registration, registered_activity,
    land_transport_license, activity_type, organization_type
  ),
  recycler:organizations!shipments_recycler_id_fkey(
    name, name_en, email, phone, secondary_phone, address, city, region,
    representative_name, representative_phone, representative_email,
    client_code, stamp_url, signature_url, logo_url,
    commercial_register, tax_card, environmental_approval_number,
    environmental_license, wmra_license, establishment_registration,
    registered_activity, activity_type, ida_license, industrial_registry,
    license_number, organization_type
  ),
  driver:drivers(license_number, vehicle_type, vehicle_plate, profile:profiles(full_name, phone))
`;

interface UseShipmentPrintDataOptions {
  /** Pass shipment data directly (from parent) */
  shipmentData?: ShipmentPrintData | null;
  /** Or pass an ID to fetch */
  shipmentId?: string;
  /** Whether the dialog is open */
  isOpen: boolean;
}

export function useShipmentPrintData({ shipmentData, shipmentId, isOpen }: UseShipmentPrintDataOptions) {
  const [shipment, setShipment] = useState<ShipmentPrintData | null>(null);
  const [logs, setLogs] = useState<ShipmentLogEntry[]>([]);
  const [supervisors, setSupervisors] = useState<MovementSupervisor[]>([]);
  const [signatures, setSignatures] = useState<DocumentSignatureData[]>([]);
  const [loading, setLoading] = useState(false);
  const [declaration, setDeclaration] = useState<any>(null);

  // When shipmentData is provided directly, resolve URLs
  useEffect(() => {
    if (!isOpen) return;
    if (!shipmentData) { if (!shipmentId) setShipment(null); return; }
    let cancelled = false;
    resolveShipmentOrgUrls(shipmentData).then(resolved => {
      if (!cancelled) setShipment(resolved as unknown as ShipmentPrintData);
    });
    return () => { cancelled = true; };
  }, [shipmentData, isOpen]);

  // When shipmentId is provided, fetch data
  useEffect(() => {
    if (!isOpen || !shipmentId || shipmentData) return;
    fetchData();
  }, [isOpen, shipmentId]);

  const fetchData = async () => {
    if (!shipmentId) return;
    setLoading(true);
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(shipmentId);
      const filterColumn = isUUID ? 'id' : 'shipment_number';

      const { data, error } = await supabase
        .from('shipments')
        .select(SHIPMENT_SELECT)
        .eq(filterColumn, shipmentId)
        .maybeSingle();

      if (error) throw error;
      if (!data) { setShipment(null); setLoading(false); return; }

      const resolved = await resolveShipmentOrgUrls(data as any);
      setShipment(resolved as unknown as ShipmentPrintData);

      // Fetch logs
      const { data: logsData } = await supabase
        .from('shipment_logs')
        .select('id, status, notes, created_at, changed_by:profiles(full_name)')
        .eq('shipment_id', data.id)
        .order('created_at', { ascending: true });
      if (logsData) setLogs(logsData as unknown as ShipmentLogEntry[]);

      // Fetch supervisors
      const { data: supData } = await supabase
        .from('shipment_movement_supervisors')
        .select('*')
        .eq('shipment_id', data.id);
      if (supData) setSupervisors(supData as unknown as MovementSupervisor[]);

      // Fetch declaration
      const { data: declData } = await supabase
        .from('delivery_declarations')
        .select('*')
        .eq('shipment_id', data.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (declData) setDeclaration(declData);

      // Fetch digital signatures for this shipment
      const { data: sigData } = await supabase
        .from('document_signatures')
        .select('id, document_type, signer_name, signer_role, signer_title, signature_image_url, stamp_image_url, stamp_applied, signature_method, signature_hash, platform_seal_number, status, timestamp_signed, organization_id')
        .eq('document_id', data.id)
        .order('timestamp_signed', { ascending: true });
      if (sigData) setSignatures(sigData as unknown as DocumentSignatureData[]);

    } catch (e) {
      console.error('Error fetching shipment print data:', e);
    } finally {
      setLoading(false);
    }
  };

  // Also fetch supervisors/declaration when shipmentData is provided
  useEffect(() => {
    if (!isOpen || !shipment?.id || shipmentId) return;
    supabase.from('shipment_movement_supervisors').select('*').eq('shipment_id', shipment.id)
      .then(({ data }) => { if (data) setSupervisors(data as unknown as MovementSupervisor[]); });
    supabase.from('delivery_declarations').select('*').eq('shipment_id', shipment.id)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => { if (data) setDeclaration(data); });
    supabase.from('document_signatures')
      .select('id, document_type, signer_name, signer_role, signer_title, signature_image_url, stamp_image_url, stamp_applied, signature_method, signature_hash, platform_seal_number, status, timestamp_signed, organization_id')
      .eq('document_id', shipment.id)
      .order('timestamp_signed', { ascending: true })
      .then(({ data }) => { if (data) setSignatures(data as unknown as DocumentSignatureData[]); });
  }, [shipment?.id, isOpen]);

  const qrData = useMemo(() => shipment ? generateShipmentQRData(shipment) : null, [shipment]);

  const driverName = shipment?.driver?.profile?.full_name || shipment?.manual_driver_name || '-';
  const vehiclePlate = shipment?.driver?.vehicle_plate || shipment?.manual_vehicle_plate || '-';

  const documentSerial = shipment ? `DOC-${shipment.shipment_number.replace('SHP-', '')}` : '';

  const securityHash = useMemo(() => {
    if (!shipment) return '';
    const data = `${shipment.id}-${shipment.shipment_number}-${shipment.created_at}-${shipment.generator?.name || ''}-${shipment.quantity}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash) + data.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  }, [shipment]);

  const verificationCode = securityHash ? `SEC-${securityHash.slice(0, 4)}-${securityHash.slice(4, 8)}` : '';

  const pdfFileName = shipment ? [
    shipment.transporter?.name || 'الناقل',
    `شحنة-${shipment.shipment_number}`,
    shipment.generator?.name || 'المولد',
    (shipment.waste_type),
  ].join('-') : 'tracking-form';

  return {
    shipment, loading, logs, supervisors, signatures, declaration,
    qrData, driverName, vehiclePlate, documentSerial,
    verificationCode, pdfFileName,
  };
}
