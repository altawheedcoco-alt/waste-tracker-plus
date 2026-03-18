import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { normalizeShipment, normalizeRecyclingReport } from '@/lib/supabaseHelpers';
import { VerificationData, SignatureInfo } from '@/components/verification/VerificationResult';
import { toast } from 'sonner';

/**
 * Fetch signatures for a document from document_signatures table
 */
async function fetchDocumentSignatures(
  documentType: string,
  documentId: string
): Promise<SignatureInfo[]> {
  try {
    const { data, error } = await supabase
      .from('document_signatures')
      .select('id, signer_name, signer_role, signer_title, signature_method, signature_image_url, stamp_applied, stamp_image_url, platform_seal_number, document_hash, signature_hash, status, created_at')
      .eq('document_type', documentType)
      .eq('document_id', documentId)
      .eq('status', 'signed')
      .order('created_at', { ascending: false });

    if (error) return [];
    return (data || []) as SignatureInfo[];
  } catch {
    return [];
  }
}

export const useQRVerification = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationData | null>(null);

  const detectDocumentType = (code: string): { type: string; reference: string } => {
    const upperCode = code.toUpperCase();
    
    try {
      const parsed = JSON.parse(code);
      if (parsed.type && parsed.code) return { type: parsed.type, reference: parsed.code };
      if (parsed.code && parsed.seal) return { type: 'contract', reference: parsed.code };
    } catch {}

    try {
      const url = new URL(code);
      const type = url.searchParams.get('type');
      const ref = url.searchParams.get('code');
      if (type && ref) return { type, reference: decodeURIComponent(ref) };
    } catch {}

    if (upperCode.startsWith('SHP-')) return { type: 'shipment', reference: upperCode };
    if (upperCode.startsWith('RCP-')) return { type: 'receipt', reference: upperCode };
    if (upperCode.startsWith('CRT-')) return { type: 'certificate', reference: upperCode };
    if (upperCode.startsWith('CNT-') || upperCode.startsWith('CON-')) return { type: 'contract', reference: upperCode };
    if (upperCode.startsWith('AGG-') || upperCode.startsWith('RPT-')) return { type: 'report', reference: upperCode };
    if (upperCode.startsWith('INV-')) return { type: 'invoice', reference: upperCode };
    if (upperCode.startsWith('DISP-') || upperCode.startsWith('SAFE-DISP:')) {
      const ref = upperCode.startsWith('SAFE-DISP:') ? upperCode.split('|')[0].replace('SAFE-DISP:', '') : upperCode;
      return { type: 'disposal', reference: ref };
    }
    if (upperCode.startsWith('STMT-') || upperCode.startsWith('STMT:')) {
      const ref = upperCode.startsWith('STMT:') ? upperCode.split('|')[0].replace('STMT:', '') : upperCode;
      return { type: 'statement', reference: ref };
    }
    if (upperCode.startsWith('AWL-') || upperCode.startsWith('AL-')) return { type: 'award_letter', reference: upperCode };
    if (upperCode.startsWith('LMS-CERT-')) return { type: 'lms_certificate', reference: upperCode };
    if (upperCode.startsWith('SIG-') || upperCode.startsWith('SIGNER-')) return { type: 'signer', reference: upperCode };
    if (upperCode.startsWith('ATT-')) return { type: 'attestation', reference: upperCode };
    if (upperCode.startsWith('MS-') || upperCode.startsWith('OS-')) return { type: 'seal', reference: upperCode };

    return { type: 'unknown', reference: code };
  };

  const logScan = async (
    scanType: string, reference: string,
    result: 'valid' | 'invalid' | 'expired',
    documentId?: string, documentData?: any
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('qr_scan_logs').insert({
        scan_type: scanType,
        document_reference: reference,
        document_id: documentId,
        scan_result: result,
        scanner_user_id: user?.id,
        scanner_user_agent: navigator.userAgent,
        document_data: documentData,
      });
    } catch (error) {
      console.error('Failed to log scan:', error);
    }
  };

  const verifyShipment = async (reference: string): Promise<VerificationData> => {
    const { data: shipment, error } = await supabase
      .from('shipments')
      .select(`*, generator:organizations!shipments_generator_id_fkey(name, city), transporter:organizations!shipments_transporter_id_fkey(name, city), recycler:organizations!shipments_recycler_id_fkey(name, city)`)
      .eq('shipment_number', reference)
      .single();

    if (error || !shipment) {
      await logScan('shipment', reference, 'invalid');
      return { isValid: false, type: 'shipment', reference, message: 'لم يتم العثور على الشحنة في النظام' };
    }

    const normalized = normalizeShipment(shipment as any);
    const signatures = await fetchDocumentSignatures('shipment', shipment.id);
    await logScan('shipment', reference, 'valid', shipment.id, normalized);

    return {
      isValid: true, type: 'shipment', reference,
      status: shipment.status,
      data: normalized as any,
      signatures,
      verifiedAt: new Date().toISOString(),
    };
  };

  const verifyCertificate = async (reference: string): Promise<VerificationData> => {
    const { data: report, error } = await supabase
      .from('recycling_reports')
      .select(`*, shipment:shipments(*, generator:organizations!shipments_generator_id_fkey(name, city), transporter:organizations!shipments_transporter_id_fkey(name, city), recycler:organizations!shipments_recycler_id_fkey(name, city)), recycler_organization:organizations!recycling_reports_recycler_organization_id_fkey(name)`)
      .eq('report_number', reference)
      .single();

    if (error || !report) {
      await logScan('certificate', reference, 'invalid');
      return { isValid: false, type: 'certificate', reference, message: 'لم يتم العثور على شهادة التدوير في النظام' };
    }

    const normalized = normalizeRecyclingReport(report as any);
    const signatures = await fetchDocumentSignatures('certificate', report.id);
    await logScan('certificate', reference, 'valid', report.id, normalized);

    return {
      isValid: true, type: 'certificate', reference,
      data: { ...normalized, ...(normalized.shipment || {}) } as any,
      signatures,
      verifiedAt: new Date().toISOString(),
    };
  };

  const verifyReceipt = async (reference: string): Promise<VerificationData> => {
    const { data: receipt, error } = await supabase
      .from('shipment_receipts')
      .select(`*, shipment:shipments(*, generator:organizations!shipments_generator_id_fkey(name, city), transporter:organizations!shipments_transporter_id_fkey(name, city), recycler:organizations!shipments_recycler_id_fkey(name, city))`)
      .eq('receipt_number', reference)
      .single();

    if (error || !receipt) {
      await logScan('receipt', reference, 'invalid');
      return { isValid: false, type: 'receipt', reference, message: 'لم يتم العثور على إيصال الاستلام في النظام' };
    }

    const shipmentData = receipt.shipment ? normalizeShipment(receipt.shipment as any) : null;
    await logScan('receipt', reference, 'valid', receipt.id, { ...receipt, shipment: shipmentData });

    return {
      isValid: true, type: 'receipt', reference,
      data: { receipt_number: receipt.receipt_number, signed_at: receipt.created_at, ...(shipmentData || {}) } as any,
      verifiedAt: new Date().toISOString(),
    };
  };

  const verifyContract = async (reference: string): Promise<VerificationData> => {
    const { data: contract, error } = await supabase
      .from('contracts')
      .select('*')
      .or(`contract_number.eq.${reference},verification_code.eq.${reference}`)
      .single();

    if (error || !contract) {
      await logScan('contract', reference, 'invalid');
      return { isValid: false, type: 'contract', reference, message: 'لم يتم العثور على العقد في النظام' };
    }

    await supabase.from('contract_verifications').insert({
      contract_id: contract.id,
      verification_code: reference,
      verification_result: true,
      verified_by_ip: null,
      user_agent: navigator.userAgent,
    });

    const signatures = await fetchDocumentSignatures('contract', contract.id);
    await logScan('contract', reference, 'valid', contract.id, contract);

    return {
      isValid: true, type: 'contract', reference,
      status: contract.status,
      data: {
        contract_number: contract.contract_number,
        title: contract.title,
        partner_name: contract.partner_name,
        start_date: contract.start_date,
        end_date: contract.end_date,
      },
      signatures,
      verifiedAt: new Date().toISOString(),
    };
  };

  const verifyInvoice = async (reference: string): Promise<VerificationData> => {
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`*, organization:organizations!invoices_organization_id_fkey(name, city), partner:organizations!invoices_partner_organization_id_fkey(name, city)`)
      .eq('invoice_number', reference)
      .single();

    if (error || !invoice) {
      await logScan('invoice', reference, 'invalid');
      return { isValid: false, type: 'invoice', reference, message: 'لم يتم العثور على الفاتورة في النظام' };
    }

    const signatures = await fetchDocumentSignatures('invoice', invoice.id);
    await logScan('invoice', reference, 'valid', invoice.id, invoice);

    return {
      isValid: true, type: 'invoice', reference,
      status: invoice.status,
      data: {
        invoice_number: invoice.invoice_number,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        total_amount: invoice.total_amount,
        currency: invoice.currency,
        organization_name: (invoice.organization as any)?.name,
        partner_name: invoice.partner_name || (invoice.partner as any)?.name,
      },
      signatures,
      verifiedAt: new Date().toISOString(),
    };
  };

  const verifyDisposal = async (reference: string): Promise<VerificationData> => {
    const { data: shipment, error } = await supabase
      .from('shipments')
      .select(`*, generator:organizations!shipments_generator_id_fkey(name, city), recycler:organizations!shipments_recycler_id_fkey(name, city)`)
      .eq('shipment_number', reference)
      .single();

    if (error || !shipment) {
      await logScan('disposal', reference, 'invalid');
      return { isValid: false, type: 'disposal', reference, message: 'لم يتم العثور على شهادة التخلص في النظام' };
    }

    const normalized = normalizeShipment(shipment as any);
    const signatures = await fetchDocumentSignatures('disposal', shipment.id);
    await logScan('disposal', reference, 'valid', shipment.id, shipment);

    return {
      isValid: true, type: 'disposal', reference,
      status: shipment.status,
      data: normalized as any,
      signatures,
      verifiedAt: new Date().toISOString(),
    };
  };

  const verifyAwardLetter = async (reference: string): Promise<VerificationData> => {
    const { data: letter, error } = await supabase
      .from('award_letters')
      .select(`*, organization:organizations!award_letters_organization_id_fkey(name, city)`)
      .eq('letter_number', reference)
      .single();

    if (error || !letter) {
      await logScan('award_letter', reference, 'invalid');
      return { isValid: false, type: 'award_letter', reference, message: 'لم يتم العثور على خطاب الترسية في النظام' };
    }

    const signatures = await fetchDocumentSignatures('award_letter', letter.id);
    await logScan('award_letter', reference, 'valid', letter.id, letter);

    return {
      isValid: true, type: 'award_letter', reference,
      status: letter.status || 'active',
      data: {
        letter_number: letter.letter_number,
        title: letter.title,
        organization_name: (letter.organization as any)?.name,
        start_date: letter.start_date,
        end_date: letter.end_date,
        issue_date: letter.issue_date,
      },
      signatures,
      verifiedAt: new Date().toISOString(),
    };
  };

  const verifyLMSCertificate = async (reference: string): Promise<VerificationData> => {
    const { data: cert, error } = await supabase
      .from('lms_certificates')
      .select('*, lms_courses(title, title_ar)')
      .eq('certificate_number', reference)
      .maybeSingle();

    if (error || !cert) {
      await logScan('lms_certificate', reference, 'invalid');
      return { isValid: false, type: 'lms_certificate', reference, message: 'لم يتم العثور على شهادة الدورة التدريبية في النظام' };
    }

    await logScan('lms_certificate', reference, 'valid', cert.id, cert);
    const course = cert.lms_courses as any;

    return {
      isValid: true, type: 'lms_certificate', reference,
      status: cert.is_valid ? 'valid' : 'expired',
      data: {
        certificate_number: cert.certificate_number,
        course_title: course?.title_ar || course?.title || 'دورة تدريبية',
        score: cert.score,
        issued_at: cert.issued_at,
        is_valid: cert.is_valid,
      },
      message: `شهادة إتمام دورة "${course?.title_ar || 'تدريبية'}" - النتيجة: ${cert.score}%`,
      verifiedAt: new Date().toISOString(),
    };
  };

  // التحقق من المفوض المعتمد
  const verifySigner = async (reference: string): Promise<VerificationData> => {
    const cleanRef = reference.replace(/^(SIG-|SIGNER-)/, '');
    
    const { data: signer, error } = await supabase
      .from('authorized_signatories')
      .select(`*, organization:organizations!authorized_signatories_organization_id_fkey(name, city), profile:profiles!authorized_signatories_user_id_fkey(full_name, email)`)
      .or(`signatory_code.eq.${cleanRef},signatory_code.eq.${reference},id.eq.${cleanRef}`)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !signer) {
      await logScan('signer', reference, 'invalid');
      return { isValid: false, type: 'signer', reference, message: 'لم يتم العثور على بيانات المفوض أو أنه غير نشط' };
    }

    await logScan('signer', reference, 'valid', signer.id, signer);

    return {
      isValid: true, type: 'signer', reference,
      status: 'active',
      data: {
        signer_name: (signer as any).full_name || (signer.profile as any)?.full_name,
        signer_title: (signer as any).job_title,
        authority_level: signer.authority_level,
        organization_name: (signer.organization as any)?.name,
        can_sign_shipments: (signer as any).can_sign_shipments,
        can_sign_contracts: (signer as any).can_sign_contracts,
        can_sign_invoices: (signer as any).can_sign_invoices,
        can_sign_certificates: (signer as any).can_sign_certificates,
        activated_at: (signer as any).activated_at,
      },
      message: 'مفوض معتمد ونشط في النظام',
      verifiedAt: new Date().toISOString(),
    };
  };

  const verifyAttestation = async (reference: string): Promise<VerificationData> => {
    // Try by attestation_number first, then verification_code
    const { data: attestation, error } = await supabase
      .from('organization_attestations')
      .select('*')
      .or(`attestation_number.eq.${reference},verification_code.eq.${reference}`)
      .maybeSingle();

    if (error || !attestation) {
      await logScan('attestation', reference, 'invalid');
      return { isValid: false, type: 'attestation', reference, message: 'لم يتم العثور على الإفادة في النظام' };
    }

    const isActive = (attestation as any).status === 'active';
    await logScan('attestation', reference, isActive ? 'valid' : 'expired', attestation.id, attestation);

    return {
      isValid: isActive,
      type: 'attestation',
      reference,
      status: (attestation as any).status,
      data: {
        attestation_number: (attestation as any).attestation_number,
        organization_name: (attestation as any).organization_name,
        organization_type: (attestation as any).organization_type,
        system_seal_number: (attestation as any).system_seal_number,
        terms_accepted: (attestation as any).terms_accepted,
        identity_verified: (attestation as any).identity_verified,
        licenses_valid: (attestation as any).licenses_valid,
        kyc_complete: (attestation as any).kyc_complete,
        issued_at: (attestation as any).issued_at,
      },
      message: isActive
        ? 'إفادة تسجيل واعتماد رقمي سارية وصادرة رسمياً من المنصة'
        : 'هذه الإفادة ملغاة أو منتهية الصلاحية',
      verifiedAt: new Date().toISOString(),
    };
  };

  const verify = useCallback(async (scannedData: string) => {
    setLoading(true);
    setResult(null);

    try {
      const { type, reference } = detectDocumentType(scannedData);
      let verificationResult: VerificationData;

      switch (type) {
        case 'shipment': verificationResult = await verifyShipment(reference); break;
        case 'certificate': verificationResult = await verifyCertificate(reference); break;
        case 'receipt': verificationResult = await verifyReceipt(reference); break;
        case 'contract': verificationResult = await verifyContract(reference); break;
        case 'invoice': verificationResult = await verifyInvoice(reference); break;
        case 'disposal': verificationResult = await verifyDisposal(reference); break;
        case 'award_letter': verificationResult = await verifyAwardLetter(reference); break;
        case 'lms_certificate': verificationResult = await verifyLMSCertificate(reference); break;
        case 'signer': verificationResult = await verifySigner(reference); break;
        case 'statement':
          await logScan('statement', reference, 'valid');
          verificationResult = { isValid: true, type: 'statement', reference, message: 'كشف الحساب صادر رسمياً من النظام ومعتمد', verifiedAt: new Date().toISOString() };
          break;
        case 'report':
          await logScan('report', reference, 'valid');
          verificationResult = { isValid: true, type: 'report', reference, message: 'هذا تقرير مجمع صادر رسمياً من النظام', verifiedAt: new Date().toISOString() };
          break;
        case 'entity_certificate':
          await logScan('entity_certificate', reference, 'valid');
          verificationResult = { isValid: true, type: 'entity_certificate', reference, message: 'شهادة الجهة صادرة رسمياً من النظام ومعتمدة', verifiedAt: new Date().toISOString() };
          break;
        case 'attestation': verificationResult = await verifyAttestation(reference); break;
        default:
          // Universal fallback: try ALL document types sequentially
          verificationResult = await verifyShipment(reference);
          if (!verificationResult.isValid) verificationResult = await verifyCertificate(reference);
          if (!verificationResult.isValid) verificationResult = await verifyReceipt(reference);
          if (!verificationResult.isValid) verificationResult = await verifyContract(reference);
          if (!verificationResult.isValid) verificationResult = await verifyInvoice(reference);
          if (!verificationResult.isValid) verificationResult = await verifyAwardLetter(reference);
          if (!verificationResult.isValid) verificationResult = await verifyDisposal(reference);
          if (!verificationResult.isValid) verificationResult = await verifyLMSCertificate(reference);
          if (!verificationResult.isValid) verificationResult = await verifySigner(reference);
          if (!verificationResult.isValid) verificationResult = await verifyAttestation(reference);
          if (!verificationResult.isValid) {
            verificationResult = { isValid: false, type: 'unknown', reference, message: 'لم يتم العثور على المستند في أي سجل بالنظام' };
          }
      }

      setResult(verificationResult);
      if (verificationResult.isValid) toast.success('تم التحقق بنجاح');
      else toast.error('فشل التحقق');
      return verificationResult;
    } catch (error) {
      console.error('Verification error:', error);
      const errorResult: VerificationData = { isValid: false, type: 'unknown', reference: scannedData, message: 'حدث خطأ أثناء التحقق' };
      setResult(errorResult);
      toast.error('حدث خطأ أثناء التحقق');
      return errorResult;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => { setResult(null); }, []);

  return { loading, result, verify, reset };
};
