import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { differenceInDays } from 'date-fns';

export interface ComplianceAxisScore {
  axis: string;
  label: string;
  score: number;
  weight: number;
  weightedScore: number;
  details: string[];
}

export interface ComplianceAssessment {
  overallScore: number;
  level: 'gold' | 'silver' | 'bronze' | 'not_eligible';
  axes: ComplianceAxisScore[];
  eligible: boolean;
  gapItems: string[];
}

export interface ComplianceCertificate {
  id: string;
  organization_id: string;
  certificate_number: string;
  certificate_level: string;
  overall_score: number;
  licenses_score: number;
  training_score: number;
  operations_score: number;
  documentation_score: number;
  safety_environment_score: number;
  score_details: any;
  issued_at: string;
  expires_at: string;
  is_valid: boolean;
  verification_code: string;
  iso_standards: string[];
}

const getLevel = (score: number): 'gold' | 'silver' | 'bronze' | 'not_eligible' => {
  if (score >= 90) return 'gold';
  if (score >= 80) return 'silver';
  if (score >= 70) return 'bronze';
  return 'not_eligible';
};

export const useComplianceAssessment = () => {
  const { organization, user } = useAuth();
  const orgId = organization?.id;

  return useQuery({
    queryKey: ['compliance-assessment', orgId],
    queryFn: async (): Promise<ComplianceAssessment> => {
      if (!orgId) throw new Error('No organization');

      const axes: ComplianceAxisScore[] = [];
      const gapItems: string[] = [];

      // ═══ 1. التراخيص (25%) ═══
      const { data: licenses } = await supabase
        .from('legal_licenses')
        .select('*')
        .eq('organization_id', orgId);

      const allLicenses = licenses || [];
      let licenseScore = 0;
      const licenseDetails: string[] = [];

      if (allLicenses.length === 0) {
        licenseScore = 0;
        licenseDetails.push('لا توجد تراخيص مسجلة');
        gapItems.push('يجب إضافة التراخيص الأساسية (WMRA, EEAA, السجل التجاري)');
      } else {
        const now = new Date();
        let active = 0, expiring = 0, expired = 0;
        allLicenses.forEach((l: any) => {
          if (!l.expiry_date) { active++; return; }
          const days = differenceInDays(new Date(l.expiry_date), now);
          if (days < 0) { expired++; gapItems.push(`ترخيص منتهي: ${l.license_name}`); }
          else if (days <= 30) { expiring++; }
          else { active++; }
        });
        licenseScore = Math.round((active / allLicenses.length) * 100);
        if (expiring > 0) licenseScore = Math.min(licenseScore, 85);
        licenseDetails.push(`${active} سارية، ${expiring} تنتهي قريباً، ${expired} منتهية من أصل ${allLicenses.length}`);
      }

      axes.push({ axis: 'licenses', label: 'التراخيص السارية', score: licenseScore, weight: 25, weightedScore: (licenseScore * 25) / 100, details: licenseDetails });

      // ═══ 2. التدريب (20%) ═══
      const { data: orgMembers } = await supabase
        .from('profiles')
        .select('id')
        .eq('organization_id', orgId);

      const memberIds = (orgMembers || []).map((m: any) => m.id);
      let trainingScore = 0;
      const trainingDetails: string[] = [];

      if (memberIds.length === 0) {
        trainingScore = 50; // baseline
        trainingDetails.push('لا يوجد أعضاء مسجلون');
      } else {
        const { data: certs } = await supabase
          .from('lms_certificates')
          .select('user_id, is_valid')
          .in('user_id', memberIds.slice(0, 100));

        const certifiedUsers = new Set((certs || []).filter((c: any) => c.is_valid).map((c: any) => c.user_id));
        const certRate = certifiedUsers.size / memberIds.length;
        trainingScore = Math.round(Math.min(certRate * 100 * 1.5, 100)); // boost factor
        trainingDetails.push(`${certifiedUsers.size} من ${memberIds.length} أعضاء حاصلين على شهادات تدريبية`);
        if (certRate < 0.5) gapItems.push('أقل من 50% من الأعضاء حاصلون على شهادات تدريبية');
      }

      axes.push({ axis: 'training', label: 'التدريب والتأهيل', score: trainingScore, weight: 20, weightedScore: (trainingScore * 20) / 100, details: trainingDetails });

      // ═══ 3. السجل التشغيلي (20%) ═══
      const { data: shipments } = await supabase
        .from('shipments')
        .select('id, status, compliance_score')
        .eq('generator_id', orgId)
        .order('created_at', { ascending: false })
        .limit(50);

      let opsScore = 0;
      const opsDetails: string[] = [];

      if (!shipments || shipments.length === 0) {
        opsScore = 50;
        opsDetails.push('لا توجد شحنات مسجلة بعد');
      } else {
        const completed = shipments.filter((s: any) => s.status === 'delivered' || s.status === 'completed');
        const avgCompliance = shipments.reduce((sum: number, s: any) => sum + (s.compliance_score || 70), 0) / shipments.length;
        opsScore = Math.round(Math.min(avgCompliance, 100));
        opsDetails.push(`${completed.length} شحنة مكتملة من ${shipments.length}، متوسط الامتثال: ${Math.round(avgCompliance)}%`);
        if (avgCompliance < 70) gapItems.push('متوسط درجة امتثال الشحنات أقل من 70%');
      }

      axes.push({ axis: 'operations', label: 'السجل التشغيلي', score: opsScore, weight: 20, weightedScore: (opsScore * 20) / 100, details: opsDetails });

      // ═══ 4. التوثيق الرقمي (15%) ═══
      const { data: docs } = await supabase
        .from('organization_documents')
        .select('id, verification_status')
        .eq('organization_id', orgId);

      let docScore = 0;
      const docDetails: string[] = [];

      if (!docs || docs.length === 0) {
        docScore = 30;
        docDetails.push('لا توجد مستندات مرفوعة');
        gapItems.push('يجب رفع المستندات الأساسية للمنشأة');
      } else {
        const verified = docs.filter((d: any) => d.verification_status === 'verified').length;
        docScore = Math.round((verified / docs.length) * 100);
        docDetails.push(`${verified} مستند موثق من ${docs.length}`);
        if (docScore < 50) gapItems.push('أقل من 50% من المستندات موثقة');
      }

      axes.push({ axis: 'documentation', label: 'التوثيق الرقمي', score: docScore, weight: 15, weightedScore: (docScore * 15) / 100, details: docDetails });

      // ═══ 5. السلامة والبيئة (20%) ═══
      const { data: reports } = await supabase
        .from('recycling_reports')
        .select('id, shipment_id')
        .limit(50);

      // Cross-check with org shipments
      const orgShipmentIds = (shipments || []).map((s: any) => s.id);
      const orgReports = (reports || []).filter((r: any) => orgShipmentIds.includes(r.shipment_id));

      let safetyScore = 0;
      const safetyDetails: string[] = [];

      const hasReports = orgReports.length > 0;
      const hasLicenses = allLicenses.length > 0;
      const hasDocs = (docs || []).length > 0;

      let safetyFactors = 0;
      if (hasReports) safetyFactors += 40;
      if (hasLicenses) safetyFactors += 30;
      if (hasDocs) safetyFactors += 30;
      safetyScore = safetyFactors;
      safetyDetails.push(`تقارير بيئية: ${hasReports ? '✓' : '✗'} | تراخيص: ${hasLicenses ? '✓' : '✗'} | مستندات سلامة: ${hasDocs ? '✓' : '✗'}`);
      if (!hasReports) gapItems.push('لا توجد تقارير بيئية/تدوير');

      axes.push({ axis: 'safety_environment', label: 'السلامة والبيئة', score: safetyScore, weight: 20, weightedScore: (safetyScore * 20) / 100, details: safetyDetails });

      // ═══ Overall ═══
      const overallScore = Math.round(axes.reduce((sum, a) => sum + a.weightedScore, 0));
      const level = getLevel(overallScore);

      return {
        overallScore,
        level,
        axes,
        eligible: level !== 'not_eligible',
        gapItems,
      };
    },
    enabled: !!orgId,
    staleTime: 300000, // 5 minutes
  });
};

export const useComplianceCertificates = () => {
  const { organization } = useAuth();
  const orgId = organization?.id;

  return useQuery({
    queryKey: ['compliance-certificates', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await (supabase
        .from('compliance_certificates') as any)
        .select('*')
        .eq('organization_id', orgId)
        .order('issued_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ComplianceCertificate[];
    },
    enabled: !!orgId,
  });
};

export const useIssueCertificate = () => {
  const { organization, user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assessment: ComplianceAssessment) => {
      if (!organization?.id || !user?.id) throw new Error('Not authenticated');
      if (!assessment.eligible) throw new Error('Not eligible');

      // Generate cert number
      const { data: certNum } = await supabase.rpc('generate_compliance_cert_number');
      const verificationCode = `VRF-IRC-${Date.now().toString(36).toUpperCase()}`;

      const { data, error } = await (supabase
        .from('compliance_certificates') as any)
        .insert({
          organization_id: organization.id,
          certificate_number: certNum || `IRC-${Date.now()}`,
          certificate_level: assessment.level,
          overall_score: assessment.overallScore,
          licenses_score: assessment.axes.find(a => a.axis === 'licenses')?.score || 0,
          training_score: assessment.axes.find(a => a.axis === 'training')?.score || 0,
          operations_score: assessment.axes.find(a => a.axis === 'operations')?.score || 0,
          documentation_score: assessment.axes.find(a => a.axis === 'documentation')?.score || 0,
          safety_environment_score: assessment.axes.find(a => a.axis === 'safety_environment')?.score || 0,
          score_details: { axes: assessment.axes, gapItems: assessment.gapItems },
          issued_by: user.id,
          verification_code: verificationCode,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-certificates'] });
      toast.success('تم إصدار شهادة الامتثال بنجاح! 🏅');
    },
    onError: (err: any) => {
      toast.error(`فشل إصدار الشهادة: ${err.message}`);
    },
  });
};

export const useVerifyCertificate = (code: string) => {
  return useQuery({
    queryKey: ['verify-certificate', code],
    queryFn: async () => {
      if (!code) return null;
      const { data, error } = await (supabase
        .from('compliance_certificates') as any)
        .select('*, organizations(name, name_en, organization_type)')
        .eq('verification_code', code)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!code,
  });
};
