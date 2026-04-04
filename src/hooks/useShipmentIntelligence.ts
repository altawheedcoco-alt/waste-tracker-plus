/**
 * useShipmentIntelligence — The "Maestro" hook
 * Cross-matches data from all parties (Generator, Transporter, Driver, Recycler)
 * to produce unified Compliance, Carbon, and Financial reconciliation results.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateShipmentCarbon, type ShipmentCarbonResult } from '@/lib/carbonEngine';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WeightReconciliation {
  generatorWeight: number;
  recyclerWeight: number;
  variance: number;         // percentage
  varianceKg: number;       // absolute kg
  status: 'match' | 'minor' | 'major' | 'missing';
  approvedWeight: number;   // the one used for invoicing
}

export interface ComplianceCheck {
  generatorLicense: boolean;
  transporterLicense: boolean;
  recyclerLicense: boolean;
  driverLicense: boolean;
  wasteClassified: boolean;
  qrScanned: boolean;
  gpsTracked: boolean;
  weighbridgeVerified: boolean;
  manifestComplete: boolean;
  overallScore: number;     // 0-100
  missingItems: string[];
}

export interface FinancialSummary {
  approvedWeight: number;
  unitPrice: number;
  totalAmount: number;
  invoiceGenerated: boolean;
  paymentStatus: string;
}

export interface PartyContribution {
  party: string;
  partyAr: string;
  orgName: string;
  dataProvided: string[];
  dataMissing: string[];
  completeness: number; // 0-100
}

export interface ShipmentIntelligence {
  shipmentId: string;
  carbon: ShipmentCarbonResult | null;
  weight: WeightReconciliation;
  compliance: ComplianceCheck;
  financial: FinancialSummary;
  parties: PartyContribution[];
  overallHealth: number; // 0-100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
}

// ─── Weight tolerance ────────────────────────────────────────────────────────
const WEIGHT_TOLERANCE_MINOR = 3;  // %
const WEIGHT_TOLERANCE_MAJOR = 10; // %

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useShipmentIntelligence(shipmentId: string | undefined) {
  return useQuery({
    queryKey: ['shipment-intelligence', shipmentId],
    queryFn: async (): Promise<ShipmentIntelligence> => {
      if (!shipmentId) throw new Error('No shipment ID');

      // 1) Fetch shipment with all party IDs
      const { data: shipment, error } = await supabase
        .from('shipments')
        .select(`
          id, waste_type, quantity, unit, status, disposal_method,
          actual_weight, price_per_unit, total_value,
          pickup_latitude, pickup_longitude,
          delivery_latitude, delivery_longitude,
          generator_id, transporter_id, recycler_id, disposal_facility_id,
          driver_id, shipment_number,
          generator_qr_code, transporter_pickup_qr, recycler_receipt_qr,
          weight_at_source, weight_at_destination, weight_discrepancy_pct,
          weighbridge_verified, created_at
        `)
        .eq('id', shipmentId)
        .single();

      if (error || !shipment) throw error || new Error('Shipment not found');

      // 2) Parallel fetches for party data
      const [carbonResult, custodyData, orgsData, driverData] = await Promise.all([
        calculateShipmentCarbon(shipmentId),
        fetchCustodyEvents(shipmentId),
        fetchPartyOrgs(shipment),
        fetchDriverInfo(shipment.driver_id),
      ]);

      // 3) Weight reconciliation
      const weight = reconcileWeights(shipment);

      // 4) Compliance check
      const compliance = checkCompliance(shipment, custodyData, orgsData, driverData);

      // 5) Financial summary
      const financial = summarizeFinancials(shipment, weight);

      // 6) Party contributions
      const parties = assessPartyContributions(shipment, orgsData, driverData, custodyData);

      // 7) Overall health
      const overallHealth = Math.round(
        (compliance.overallScore * 0.4) +
        (weight.status !== 'major' ? 30 : 10) +
        (carbonResult ? 15 : 0) +
        (financial.invoiceGenerated ? 15 : 5)
      );

      const grade = overallHealth >= 90 ? 'A+' :
                     overallHealth >= 75 ? 'A' :
                     overallHealth >= 60 ? 'B' :
                     overallHealth >= 40 ? 'C' : 'D';

      return {
        shipmentId,
        carbon: carbonResult,
        weight,
        compliance,
        financial,
        parties,
        overallHealth,
        grade,
      };
    },
    enabled: !!shipmentId,
    staleTime: 2 * 60 * 1000,
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fetchCustodyEvents(shipmentId: string) {
  const { data } = await supabase
    .from('custody_chain_events' as any)
    .select('*')
    .eq('shipment_id', shipmentId)
    .order('created_at', { ascending: true });
  return (data || []) as any[];
}

async function fetchPartyOrgs(shipment: any) {
  const ids = [shipment.generator_id, shipment.transporter_id, shipment.recycler_id, shipment.disposal_facility_id]
    .filter(Boolean);
  if (!ids.length) return [];
  const { data } = await supabase
    .from('organizations')
    .select('id, name, type, license_number, tax_id, stamp_url, signature_url')
    .in('id', ids);
  return data || [];
}

async function fetchDriverInfo(driverId: string | null) {
  if (!driverId) return null;
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, phone')
    .eq('id', driverId)
    .single();
  return data;
}

function reconcileWeights(shipment: any): WeightReconciliation {
  const declared = Number(shipment.quantity) || 0;
  const actual = Number(shipment.actual_weight) || 0;

  if (!actual || !declared) {
    return {
      generatorWeight: declared,
      recyclerWeight: actual,
      variance: 0,
      varianceKg: 0,
      status: 'missing',
      approvedWeight: declared || actual,
    };
  }

  const varianceKg = Math.abs(declared - actual);
  const variance = declared > 0 ? (varianceKg / declared) * 100 : 0;
  const status = variance <= WEIGHT_TOLERANCE_MINOR ? 'match' :
                 variance <= WEIGHT_TOLERANCE_MAJOR ? 'minor' : 'major';

  // Use the lower weight for invoicing (conservative)
  const approvedWeight = Math.min(declared, actual);

  return { generatorWeight: declared, recyclerWeight: actual, variance: Math.round(variance * 10) / 10, varianceKg, status, approvedWeight };
}

function checkCompliance(shipment: any, custody: any[], orgs: any[], driver: any): ComplianceCheck {
  const missingItems: string[] = [];

  const generatorOrg = orgs.find((o: any) => o.id === shipment.generator_id);
  const transporterOrg = orgs.find((o: any) => o.id === shipment.transporter_id);
  const recyclerOrg = orgs.find((o: any) => o.id === shipment.recycler_id);

  const generatorLicense = !!generatorOrg?.license_number;
  const transporterLicense = !!transporterOrg?.license_number;
  const recyclerLicense = !!recyclerOrg?.license_number;
  const driverLicense = !!driver;
  const wasteClassified = !!shipment.waste_type && shipment.waste_type !== 'other';
  const qrScanned = !!shipment.qr_code || custody.some((e: any) => e.event_type === 'qr_scan');
  const gpsTracked = !!(shipment.pickup_latitude && shipment.delivery_latitude);
  const weighbridgeVerified = !!shipment.actual_weight;
  const manifestComplete = ['delivered', 'confirmed'].includes(shipment.status);

  if (!generatorLicense) missingItems.push('رخصة المولد');
  if (!transporterLicense) missingItems.push('رخصة الناقل');
  if (!recyclerLicense) missingItems.push('رخصة المدوّر');
  if (!driverLicense) missingItems.push('بيانات السائق');
  if (!wasteClassified) missingItems.push('تصنيف المخلفات');
  if (!qrScanned) missingItems.push('مسح QR');
  if (!gpsTracked) missingItems.push('تتبع GPS');
  if (!weighbridgeVerified) missingItems.push('وزن الميزان');
  if (!manifestComplete) missingItems.push('اكتمال البوليصة');

  const checks = [generatorLicense, transporterLicense, recyclerLicense, driverLicense, wasteClassified, qrScanned, gpsTracked, weighbridgeVerified, manifestComplete];
  const overallScore = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  return {
    generatorLicense, transporterLicense, recyclerLicense, driverLicense,
    wasteClassified, qrScanned, gpsTracked, weighbridgeVerified, manifestComplete,
    overallScore, missingItems,
  };
}

function summarizeFinancials(shipment: any, weight: WeightReconciliation): FinancialSummary {
  return {
    approvedWeight: weight.approvedWeight,
    unitPrice: Number(shipment.price_per_unit) || 0,
    totalAmount: Number(shipment.total_price) || (weight.approvedWeight * (Number(shipment.price_per_unit) || 0)),
    invoiceGenerated: !!shipment.total_price,
    paymentStatus: shipment.status === 'confirmed' ? 'settled' : 'pending',
  };
}

function assessPartyContributions(shipment: any, orgs: any[], driver: any, custody: any[]): PartyContribution[] {
  const generatorOrg = orgs.find((o: any) => o.id === shipment.generator_id);
  const transporterOrg = orgs.find((o: any) => o.id === shipment.transporter_id);
  const recyclerOrg = orgs.find((o: any) => o.id === shipment.recycler_id);

  const parties: PartyContribution[] = [];

  // Generator
  {
    const provided: string[] = [];
    const missing: string[] = [];
    if (shipment.waste_type) provided.push('تصنيف المخلفات'); else missing.push('تصنيف المخلفات');
    if (shipment.quantity) provided.push('الكمية المُقدَّرة'); else missing.push('الكمية المُقدَّرة');
    if (generatorOrg?.license_number) provided.push('رخصة النشاط'); else missing.push('رخصة النشاط');
    if (shipment.pickup_latitude) provided.push('موقع التحميل'); else missing.push('موقع التحميل');
    const completeness = provided.length > 0 ? Math.round((provided.length / (provided.length + missing.length)) * 100) : 0;
    parties.push({ party: 'generator', partyAr: 'المولّد', orgName: generatorOrg?.name || '—', dataProvided: provided, dataMissing: missing, completeness });
  }

  // Transporter
  {
    const provided: string[] = [];
    const missing: string[] = [];
    if (transporterOrg?.license_number) provided.push('رخصة النقل'); else missing.push('رخصة النقل');
    if (shipment.vehicle_id) provided.push('بيانات المركبة'); else missing.push('بيانات المركبة');
    if (driver) provided.push('بيانات السائق'); else missing.push('بيانات السائق');
    const completeness = provided.length > 0 ? Math.round((provided.length / (provided.length + missing.length)) * 100) : 0;
    parties.push({ party: 'transporter', partyAr: 'الناقل', orgName: transporterOrg?.name || '—', dataProvided: provided, dataMissing: missing, completeness });
  }

  // Driver
  {
    const provided: string[] = [];
    const missing: string[] = [];
    const hasCustody = custody.length > 0;
    if (hasCustody) provided.push('سلسلة الحراسة'); else missing.push('سلسلة الحراسة');
    if (shipment.pickup_latitude && shipment.delivery_latitude) provided.push('مسار GPS'); else missing.push('مسار GPS');
    if (shipment.qr_code) provided.push('مسح QR'); else missing.push('مسح QR');
    const completeness = provided.length > 0 ? Math.round((provided.length / (provided.length + missing.length)) * 100) : 0;
    parties.push({ party: 'driver', partyAr: 'السائق', orgName: driver?.full_name || '—', dataProvided: provided, dataMissing: missing, completeness });
  }

  // Recycler / Disposal
  {
    const recycler = recyclerOrg || orgs.find((o: any) => o.id === shipment.disposal_facility_id);
    const provided: string[] = [];
    const missing: string[] = [];
    if (shipment.actual_weight) provided.push('الوزن الفعلي'); else missing.push('الوزن الفعلي');
    if (['delivered', 'confirmed'].includes(shipment.status)) provided.push('تأكيد الاستلام'); else missing.push('تأكيد الاستلام');
    if (recycler?.license_number) provided.push('رخصة المعالجة'); else missing.push('رخصة المعالجة');
    if (shipment.disposal_method) provided.push('طريقة المعالجة'); else missing.push('طريقة المعالجة');
    const completeness = provided.length > 0 ? Math.round((provided.length / (provided.length + missing.length)) * 100) : 0;
    parties.push({ party: 'recycler', partyAr: 'المُعالِج', orgName: recycler?.name || '—', dataProvided: provided, dataMissing: missing, completeness });
  }

  return parties;
}
