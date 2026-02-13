/**
 * Contract Signing Logic
 * Defines digital vs manual signing workflows.
 */

export type SigningMethod = 'none' | 'digital' | 'manual';

export interface SigningState {
  method: SigningMethod;
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
