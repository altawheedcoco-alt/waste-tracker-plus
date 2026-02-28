import { useMemo } from 'react';

/**
 * Maps organization types to their specific document types,
 * consultant capabilities, and data access defaults.
 */

export interface OrgTypeConfig {
  label: string;
  documents: { type: string; label: string; consultantAction: string }[];
  defaultPermissions: string[];
  restrictedData: string[];
  serviceTypes: { value: string; label: string }[];
}

const orgTypeConfigs: Record<string, OrgTypeConfig> = {
  generator: {
    label: 'مولد مخلفات',
    documents: [
      { type: 'eia_report', label: 'تقييم الأثر البيئي (EIA)', consultantAction: 'إصدار' },
      { type: 'waste_manifest', label: 'مانيفست النفايات', consultantAction: 'اعتماد' },
      { type: 'waste_register', label: 'سجل المخلفات', consultantAction: 'مراجعة' },
      { type: 'classification_report', label: 'تقرير توصيف النفايات', consultantAction: 'إصدار' },
      { type: 'emergency_plan', label: 'خطة الطوارئ البيئية', consultantAction: 'إصدار' },
      { type: 'compliance_certificate', label: 'شهادة الامتثال البيئي', consultantAction: 'إصدار' },
    ],
    defaultPermissions: ['view_shipments', 'view_waste_records', 'view_documents', 'view_compliance'],
    restrictedData: ['financials', 'contracts', 'partner_details'],
    serviceTypes: [
      { value: 'environmental_oversight', label: 'إشراف بيئي شامل' },
      { value: 'eia', label: 'تقييم أثر بيئي' },
      { value: 'waste_management', label: 'إدارة مخلفات' },
      { value: 'licensing', label: 'تراخيص بيئية' },
      { value: 'compliance_audit', label: 'تدقيق امتثال' },
    ],
  },
  transporter: {
    label: 'ناقل',
    documents: [
      { type: 'transport_license_review', label: 'مراجعة ترخيص النقل', consultantAction: 'تدقيق' },
      { type: 'vehicle_inspection', label: 'فحص المركبات', consultantAction: 'تدقيق' },
      { type: 'safety_certificate', label: 'شهادة سلامة النقل', consultantAction: 'إصدار' },
      { type: 'route_compliance', label: 'امتثال مسارات النقل', consultantAction: 'مراجعة' },
      { type: 'driver_certification', label: 'شهادة تأهيل السائقين', consultantAction: 'اعتماد' },
    ],
    defaultPermissions: ['view_vehicles', 'view_drivers', 'view_shipments', 'view_documents'],
    restrictedData: ['financials', 'partner_pricing', 'contracts'],
    serviceTypes: [
      { value: 'transport_audit', label: 'تدقيق نقل' },
      { value: 'vehicle_inspection', label: 'فحص مركبات' },
      { value: 'safety_compliance', label: 'امتثال السلامة' },
      { value: 'licensing', label: 'تراخيص نقل' },
    ],
  },
  recycler: {
    label: 'مدوّر',
    documents: [
      { type: 'operation_report', label: 'تقرير التشغيل البيئي', consultantAction: 'تدقيق' },
      { type: 'environmental_compliance', label: 'امتثال بيئي تشغيلي', consultantAction: 'تدقيق' },
      { type: 'process_approval', label: 'اعتماد عمليات إعادة التدوير', consultantAction: 'اعتماد' },
      { type: 'emission_report', label: 'تقرير الانبعاثات', consultantAction: 'إصدار' },
      { type: 'recycling_certificate', label: 'شهادة إعادة التدوير', consultantAction: 'إصدار' },
    ],
    defaultPermissions: ['view_shipments', 'view_waste_records', 'view_documents', 'view_compliance'],
    restrictedData: ['financials', 'trade_secrets', 'partner_details'],
    serviceTypes: [
      { value: 'environmental_oversight', label: 'إشراف بيئي' },
      { value: 'process_audit', label: 'تدقيق عمليات' },
      { value: 'emission_monitoring', label: 'رصد انبعاثات' },
      { value: 'compliance_audit', label: 'تدقيق امتثال' },
    ],
  },
  disposal: {
    label: 'تخلص نهائي',
    documents: [
      { type: 'disposal_certificate', label: 'شهادة التخلص الآمن', consultantAction: 'إصدار' },
      { type: 'environmental_monitoring', label: 'رصد بيئي دوري', consultantAction: 'إصدار' },
      { type: 'leachate_report', label: 'تقرير الرشيح', consultantAction: 'إصدار' },
      { type: 'closure_plan', label: 'خطة إغلاق الموقع', consultantAction: 'إصدار' },
      { type: 'groundwater_report', label: 'تقرير المياه الجوفية', consultantAction: 'إصدار' },
    ],
    defaultPermissions: ['view_shipments', 'view_waste_records', 'view_documents', 'view_compliance', 'view_incidents'],
    restrictedData: ['financials', 'contracts'],
    serviceTypes: [
      { value: 'environmental_monitoring', label: 'رصد بيئي' },
      { value: 'disposal_certification', label: 'شهادات تخلص' },
      { value: 'compliance_audit', label: 'تدقيق امتثال' },
      { value: 'site_management', label: 'إدارة موقع' },
    ],
  },
  transport_office: {
    label: 'مكتب نقل',
    documents: [
      { type: 'fleet_assessment', label: 'تقييم الأسطول', consultantAction: 'اعتماد' },
      { type: 'technical_compliance', label: 'مطابقة فنية', consultantAction: 'اعتماد' },
      { type: 'office_license_review', label: 'مراجعة ترخيص المكتب', consultantAction: 'تدقيق' },
    ],
    defaultPermissions: ['view_vehicles', 'view_drivers', 'view_shipments', 'view_documents'],
    restrictedData: ['financials', 'partner_pricing', 'contracts'],
    serviceTypes: [
      { value: 'technical_compliance', label: 'اعتماد فني' },
      { value: 'fleet_audit', label: 'تدقيق أسطول' },
    ],
  },
};

export const useClientPrivacy = () => {
  const getOrgTypeConfig = (orgType: string): OrgTypeConfig => {
    return orgTypeConfigs[orgType] || orgTypeConfigs.generator;
  };

  const getAllOrgTypes = () => Object.entries(orgTypeConfigs).map(([key, config]) => ({
    value: key,
    label: config.label,
  }));

  const getDocumentsForOrgType = (orgType: string) => {
    return getOrgTypeConfig(orgType).documents;
  };

  const getServiceTypesForOrgType = (orgType: string) => {
    return getOrgTypeConfig(orgType).serviceTypes;
  };

  const getDefaultPermissions = (orgType: string) => {
    return getOrgTypeConfig(orgType).defaultPermissions;
  };

  const getRestrictedData = (orgType: string) => {
    return getOrgTypeConfig(orgType).restrictedData;
  };

  // Check if a specific data type is restricted for a given org type
  const isDataRestricted = (orgType: string, dataType: string) => {
    return getOrgTypeConfig(orgType).restrictedData.includes(dataType);
  };

  // Build data_access_scope JSON for a client assignment
  const buildDataAccessScope = (orgType: string, customPermissions?: string[]) => {
    const defaults = getDefaultPermissions(orgType);
    const permissions = customPermissions || defaults;
    const restricted = getRestrictedData(orgType);

    return {
      allowed: permissions,
      restricted,
      org_type: orgType,
    };
  };

  // Build signing_authority JSON for a client assignment
  const buildSigningAuthority = (orgType: string, documentTypes?: string[]) => {
    const docs = getDocumentsForOrgType(orgType);
    const allowedDocs = documentTypes || docs.map(d => d.type);

    return {
      allowed_document_types: allowedDocs,
      org_type: orgType,
    };
  };

  return {
    getOrgTypeConfig,
    getAllOrgTypes,
    getDocumentsForOrgType,
    getServiceTypesForOrgType,
    getDefaultPermissions,
    getRestrictedData,
    isDataRestricted,
    buildDataAccessScope,
    buildSigningAuthority,
  };
};
