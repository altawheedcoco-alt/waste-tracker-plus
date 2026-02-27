/**
 * Contract Signing Logic
 * Defines digital vs manual signing workflows.
 */

export type SigningMethod = 'none' | 'digital' | 'manual';

export type SigningApprovalMode = 'all' | 'joint' | 'individual';

export interface SigningState {
  method: SigningMethod;
  approvalMode: SigningApprovalMode;
  partyOneSignatureUrl?: string;
  partyTwoSignatureUrl?: string;
  partyOneSignedAt?: string;
  partyTwoSignedAt?: string;
}

export const signingMethodLabels: Record<SigningMethod, string> = {
  none: 'بدون توقيع',
  digital: 'توقيع إلكتروني',
  manual: 'طباعة للتوقيع الحي',
};

export const signingMethodDescriptions: Record<SigningMethod, string> = {
  none: 'سيتم حفظ العقد بدون توقيع',
  digital: 'توقيع رقمي داخل المنصة باستخدام لوحة التوقيع',
  manual: 'طباعة نسخة مع أماكن للتوقيع والختم الحي',
};

export const signingApprovalModeLabels: Record<SigningApprovalMode, string> = {
  all: 'الكل',
  joint: 'مجتمعين',
  individual: 'منفردين',
};

export const signingApprovalModeDescriptions: Record<SigningApprovalMode, string> = {
  all: 'يجب توقيع جميع الأطراف المحددة',
  joint: 'يجب توقيع الأطراف مجتمعين في نفس الوقت',
  individual: 'يكفي توقيع أي طرف بشكل منفرد',
};
