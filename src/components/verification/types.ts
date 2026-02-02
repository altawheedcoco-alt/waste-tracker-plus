export interface OrganizationDocument {
  id: string;
  organization_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  uploaded_by: string | null;
  verification_status: string | null;
  verified_by: string | null;
  verified_at: string | null;
  verification_notes: string | null;
  rejection_reason: string | null;
  auto_verified: boolean | null;
  ai_confidence_score: number | null;
  ai_verification_result: any;
  created_at: string;
  organization?: {
    id: string;
    name: string;
    name_en: string | null;
    organization_type: string;
    commercial_register: string | null;
    environmental_license: string | null;
    is_verified: boolean;
  };
}

export interface VerificationHistory {
  id: string;
  document_id: string;
  verification_type: string;
  verification_action: string;
  previous_status: string | null;
  new_status: string;
  notes: string | null;
  created_at: string;
  verified_by: string | null;
}

export interface VerificationStats {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
  requiresReview: number;
}

export interface AILegalAnalysis {
  isValid: boolean;
  confidence: number;
  legalChecks: {
    name: string;
    passed: boolean;
    details: string;
  }[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
  summary: string;
}
