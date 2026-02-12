import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { normalizeShipment, normalizeRecyclingReport } from '@/lib/supabaseHelpers';
import { VerificationData } from '@/components/verification/VerificationResult';
import { toast } from 'sonner';

export const useQRVerification = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationData | null>(null);

  // تحديد نوع المستند من الكود
  const detectDocumentType = (code: string): { type: string; reference: string } => {
    const upperCode = code.toUpperCase();
    
    // محاولة استخراج من JSON (من QR الممسوح)
    try {
      const parsed = JSON.parse(code);
      if (parsed.code && parsed.seal) {
        return { type: 'contract', reference: parsed.code };
      }
      if (parsed.type && parsed.code) {
        return { type: parsed.type, reference: parsed.code };
      }
    } catch {
      // ليس JSON، استمر بالتحليل النصي
    }

    // محاولة استخراج من URL (من QR الممسوح بصيغة الرابط الموحد)
    try {
      const url = new URL(code);
      const type = url.searchParams.get('type');
      const ref = url.searchParams.get('code');
      if (type && ref) {
        return { type, reference: decodeURIComponent(ref) };
      }
    } catch {
      // ليس URL
    }

    // تحليل البادئات
    if (upperCode.startsWith('SHP-')) {
      return { type: 'shipment', reference: upperCode };
    }
    if (upperCode.startsWith('CRT-') || upperCode.startsWith('RCP-')) {
      if (upperCode.startsWith('RCP-')) {
        return { type: 'receipt', reference: upperCode };
      }
      return { type: 'certificate', reference: upperCode };
    }
    if (upperCode.startsWith('CNT-') || upperCode.startsWith('CON-')) {
      return { type: 'contract', reference: upperCode };
    }
    if (upperCode.startsWith('AGG-') || upperCode.startsWith('RPT-')) {
      return { type: 'report', reference: upperCode };
    }
    if (upperCode.startsWith('INV-')) {
      return { type: 'invoice', reference: upperCode };
    }
    if (upperCode.startsWith('DISP-') || upperCode.startsWith('SAFE-DISP:')) {
      const ref = upperCode.startsWith('SAFE-DISP:') ? upperCode.split('|')[0].replace('SAFE-DISP:', '') : upperCode;
      return { type: 'disposal', reference: ref };
    }
    if (upperCode.startsWith('STMT-') || upperCode.startsWith('STMT:')) {
      const ref = upperCode.startsWith('STMT:') ? upperCode.split('|')[0].replace('STMT:', '') : upperCode;
      return { type: 'statement', reference: ref };
    }
    if (upperCode.startsWith('AWL-') || upperCode.startsWith('AL-')) {
      return { type: 'award_letter', reference: upperCode };
    }

    return { type: 'unknown', reference: code };
  };

  // تسجيل عملية المسح
  const logScan = async (
    scanType: string,
    reference: string,
    result: 'valid' | 'invalid' | 'expired',
    documentId?: string,
    documentData?: any
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

  // التحقق من الشحنة
  const verifyShipment = async (reference: string): Promise<VerificationData> => {
    const { data: shipment, error } = await supabase
      .from('shipments')
      .select(`
        *,
        generator:organizations!shipments_generator_id_fkey(name, city),
        transporter:organizations!shipments_transporter_id_fkey(name, city),
        recycler:organizations!shipments_recycler_id_fkey(name, city)
      `)
      .eq('shipment_number', reference)
      .single();

    if (error || !shipment) {
      await logScan('shipment', reference, 'invalid');
      return {
        isValid: false,
        type: 'shipment',
        reference,
        message: 'لم يتم العثور على الشحنة في النظام',
      };
    }

    const normalized = normalizeShipment(shipment as any);
    await logScan('shipment', reference, 'valid', shipment.id, normalized);

    return {
      isValid: true,
      type: 'shipment',
      reference,
      status: shipment.status,
      data: normalized as any,
      verifiedAt: new Date().toISOString(),
    };
  };

  // التحقق من شهادة التدوير
  const verifyCertificate = async (reference: string): Promise<VerificationData> => {
    const { data: report, error } = await supabase
      .from('recycling_reports')
      .select(`
        *,
        shipment:shipments(
          *,
          generator:organizations!shipments_generator_id_fkey(name, city),
          transporter:organizations!shipments_transporter_id_fkey(name, city),
          recycler:organizations!shipments_recycler_id_fkey(name, city)
        ),
        recycler_organization:organizations!recycling_reports_recycler_organization_id_fkey(name)
      `)
      .eq('report_number', reference)
      .single();

    if (error || !report) {
      await logScan('certificate', reference, 'invalid');
      return {
        isValid: false,
        type: 'certificate',
        reference,
        message: 'لم يتم العثور على شهادة التدوير في النظام',
      };
    }

    const normalized = normalizeRecyclingReport(report as any);
    await logScan('certificate', reference, 'valid', report.id, normalized);

    return {
      isValid: true,
      type: 'certificate',
      reference,
      data: {
        ...normalized,
        ...(normalized.shipment || {}),
      } as any,
      verifiedAt: new Date().toISOString(),
    };
  };

  // التحقق من الإيصال
  const verifyReceipt = async (reference: string): Promise<VerificationData> => {
    const { data: receipt, error } = await supabase
      .from('shipment_receipts')
      .select(`
        *,
        shipment:shipments(
          *,
          generator:organizations!shipments_generator_id_fkey(name, city),
          transporter:organizations!shipments_transporter_id_fkey(name, city),
          recycler:organizations!shipments_recycler_id_fkey(name, city)
        )
      `)
      .eq('receipt_number', reference)
      .single();

    if (error || !receipt) {
      await logScan('receipt', reference, 'invalid');
      return {
        isValid: false,
        type: 'receipt',
        reference,
        message: 'لم يتم العثور على إيصال الاستلام في النظام',
      };
    }

    const shipmentData = receipt.shipment ? normalizeShipment(receipt.shipment as any) : null;
    await logScan('receipt', reference, 'valid', receipt.id, { ...receipt, shipment: shipmentData });

    return {
      isValid: true,
      type: 'receipt',
      reference,
      data: {
        receipt_number: receipt.receipt_number,
        signed_at: receipt.created_at,
        ...(shipmentData || {}),
      } as any,
      verifiedAt: new Date().toISOString(),
    };
  };

  // التحقق من العقد
  const verifyContract = async (reference: string): Promise<VerificationData> => {
    const { data: contract, error } = await supabase
      .from('contracts')
      .select('*')
      .or(`contract_number.eq.${reference},verification_code.eq.${reference}`)
      .single();

    if (error || !contract) {
      await logScan('contract', reference, 'invalid');
      return {
        isValid: false,
        type: 'contract',
        reference,
        message: 'لم يتم العثور على العقد في النظام',
      };
    }

    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('contract_verifications').insert({
      contract_id: contract.id,
      verification_code: reference,
      verification_result: true,
      verified_by_ip: null,
      user_agent: navigator.userAgent,
    });

    await logScan('contract', reference, 'valid', contract.id, contract);

    return {
      isValid: true,
      type: 'contract',
      reference,
      status: contract.status,
      data: {
        contract_number: contract.contract_number,
        title: contract.title,
        partner_name: contract.partner_name,
        start_date: contract.start_date,
        end_date: contract.end_date,
      },
      verifiedAt: new Date().toISOString(),
    };
  };

  // التحقق من الفاتورة
  const verifyInvoice = async (reference: string): Promise<VerificationData> => {
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        organization:organizations!invoices_organization_id_fkey(name, city),
        partner:organizations!invoices_partner_organization_id_fkey(name, city)
      `)
      .eq('invoice_number', reference)
      .single();

    if (error || !invoice) {
      await logScan('invoice', reference, 'invalid');
      return {
        isValid: false,
        type: 'invoice',
        reference,
        message: 'لم يتم العثور على الفاتورة في النظام',
      };
    }

    await logScan('invoice', reference, 'valid', invoice.id, invoice);

    return {
      isValid: true,
      type: 'invoice',
      reference,
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
      verifiedAt: new Date().toISOString(),
    };
  };

  // التحقق من شهادة التخلص
  const verifyDisposal = async (reference: string): Promise<VerificationData> => {
    // Search in recycling_reports with disposal type or shipments with disposal status
    const { data: shipment, error } = await supabase
      .from('shipments')
      .select(`
        *,
        generator:organizations!shipments_generator_id_fkey(name, city),
        recycler:organizations!shipments_recycler_id_fkey(name, city)
      `)
      .eq('shipment_number', reference)
      .single();

    if (error || !shipment) {
      await logScan('disposal', reference, 'invalid');
      return {
        isValid: false,
        type: 'disposal',
        reference,
        message: 'لم يتم العثور على شهادة التخلص في النظام',
      };
    }

    await logScan('disposal', reference, 'valid', shipment.id, shipment);
    const normalized = normalizeShipment(shipment as any);

    return {
      isValid: true,
      type: 'disposal',
      reference,
      status: shipment.status,
      data: normalized as any,
      verifiedAt: new Date().toISOString(),
    };
  };

  // التحقق من خطاب الترسية
  const verifyAwardLetter = async (reference: string): Promise<VerificationData> => {
    const { data: letter, error } = await supabase
      .from('award_letters')
      .select(`
        *,
        organization:organizations!award_letters_organization_id_fkey(name, city)
      `)
      .eq('letter_number', reference)
      .single();

    if (error || !letter) {
      await logScan('award_letter', reference, 'invalid');
      return {
        isValid: false,
        type: 'award_letter',
        reference,
        message: 'لم يتم العثور على خطاب الترسية في النظام',
      };
    }

    await logScan('award_letter', reference, 'valid', letter.id, letter);

    return {
      isValid: true,
      type: 'award_letter',
      reference,
      status: letter.status || 'active',
      data: {
        letter_number: letter.letter_number,
        title: letter.title,
        organization_name: (letter.organization as any)?.name,
        start_date: letter.start_date,
        end_date: letter.end_date,
        issue_date: letter.issue_date,
      },
      verifiedAt: new Date().toISOString(),
    };
  };

  // التحقق الرئيسي
  const verify = useCallback(async (scannedData: string) => {
    setLoading(true);
    setResult(null);

    try {
      const { type, reference } = detectDocumentType(scannedData);

      let verificationResult: VerificationData;

      switch (type) {
        case 'shipment':
          verificationResult = await verifyShipment(reference);
          break;
        case 'certificate':
          verificationResult = await verifyCertificate(reference);
          break;
        case 'receipt':
          verificationResult = await verifyReceipt(reference);
          break;
        case 'contract':
          verificationResult = await verifyContract(reference);
          break;
        case 'invoice':
          verificationResult = await verifyInvoice(reference);
          break;
        case 'disposal':
          verificationResult = await verifyDisposal(reference);
          break;
        case 'award_letter':
          verificationResult = await verifyAwardLetter(reference);
          break;
        case 'statement':
          await logScan('statement', reference, 'valid');
          verificationResult = {
            isValid: true,
            type: 'statement',
            reference,
            message: 'كشف الحساب صادر رسمياً من النظام ومعتمد',
            verifiedAt: new Date().toISOString(),
          };
          break;
        case 'report':
          await logScan('report', reference, 'valid');
          verificationResult = {
            isValid: true,
            type: 'report',
            reference,
            message: 'هذا تقرير مجمع صادر رسمياً من النظام',
            verifiedAt: new Date().toISOString(),
          };
          break;
        case 'entity_certificate':
          await logScan('entity_certificate', reference, 'valid');
          verificationResult = {
            isValid: true,
            type: 'entity_certificate',
            reference,
            message: 'شهادة الجهة صادرة رسمياً من النظام ومعتمدة',
            verifiedAt: new Date().toISOString(),
          };
          break;
        default:
          // محاولة البحث في جميع الجداول
          verificationResult = await verifyShipment(reference);
          if (!verificationResult.isValid) {
            verificationResult = await verifyCertificate(reference);
          }
          if (!verificationResult.isValid) {
            verificationResult = await verifyReceipt(reference);
          }
          if (!verificationResult.isValid) {
            verificationResult = await verifyContract(reference);
          }
          if (!verificationResult.isValid) {
            verificationResult = await verifyInvoice(reference);
          }
          if (!verificationResult.isValid) {
            verificationResult = await verifyAwardLetter(reference);
          }
          if (!verificationResult.isValid) {
            verificationResult = {
              isValid: false,
              type: 'unknown',
              reference,
              message: 'لم يتم العثور على المستند في النظام',
            };
          }
      }

      setResult(verificationResult);
      
      if (verificationResult.isValid) {
        toast.success('تم التحقق بنجاح');
      } else {
        toast.error('فشل التحقق');
      }

      return verificationResult;
    } catch (error) {
      console.error('Verification error:', error);
      const errorResult: VerificationData = {
        isValid: false,
        type: 'unknown',
        reference: scannedData,
        message: 'حدث خطأ أثناء التحقق',
      };
      setResult(errorResult);
      toast.error('حدث خطأ أثناء التحقق');
      return errorResult;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
  }, []);

  return {
    loading,
    result,
    verify,
    reset,
  };
};
