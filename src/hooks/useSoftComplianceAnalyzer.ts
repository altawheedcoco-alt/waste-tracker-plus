/**
 * useSoftComplianceAnalyzer — Non-binding standards comparison
 * Analyzes org compliance state against Egyptian environmental standards
 * Returns advisory report — NEVER blocks any operation
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { differenceInDays, parseISO } from 'date-fns';

export type ComplianceLevel = 'excellent' | 'good' | 'acceptable' | 'needs_improvement' | 'poor';
export type StandardCategory = 'licensing' | 'environmental' | 'operational' | 'safety' | 'documentation' | 'partnerships';

interface StandardCheck {
  id: string;
  category: StandardCategory;
  label: string;
  description: string;
  status: 'met' | 'partial' | 'not_met' | 'not_applicable';
  score: number; // 0-100
  recommendation?: string;
  details?: string;
}

export interface SoftComplianceReport {
  overallLevel: ComplianceLevel;
  overallScore: number; // 0-100
  categories: Record<StandardCategory, { score: number; checks: StandardCheck[] }>;
  summary: string;
  generatedAt: Date;
  orgName: string;
  orgType: string;
  recommendations: string[];
  strengths: string[];
}

const CATEGORY_LABELS: Record<StandardCategory, string> = {
  licensing: 'التراخيص والتصاريح',
  environmental: 'المعايير البيئية',
  operational: 'الكفاءة التشغيلية',
  safety: 'السلامة المهنية',
  documentation: 'التوثيق والسجلات',
  partnerships: 'الشراكات والتعاقدات',
};

function getLevel(score: number): ComplianceLevel {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'acceptable';
  if (score >= 40) return 'needs_improvement';
  return 'poor';
}

export { CATEGORY_LABELS };

export function useSoftComplianceAnalyzer() {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const orgType = organization?.organization_type;

  return useQuery<SoftComplianceReport>({
    queryKey: ['soft-compliance', orgId],
    queryFn: async () => {
      if (!orgId || !orgType) throw new Error('No org');

      // Fetch org data
      const { data: org } = await (supabase as any)
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();

      if (!org) throw new Error('Org not found');

      // Fetch related data in parallel
      const [shipmentsRes, partnershipsRes, membersRes, docsRes] = await Promise.all([
        (supabase as any).from('shipments').select('id, status, created_at', { count: 'exact', head: false })
          .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId}`)
          .limit(500),
        (supabase as any).from('verified_partnerships').select('id, status')
          .or(`requester_org_id.eq.${orgId},partner_org_id.eq.${orgId}`)
          .eq('status', 'active'),
        (supabase as any).from('organization_members').select('id, role')
          .eq('organization_id', orgId),
        (supabase as any).from('organization_documents').select('id, document_type, status, expiry_date')
          .eq('organization_id', orgId),
      ]);

      const shipments = shipmentsRes.data || [];
      const partnerships = partnershipsRes.data || [];
      const members = membersRes.data || [];
      const docs = docsRes.data || [];

      const checks: StandardCheck[] = [];
      const recommendations: string[] = [];
      const strengths: string[] = [];

      // ═══ LICENSING CHECKS ═══
      const licenseFields = [
        { field: 'license_number', expiry: 'license_expiry_date', label: 'السجل التجاري' },
        { field: 'wmra_license', expiry: 'wmra_license_expiry_date', label: 'ترخيص WMRA' },
        { field: 'environmental_license', expiry: 'eeaa_license_expiry_date', label: 'ترخيص جهاز البيئة' },
      ];

      let licensingScore = 0;
      let licensingTotal = 0;

      for (const lf of licenseFields) {
        licensingTotal++;
        const hasNumber = !!org[lf.field];
        const expiryDate = org[lf.expiry] as string | null;
        const isValid = expiryDate ? differenceInDays(parseISO(expiryDate), new Date()) > 0 : false;

        if (hasNumber && isValid) {
          licensingScore++;
          checks.push({ id: `lic-${lf.field}`, category: 'licensing', label: lf.label, description: 'مسجل وساري', status: 'met', score: 100 });
        } else if (hasNumber && !isValid) {
          checks.push({ id: `lic-${lf.field}`, category: 'licensing', label: lf.label, description: 'مسجل ولكن منتهي أو قارب على الانتهاء', status: 'partial', score: 40, recommendation: `يُنصح بتجديد ${lf.label} في أقرب وقت` });
          licensingScore += 0.4;
          recommendations.push(`تجديد ${lf.label}`);
        } else {
          checks.push({ id: `lic-${lf.field}`, category: 'licensing', label: lf.label, description: 'غير مسجل', status: 'not_met', score: 0, recommendation: `يُنصح بتسجيل ${lf.label}` });
          recommendations.push(`تسجيل ${lf.label}`);
        }
      }

      // ═══ ENVIRONMENTAL CHECKS ═══
      const hasEnvRegister = !!org.environmental_register_number;
      const hasHazRegister = !!org.hazardous_materials_register_number;
      const hasEIA = !!org.eia_certificate_number;

      checks.push({
        id: 'env-register', category: 'environmental', label: 'السجل البيئي',
        description: hasEnvRegister ? 'مسجل' : 'غير مسجل',
        status: hasEnvRegister ? 'met' : 'not_met', score: hasEnvRegister ? 100 : 0,
        recommendation: hasEnvRegister ? undefined : 'يُنصح بتسجيل السجل البيئي لدى الجهة المختصة',
      });

      checks.push({
        id: 'env-hazard', category: 'environmental', label: 'سجل المواد الخطرة',
        description: hasHazRegister ? 'مسجل' : 'غير مسجل — قد لا ينطبق على جميع الجهات',
        status: hasHazRegister ? 'met' : 'not_applicable', score: hasHazRegister ? 100 : 50,
      });

      if (orgType === 'disposal') {
        checks.push({
          id: 'env-eia', category: 'environmental', label: 'تقييم الأثر البيئي (EIA)',
          description: hasEIA ? 'مقدم ومعتمد' : 'غير مقدم',
          status: hasEIA ? 'met' : 'not_met', score: hasEIA ? 100 : 0,
          recommendation: hasEIA ? undefined : 'يُنصح بشدة بتقديم تقييم الأثر البيئي — معيار أساسي لجهات التخلص',
        });
      }

      // ═══ OPERATIONAL CHECKS ═══
      const completedShipments = shipments.filter((s: any) => s.status === 'confirmed').length;
      const totalShipments = shipments.length;
      const completionRate = totalShipments > 0 ? (completedShipments / totalShipments) * 100 : 0;

      checks.push({
        id: 'ops-completion', category: 'operational', label: 'معدل إتمام الشحنات',
        description: `${completionRate.toFixed(0)}% (${completedShipments} من ${totalShipments})`,
        status: completionRate >= 80 ? 'met' : completionRate >= 50 ? 'partial' : totalShipments === 0 ? 'not_applicable' : 'not_met',
        score: Math.min(completionRate, 100),
        recommendation: completionRate < 80 && totalShipments > 0 ? 'يُنصح بتحسين معدل إتمام الشحنات' : undefined,
      });

      if (completionRate >= 90) strengths.push('معدل إتمام شحنات ممتاز');

      checks.push({
        id: 'ops-volume', category: 'operational', label: 'حجم العمليات',
        description: `${totalShipments} شحنة مسجلة`,
        status: totalShipments >= 10 ? 'met' : totalShipments >= 1 ? 'partial' : 'not_met',
        score: Math.min(totalShipments * 10, 100),
      });

      // ═══ SAFETY CHECKS ═══
      const hasCivilDefense = !!org.civil_defense_approval_number;
      const hasOccSafety = !!org.occupational_safety_approval_number;

      checks.push({
        id: 'safety-civil', category: 'safety', label: 'موافقة الحماية المدنية',
        description: hasCivilDefense ? 'حاصل عليها' : 'غير متوفرة',
        status: hasCivilDefense ? 'met' : 'not_met', score: hasCivilDefense ? 100 : 0,
        recommendation: hasCivilDefense ? undefined : 'يُنصح بالحصول على موافقة الحماية المدنية لضمان السلامة',
      });

      checks.push({
        id: 'safety-occ', category: 'safety', label: 'السلامة والصحة المهنية',
        description: hasOccSafety ? 'معتمد' : 'غير متوفر',
        status: hasOccSafety ? 'met' : 'not_met', score: hasOccSafety ? 100 : 0,
        recommendation: hasOccSafety ? undefined : 'يُنصح بالحصول على شهادة السلامة والصحة المهنية',
      });

      if (hasCivilDefense && hasOccSafety) strengths.push('منظومة سلامة متكاملة');

      // ═══ DOCUMENTATION CHECKS ═══
      const hasLogo = !!org.logo_url;
      const hasStamp = !!org.stamp_url;
      const hasSignature = !!org.signature_url;
      const docsCount = docs.length;

      checks.push({
        id: 'doc-identity', category: 'documentation', label: 'الهوية البصرية',
        description: [hasLogo && 'شعار', hasStamp && 'ختم', hasSignature && 'توقيع'].filter(Boolean).join(' + ') || 'غير مكتملة',
        status: hasLogo && hasStamp && hasSignature ? 'met' : hasLogo || hasStamp ? 'partial' : 'not_met',
        score: ((hasLogo ? 1 : 0) + (hasStamp ? 1 : 0) + (hasSignature ? 1 : 0)) / 3 * 100,
        recommendation: !(hasLogo && hasStamp && hasSignature) ? 'يُنصح برفع الشعار والختم والتوقيع لتعزيز المصداقية' : undefined,
      });

      checks.push({
        id: 'doc-files', category: 'documentation', label: 'المستندات المرفوعة',
        description: `${docsCount} مستند`,
        status: docsCount >= 5 ? 'met' : docsCount >= 1 ? 'partial' : 'not_met',
        score: Math.min(docsCount * 20, 100),
      });

      // ═══ PARTNERSHIPS CHECKS ═══
      const activePartners = partnerships.length;

      checks.push({
        id: 'part-active', category: 'partnerships', label: 'الشراكات النشطة',
        description: `${activePartners} شراكة موثقة`,
        status: activePartners >= 3 ? 'met' : activePartners >= 1 ? 'partial' : 'not_met',
        score: Math.min(activePartners * 33, 100),
        recommendation: activePartners < 3 ? 'يُنصح بتوسيع شبكة الشراكات لتحسين التغطية' : undefined,
      });

      checks.push({
        id: 'part-team', category: 'partnerships', label: 'فريق العمل',
        description: `${members.length} عضو`,
        status: members.length >= 3 ? 'met' : members.length >= 1 ? 'partial' : 'not_met',
        score: Math.min(members.length * 33, 100),
      });

      if (activePartners >= 5) strengths.push('شبكة شراكات واسعة ونشطة');

      // ═══ BUILD REPORT ═══
      const categories: Record<StandardCategory, { score: number; checks: StandardCheck[] }> = {} as any;
      const allCategories: StandardCategory[] = ['licensing', 'environmental', 'operational', 'safety', 'documentation', 'partnerships'];

      for (const cat of allCategories) {
        const catChecks = checks.filter(c => c.category === cat);
        const catScore = catChecks.length > 0 ? catChecks.reduce((sum, c) => sum + c.score, 0) / catChecks.length : 0;
        categories[cat] = { score: Math.round(catScore), checks: catChecks };
      }

      const overallScore = Math.round(Object.values(categories).reduce((sum, c) => sum + c.score, 0) / allCategories.length);
      const overallLevel = getLevel(overallScore);

      const levelLabels: Record<ComplianceLevel, string> = {
        excellent: 'ممتاز', good: 'جيد', acceptable: 'مقبول', needs_improvement: 'يحتاج تحسين', poor: 'ضعيف',
      };

      return {
        overallLevel,
        overallScore,
        categories,
        summary: `تقييم الامتثال العام لجهة "${org.name}": ${levelLabels[overallLevel]} (${overallScore}%)`,
        generatedAt: new Date(),
        orgName: org.name,
        orgType: orgType || 'unknown',
        recommendations: recommendations.filter((r, i, a) => a.indexOf(r) === i),
        strengths,
      };
    },
    enabled: !!orgId,
    staleTime: 10 * 60 * 1000,
  });
}
