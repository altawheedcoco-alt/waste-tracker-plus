import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * أنواع التصرفات المتاحة في النظام
 */
export type ActionType = 
  // إجراءات المصادقة
  | 'auth_login' | 'auth_logout' | 'auth_signup' | 'auth_password_reset'
  // إجراءات الشحنات
  | 'shipment_create' | 'shipment_update' | 'shipment_delete' | 'shipment_status_change'
  | 'shipment_view' | 'shipment_print' | 'shipment_assign_driver' | 'shipment_cancel'
  // إجراءات الفواتير
  | 'invoice_create' | 'invoice_update' | 'invoice_delete' | 'invoice_print' | 'invoice_send'
  // إجراءات الإيداعات
  | 'deposit_create' | 'deposit_update' | 'deposit_delete' | 'deposit_approve' | 'deposit_reject'
  // إجراءات العقود
  | 'contract_create' | 'contract_update' | 'contract_delete' | 'contract_sign' | 'contract_verify'
  // إجراءات المؤسسات
  | 'organization_update' | 'organization_settings_change'
  // إجراءات المستخدمين
  | 'user_invite' | 'user_role_change' | 'user_deactivate' | 'user_profile_update'
  // إجراءات السائقين
  | 'driver_create' | 'driver_update' | 'driver_delete' | 'driver_assign' | 'driver_location_update'
  // إجراءات التقارير
  | 'report_generate' | 'report_export' | 'certificate_generate' | 'receipt_generate'
  // إجراءات النظام
  | 'settings_change' | 'api_key_create' | 'api_key_delete' | 'file_upload' | 'file_delete'
  // إجراءات المحاسبة
  | 'ledger_entry_create' | 'ledger_entry_update' | 'period_close' | 'period_open'
  // إجراءات التحقق
  | 'qr_scan' | 'document_verify' | 'biometric_verify'
  // أخرى
  | 'custom';

/**
 * أنواع الموارد
 */
export type ResourceType = 
  | 'shipment' | 'invoice' | 'deposit' | 'contract' 
  | 'organization' | 'user' | 'driver' | 'report' 
  | 'certificate' | 'receipt' | 'file' | 'settings'
  | 'api_key' | 'ledger_entry' | 'period' | 'notification'
  | 'award_letter' | 'external_partner' | 'call_log' | 'custom';

/**
 * تفاصيل إضافية للنشاط
 */
export interface ActivityDetails {
  // التغييرات (قبل/بعد)
  previous_value?: any;
  new_value?: any;
  changed_fields?: string[];
  // معلومات إضافية
  description?: string;
  metadata?: Record<string, any>;
  // معلومات الحالة
  old_status?: string;
  new_status?: string;
  // معلومات الملفات
  file_name?: string;
  file_size?: number;
  file_type?: string;
  // معلومات الطباعة/التصدير
  export_format?: string;
  page_count?: number;
  // أي بيانات إضافية
  [key: string]: any;
}

/**
 * بيانات النشاط المطلوب تسجيله
 */
export interface ActivityLogData {
  action_type: ActionType;
  action: string;
  resource_type?: ResourceType;
  resource_id?: string;
  details?: ActivityDetails;
  organization_id?: string;
}

/**
 * دالة مساعدة للحصول على معلومات المتصفح والجهاز
 */
function getBrowserInfo(): { user_agent: string } {
  return {
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
  };
}

/**
 * Hook مركزي لتسجيل كل الأنشطة والتصرفات في المنصة
 * يتم استخدامه في كل مكان لضمان توثيق كامل لكل العمليات
 */
export function useActivityLogger() {
  const { user, organization } = useAuth();

  /**
   * تسجيل نشاط في قاعدة البيانات
   */
  const logActivity = useCallback(async (data: ActivityLogData): Promise<boolean> => {
    try {
      const browserInfo = getBrowserInfo();
      
      const { error } = await supabase.from('activity_logs').insert({
        user_id: user?.id || null,
        organization_id: data.organization_id || organization?.id || null,
        action: data.action,
        action_type: data.action_type,
        resource_type: data.resource_type || null,
        resource_id: data.resource_id || null,
        details: data.details || null,
        user_agent: browserInfo.user_agent,
        ip_address: null, // سيتم ملؤها من الخادم إذا لزم الأمر
      });

      if (error) {
        console.error('Error logging activity:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Failed to log activity:', err);
      return false;
    }
  }, [user?.id, organization?.id]);

  // === دوال مساعدة متخصصة ===

  /**
   * تسجيل تغيير حالة شحنة
   */
  const logShipmentStatusChange = useCallback(async (
    shipmentId: string,
    shipmentNumber: string,
    oldStatus: string,
    newStatus: string,
    notes?: string
  ) => {
    return logActivity({
      action_type: 'shipment_status_change',
      action: `تغيير حالة الشحنة ${shipmentNumber} من "${oldStatus}" إلى "${newStatus}"`,
      resource_type: 'shipment',
      resource_id: shipmentId,
      details: {
        old_status: oldStatus,
        new_status: newStatus,
        shipment_number: shipmentNumber,
        notes,
      },
    });
  }, [logActivity]);

  /**
   * تسجيل إنشاء شحنة
   */
  const logShipmentCreate = useCallback(async (
    shipmentId: string,
    shipmentNumber: string,
    wasteType: string,
    quantity: number
  ) => {
    return logActivity({
      action_type: 'shipment_create',
      action: `إنشاء شحنة جديدة ${shipmentNumber}`,
      resource_type: 'shipment',
      resource_id: shipmentId,
      details: {
        shipment_number: shipmentNumber,
        waste_type: wasteType,
        quantity,
      },
    });
  }, [logActivity]);

  /**
   * تسجيل عرض شحنة
   */
  const logShipmentView = useCallback(async (
    shipmentId: string,
    shipmentNumber: string
  ) => {
    return logActivity({
      action_type: 'shipment_view',
      action: `عرض تفاصيل الشحنة ${shipmentNumber}`,
      resource_type: 'shipment',
      resource_id: shipmentId,
      details: { shipment_number: shipmentNumber },
    });
  }, [logActivity]);

  /**
   * تسجيل طباعة مستند
   */
  const logDocumentPrint = useCallback(async (
    resourceType: ResourceType,
    resourceId: string,
    documentType: string,
    format: 'pdf' | 'print' = 'print'
  ) => {
    return logActivity({
      action_type: resourceType === 'shipment' ? 'shipment_print' : 
                   resourceType === 'invoice' ? 'invoice_print' : 'report_export',
      action: `طباعة/تصدير ${documentType}`,
      resource_type: resourceType,
      resource_id: resourceId,
      details: {
        document_type: documentType,
        export_format: format,
      },
    });
  }, [logActivity]);

  /**
   * تسجيل إنشاء فاتورة
   */
  const logInvoiceCreate = useCallback(async (
    invoiceId: string,
    invoiceNumber: string,
    totalAmount: number
  ) => {
    return logActivity({
      action_type: 'invoice_create',
      action: `إنشاء فاتورة ${invoiceNumber}`,
      resource_type: 'invoice',
      resource_id: invoiceId,
      details: {
        invoice_number: invoiceNumber,
        total_amount: totalAmount,
      },
    });
  }, [logActivity]);

  /**
   * تسجيل إنشاء إيداع
   */
  const logDepositCreate = useCallback(async (
    depositId: string,
    amount: number,
    partnerName?: string
  ) => {
    return logActivity({
      action_type: 'deposit_create',
      action: `إنشاء إيداع بمبلغ ${amount}`,
      resource_type: 'deposit',
      resource_id: depositId,
      details: {
        amount,
        partner_name: partnerName,
      },
    });
  }, [logActivity]);

  /**
   * تسجيل تسجيل دخول
   */
  const logLogin = useCallback(async (userId: string, email: string) => {
    return logActivity({
      action_type: 'auth_login',
      action: `تسجيل دخول: ${email}`,
      resource_type: 'user',
      resource_id: userId,
      details: { email },
    });
  }, [logActivity]);

  /**
   * تسجيل تسجيل خروج
   */
  const logLogout = useCallback(async () => {
    return logActivity({
      action_type: 'auth_logout',
      action: 'تسجيل خروج',
      resource_type: 'user',
      resource_id: user?.id,
    });
  }, [logActivity, user?.id]);

  /**
   * تسجيل تغيير إعدادات
   */
  const logSettingsChange = useCallback(async (
    settingName: string,
    oldValue: any,
    newValue: any
  ) => {
    return logActivity({
      action_type: 'settings_change',
      action: `تغيير إعداد: ${settingName}`,
      resource_type: 'settings',
      details: {
        setting_name: settingName,
        previous_value: oldValue,
        new_value: newValue,
      },
    });
  }, [logActivity]);

  /**
   * تسجيل رفع ملف
   */
  const logFileUpload = useCallback(async (
    fileName: string,
    fileSize: number,
    fileType: string,
    context?: string
  ) => {
    return logActivity({
      action_type: 'file_upload',
      action: `رفع ملف: ${fileName}`,
      resource_type: 'file',
      details: {
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        context,
      },
    });
  }, [logActivity]);

  /**
   * تسجيل إسناد سائق
   */
  const logDriverAssign = useCallback(async (
    shipmentId: string,
    shipmentNumber: string,
    driverId: string,
    driverName: string
  ) => {
    return logActivity({
      action_type: 'driver_assign',
      action: `إسناد السائق ${driverName} للشحنة ${shipmentNumber}`,
      resource_type: 'shipment',
      resource_id: shipmentId,
      details: {
        shipment_number: shipmentNumber,
        driver_id: driverId,
        driver_name: driverName,
      },
    });
  }, [logActivity]);

  /**
   * تسجيل إصدار شهادة
   */
  const logCertificateGenerate = useCallback(async (
    resourceType: 'shipment' | 'receipt' | 'certificate',
    resourceId: string,
    certificateType: string,
    referenceNumber: string
  ) => {
    return logActivity({
      action_type: 'certificate_generate',
      action: `إصدار ${certificateType}: ${referenceNumber}`,
      resource_type: resourceType,
      resource_id: resourceId,
      details: {
        certificate_type: certificateType,
        reference_number: referenceNumber,
      },
    });
  }, [logActivity]);

  /**
   * تسجيل مسح QR
   */
  const logQRScan = useCallback(async (
    documentType: string,
    referenceNumber: string,
    verified: boolean
  ) => {
    return logActivity({
      action_type: 'qr_scan',
      action: `مسح رمز QR: ${referenceNumber}`,
      resource_type: 'custom',
      details: {
        document_type: documentType,
        reference_number: referenceNumber,
        verified,
      },
    });
  }, [logActivity]);

  /**
   * تسجيل نشاط مخصص
   */
  const logCustomActivity = useCallback(async (
    action: string,
    resourceType?: ResourceType,
    resourceId?: string,
    details?: ActivityDetails
  ) => {
    return logActivity({
      action_type: 'custom',
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details,
    });
  }, [logActivity]);

  return {
    // الدالة الرئيسية
    logActivity,
    // دوال متخصصة
    logShipmentStatusChange,
    logShipmentCreate,
    logShipmentView,
    logDocumentPrint,
    logInvoiceCreate,
    logDepositCreate,
    logLogin,
    logLogout,
    logSettingsChange,
    logFileUpload,
    logDriverAssign,
    logCertificateGenerate,
    logQRScan,
    logCustomActivity,
  };
}

/**
 * دالة مستقلة للتسجيل بدون hook (للاستخدام خارج React components)
 */
export async function logActivityDirect(
  userId: string | null,
  organizationId: string | null,
  data: Omit<ActivityLogData, 'organization_id'>
): Promise<boolean> {
  try {
    const { error } = await supabase.from('activity_logs').insert({
      user_id: userId,
      organization_id: organizationId,
      action: data.action,
      action_type: data.action_type,
      resource_type: data.resource_type || null,
      resource_id: data.resource_id || null,
      details: data.details || null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      ip_address: null,
    });

    if (error) {
      console.error('Error logging activity directly:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Failed to log activity directly:', err);
    return false;
  }
}
