import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useConsultantAssignments } from '@/hooks/useConsultingOffice';
import { toast } from 'sonner';

interface CoSigningContext {
  officeId: string | null;
  officeName: string | null;
  officeStampUrl: string | null;
  membershipId: string | null;
  role: string | null;
  roleTitle: string | null;
  canSignIndependently: boolean;
  requiresDirectorApproval: boolean;
  signingScope: string[];
  excludedDocumentTypes: string[];
  solidarityStatement: string | null;
}

interface ConsultantSignParams {
  consultantId: string;
  documentType: string;
  documentId: string;
  organizationId: string;
  signatureData?: string;
  stampApplied?: boolean;
  notes?: string;
}

const roleLabels: Record<string, string> = {
  director: 'مدير المكتب',
  senior_consultant: 'استشاري أول',
  consultant: 'استشاري',
  assistant: 'مساعد استشاري',
  delegate: 'مفوّض',
  trainee: 'متدرب',
};

const DEFAULT_SOLIDARITY = 'يوقع الاستشاري باسمه وبصفته تابعاً للمكتب الاستشاري — المكتب متضامن في هذا التصديق';

export const useConsultantCoSigning = () => {
  const { profile } = useAuth();
  const { officeMemberships, consultantProfile } = useConsultantAssignments();

  // Resolve the co-signing context for a given document type
  const getCoSigningContext = useCallback((documentType: string): CoSigningContext => {
    // If no office membership, consultant signs independently
    if (!officeMemberships || officeMemberships.length === 0) {
      return {
        officeId: null,
        officeName: null,
        officeStampUrl: null,
        membershipId: null,
        role: null,
        roleTitle: null,
        canSignIndependently: true,
        requiresDirectorApproval: false,
        signingScope: [],
        excludedDocumentTypes: [],
        solidarityStatement: null,
      };
    }

    // Use first active membership (most consultants have one office)
    const membership = officeMemberships[0];
    const office = (membership as any).office;

    // Check if document type is excluded
    const isExcluded = membership.excluded_document_types?.includes(documentType);

    return {
      officeId: office?.id || null,
      officeName: office?.office_name || null,
      officeStampUrl: office?.office_stamp_url || null,
      membershipId: membership.id,
      role: membership.role,
      roleTitle: roleLabels[membership.role] || membership.role,
      canSignIndependently: membership.can_sign_independently && !isExcluded,
      requiresDirectorApproval: membership.requires_director_approval || isExcluded,
      signingScope: membership.signing_scope || [],
      excludedDocumentTypes: membership.excluded_document_types || [],
      solidarityStatement: isExcluded ? null : DEFAULT_SOLIDARITY,
    };
  }, [officeMemberships]);

  // Fetch signing policy for a document type from the office
  const fetchSigningPolicy = useCallback(async (officeId: string, documentType: string) => {
    const { data } = await supabase
      .from('office_signing_policies')
      .select('*')
      .eq('office_id', officeId)
      .eq('document_type', documentType)
      .eq('is_active', true)
      .maybeSingle();
    return data;
  }, []);

  // Sign document with co-signing logic
  const signWithCoSigning = useCallback(async (params: ConsultantSignParams) => {
    const context = getCoSigningContext(params.documentType);

    // Check if excluded
    if (context.excludedDocumentTypes.includes(params.documentType)) {
      toast.error('ليس لديك صلاحية التوقيع على هذا النوع من المستندات');
      return null;
    }

    // Fetch office signing policy if applicable
    let policy: any = null;
    if (context.officeId) {
      policy = await fetchSigningPolicy(context.officeId, params.documentType);
    }

    // Determine approval status
    const needsApproval = context.requiresDirectorApproval || 
      (policy?.requires_director_approval ?? false);

    // Generate signature hash
    const signatureHash = await generateHash(JSON.stringify({
      consultant_id: params.consultantId,
      document_id: params.documentId,
      timestamp: new Date().toISOString(),
      office_id: context.officeId,
    }));

    // Build solidarity statement
    let solidarityText: string | null = null;
    if (context.officeId) {
      if (policy?.show_solidarity_clause !== false) {
        solidarityText = context.solidarityStatement;
        if (policy?.director_notes) {
          solidarityText = `${solidarityText} — ملاحظة المدير: ${policy.director_notes}`;
        }
      }
    }

    // Insert signature record
    const { data, error } = await supabase
      .from('consultant_document_signatures')
      .insert({
        consultant_id: params.consultantId,
        organization_id: params.organizationId,
        document_type: params.documentType,
        document_id: params.documentId,
        signature_data: params.signatureData,
        stamp_applied: params.stampApplied || false,
        signature_hash: signatureHash,
        device_info: navigator.userAgent,
        notes: params.notes,
        // Co-signing fields
        office_id: context.officeId,
        membership_id: context.membershipId,
        signed_as_role: context.roleTitle,
        solidarity_statement: solidarityText,
        office_stamp_applied: context.officeId ? !needsApproval : false,
        office_co_signed: context.officeId ? !needsApproval : false,
        director_approval_status: needsApproval ? 'pending' : (context.officeId ? 'approved' : null),
      } as any)
      .select()
      .single();

    if (error) {
      toast.error(error.message || 'فشل التوقيع');
      return null;
    }

    if (needsApproval) {
      toast.success('تم التوقيع — بانتظار اعتماد مدير المكتب');
    } else {
      toast.success('تم التوقيع بنجاح');
    }

    return data;
  }, [getCoSigningContext, fetchSigningPolicy]);

  return {
    consultantProfile,
    officeMemberships,
    getCoSigningContext,
    signWithCoSigning,
    isInOffice: officeMemberships.length > 0,
  };
};

async function generateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
