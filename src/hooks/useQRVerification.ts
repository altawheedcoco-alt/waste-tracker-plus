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

    // تحليل البادئات
    if (upperCode.startsWith('SHP-')) {
      return { type: 'shipment', reference: upperCode };
    }
    if (upperCode.startsWith('CRT-') || upperCode.startsWith('RCP-')) {
      // شهادة تدوير أو إيصال
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

    // محاولة استخراج URL
    try {
      const url = new URL(code);
      const type = url.searchParams.get('type');
      const ref = url.searchParams.get('code');
      if (type && ref) {
        return { type, reference: ref };
      }
    } catch {
      // ليس URL
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

    // تسجيل في جدول التحقق من العقود
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
        case 'report':
          // التقارير المجمعة - تحقق بسيط
          await logScan('report', reference, 'valid');
          verificationResult = {
            isValid: true,
            type: 'report',
            reference,
            message: 'هذا تقرير مجمع صادر رسمياً من النظام',
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
