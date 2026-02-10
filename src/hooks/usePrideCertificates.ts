import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface PrideCertificate {
  id: string;
  organization_id: string;
  organization_type: string;
  certificate_number: string;
  milestone_tons: number;
  total_quantity_kg: number;
  certificate_type: string;
  title: string;
  title_ar: string;
  description: string | null;
  description_ar: string | null;
  issued_at: string;
  created_at: string;
  is_printed: boolean;
  printed_at: string | null;
}

const FIRST_MILESTONE_TONS = 300;
const MILESTONE_STEP_TONS = 100;

const getOrgTypeLabel = (type: string): { en: string; ar: string; action: string } => {
  switch (type) {
    case 'generator': return { en: 'Waste Generator', ar: 'جهة مولدة للمخلفات', action: 'توليد' };
    case 'transporter': return { en: 'Waste Transporter', ar: 'جهة ناقلة للمخلفات', action: 'نقل' };
    case 'recycler': return { en: 'Waste Recycler', ar: 'جهة تدوير المخلفات', action: 'تدوير' };
    case 'disposal': return { en: 'Disposal Facility', ar: 'جهة تخلص نهائي', action: 'التخلص النهائي من' };
    default: return { en: 'Organization', ar: 'منظمة', action: 'معالجة' };
  }
};

const generateCertNumber = (orgType: string, milestone: number): string => {
  const prefix = orgType.substring(0, 3).toUpperCase();
  const date = new Date();
  const yymm = `${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  return `PRC-${prefix}-${yymm}-${milestone}T`;
};

const getMilestones = (totalTons: number): number[] => {
  const milestones: number[] = [];
  if (totalTons >= FIRST_MILESTONE_TONS) {
    milestones.push(FIRST_MILESTONE_TONS);
    let next = FIRST_MILESTONE_TONS + MILESTONE_STEP_TONS;
    while (next <= totalTons) {
      milestones.push(next);
      next += MILESTONE_STEP_TONS;
    }
  }
  return milestones;
};

export const usePrideCertificates = () => {
  const { organization, roles } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = roles.includes('admin');
  const orgId = organization?.id;
  const orgType = organization?.organization_type as string;

  // Fetch existing certificates
  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ['pride-certificates', orgId, isAdmin],
    queryFn: async () => {
      let query = supabase
        .from('pride_certificates')
        .select('*')
        .order('milestone_tons', { ascending: true });

      if (!isAdmin && orgId) {
        query = query.eq('organization_id', orgId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as PrideCertificate[];
    },
    enabled: !!orgId || isAdmin,
  });

  // Fetch total quantity for this org
  const { data: totalQuantity = 0 } = useQuery({
    queryKey: ['org-total-quantity', orgId, orgType],
    queryFn: async () => {
      if (!orgId || !orgType) return 0;

      let query = supabase.from('shipments').select('quantity');

      // Filter based on org type
      switch (orgType) {
        case 'generator':
          query = query.eq('generator_id', orgId);
          break;
        case 'transporter':
          query = query.eq('transporter_id', orgId);
          break;
        case 'recycler':
          query = query.eq('recycler_id', orgId);
          break;
        case 'disposal':
          query = query.eq('disposal_facility_id', orgId);
          break;
      }

      // Only count confirmed/completed shipments
      query = query.in('status', ['confirmed', 'delivered', 'in_transit']);

      const { data, error } = await query;
      if (error) throw error;

      const total = (data || []).reduce((sum, s) => sum + (s.quantity || 0), 0);
      return total; // in kg
    },
    enabled: !!orgId && !!orgType,
  });

  // Check and auto-issue certificates
  const checkAndIssueCertificates = useCallback(async () => {
    if (!orgId || !orgType || totalQuantity === 0) return;

    const totalTons = totalQuantity / 1000;
    const milestones = getMilestones(totalTons);

    if (milestones.length === 0) return;

    // Get existing milestone values
    const existingMilestones = certificates
      .filter(c => c.organization_id === orgId)
      .map(c => Number(c.milestone_tons));

    const newMilestones = milestones.filter(m => !existingMilestones.includes(m));

    if (newMilestones.length === 0) return;

    const labels = getOrgTypeLabel(orgType);

    for (const milestone of newMilestones) {
      const certNumber = generateCertNumber(orgType, milestone);

      const { error } = await supabase.from('pride_certificates').insert({
        organization_id: orgId,
        organization_type: orgType,
        certificate_number: certNumber,
        milestone_tons: milestone,
        total_quantity_kg: totalQuantity,
        certificate_type: milestone >= 1000 ? 'excellence' : milestone >= 500 ? 'appreciation' : 'pride',
        title: `Certificate of Pride - ${milestone} Tons`,
        title_ar: `شهادة فخر - ${milestone} طن`,
        description: `Awarded for successfully ${labels.action === 'توليد' ? 'generating' : labels.action === 'نقل' ? 'transporting' : labels.action === 'تدوير' ? 'recycling' : 'disposing of'} ${milestone} tons of waste materials.`,
        description_ar: `تُمنح تقديراً لنجاح ${labels.action} ${milestone} طن من المخلفات. إنجاز بيئي يستحق الفخر.`,
      });

      if (!error) {
        toast.success(`🏆 شهادة فخر جديدة!`, {
          description: `تهانينا! تم إصدار شهادة تقدير لبلوغ ${milestone} طن`,
          duration: 8000,
        });
      }
    }

    queryClient.invalidateQueries({ queryKey: ['pride-certificates'] });
  }, [orgId, orgType, totalQuantity, certificates, queryClient]);

  // Auto-check on load
  useEffect(() => {
    if (totalQuantity > 0 && certificates !== undefined) {
      checkAndIssueCertificates();
    }
  }, [totalQuantity, certificates?.length]);

  const totalTons = totalQuantity / 1000;
  const nextMilestone = totalTons < FIRST_MILESTONE_TONS
    ? FIRST_MILESTONE_TONS
    : Math.ceil((totalTons - FIRST_MILESTONE_TONS) / MILESTONE_STEP_TONS) * MILESTONE_STEP_TONS + FIRST_MILESTONE_TONS + MILESTONE_STEP_TONS;
  
  const progressToNext = totalTons < FIRST_MILESTONE_TONS
    ? (totalTons / FIRST_MILESTONE_TONS) * 100
    : ((totalTons % MILESTONE_STEP_TONS) / MILESTONE_STEP_TONS) * 100;

  return {
    certificates,
    isLoading,
    totalQuantityKg: totalQuantity,
    totalTons,
    nextMilestone,
    progressToNext,
    certificateCount: certificates.length,
  };
};
