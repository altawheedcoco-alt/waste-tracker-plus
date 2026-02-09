import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ExtractedIDData {
  full_name_ar?: string;
  full_name_en?: string;
  national_id?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  job_title?: string;
  religion?: string;
  marital_status?: string;
  expiry_date?: string;
  issue_date?: string;
  governorate?: string;
  serial_number?: string;
  passport_number?: string;
  nationality?: string;
  place_of_birth?: string;
}

export interface IDVerificationResult {
  is_valid_document: boolean;
  document_type: 'national_id' | 'passport' | 'unknown';
  side: 'front' | 'back' | 'unknown';
  confidence: number;
  extracted_data: ExtractedIDData;
  face_detected: boolean;
  warnings: string[];
}

export interface FaceMatchResult {
  faces_match: boolean;
  match_confidence: number;
  details: string;
  warnings: string[];
}

export const useIDVerification = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [frontResult, setFrontResult] = useState<IDVerificationResult | null>(null);
  const [backResult, setBackResult] = useState<IDVerificationResult | null>(null);
  const [faceMatchResult, setFaceMatchResult] = useState<FaceMatchResult | null>(null);
  const [mergedData, setMergedData] = useState<ExtractedIDData>({});

  const verifyDocument = useCallback(async (
    imageBase64: string, 
    expectedSide: 'front' | 'back',
    selfieBase64?: string
  ): Promise<IDVerificationResult | null> => {
    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-id-document', {
        body: {
          imageBase64,
          expectedSide,
          verifyFace: !!selfieBase64,
          selfieBase64,
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'فشل في التحقق');

      const result: IDVerificationResult = data.result;
      
      if (!result.is_valid_document) {
        toast.error('المستند المرفوع ليس بطاقة هوية صالحة. يرجى رفع صورة واضحة لبطاقة الرقم القومي أو جواز السفر.');
        return null;
      }

      if (result.side !== expectedSide) {
        const sideLabel = expectedSide === 'front' ? 'وجه' : 'ظهر';
        toast.warning(`يبدو أن هذه الصورة ليست ${sideLabel} البطاقة. يرجى رفع الصورة الصحيحة.`);
      }

      if (expectedSide === 'front') {
        setFrontResult(result);
        setMergedData(prev => ({ ...prev, ...result.extracted_data }));
      } else {
        setBackResult(result);
        setMergedData(prev => ({ ...prev, ...result.extracted_data }));
      }

      if (data.faceMatch) {
        setFaceMatchResult(data.faceMatch);
      }

      toast.success(`تم التحقق من ${expectedSide === 'front' ? 'وجه' : 'ظهر'} البطاقة بنجاح`);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'فشل في التحقق من المستند';
      toast.error(message);
      return null;
    } finally {
      setIsVerifying(false);
    }
  }, []);

  const verifyFaceMatch = useCallback(async (
    idFrontBase64: string,
    selfieBase64: string
  ): Promise<FaceMatchResult | null> => {
    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-id-document', {
        body: {
          imageBase64: idFrontBase64,
          expectedSide: 'front',
          verifyFace: true,
          selfieBase64,
        }
      });

      if (error) throw error;
      
      if (data.faceMatch) {
        setFaceMatchResult(data.faceMatch);
        if (data.faceMatch.faces_match) {
          toast.success('تم التحقق من تطابق الوجه بنجاح ✓');
        } else {
          toast.error('لم يتم التعرف على تطابق الوجه. يرجى التأكد من أن الصورة واضحة.');
        }
        return data.faceMatch;
      }
      return null;
    } catch (err) {
      toast.error('فشل في مقارنة الوجه');
      return null;
    } finally {
      setIsVerifying(false);
    }
  }, []);

  const reset = useCallback(() => {
    setFrontResult(null);
    setBackResult(null);
    setFaceMatchResult(null);
    setMergedData({});
  }, []);

  return {
    isVerifying,
    frontResult,
    backResult,
    faceMatchResult,
    mergedData,
    verifyDocument,
    verifyFaceMatch,
    reset,
  };
};
