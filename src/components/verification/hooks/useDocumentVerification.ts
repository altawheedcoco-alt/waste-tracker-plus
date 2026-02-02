import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { OrganizationDocument, VerificationHistory, VerificationStats, AILegalAnalysis } from '../types';
import { getDocumentTypeLabel } from '../verificationUtils';

export const useDocumentVerification = () => {
  const [documents, setDocuments] = useState<OrganizationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [verificationHistory, setVerificationHistory] = useState<VerificationHistory[]>([]);
  const [stats, setStats] = useState<VerificationStats>({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
    requiresReview: 0,
  });

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('organization_documents')
        .select(`
          *,
          organization:organizations(
            id,
            name,
            name_en,
            organization_type,
            commercial_register,
            environmental_license,
            is_verified
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const docs = (data || []) as OrganizationDocument[];
      setDocuments(docs);
      
      setStats({
        total: docs.length,
        pending: docs.filter(d => d.verification_status === 'pending' || !d.verification_status).length,
        verified: docs.filter(d => d.verification_status === 'verified').length,
        rejected: docs.filter(d => d.verification_status === 'rejected').length,
        requiresReview: docs.filter(d => d.verification_status === 'requires_review').length,
      });
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('فشل في تحميل المستندات');
    } finally {
      setLoading(false);
    }
  };

  const fetchVerificationHistory = async (documentId: string) => {
    try {
      const { data, error } = await supabase
        .from('document_verifications')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVerificationHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const getDocumentUrl = useCallback(async (filePath: string): Promise<string | null> => {
    try {
      const { data: signedData, error: signedError } = await supabase.storage
        .from('organization-documents')
        .createSignedUrl(filePath, 3600);

      if (!signedError && signedData?.signedUrl) {
        return signedData.signedUrl;
      }

      const { data } = supabase.storage
        .from('organization-documents')
        .getPublicUrl(filePath);
      
      return data.publicUrl;
    } catch (error) {
      console.error('Error getting document URL:', error);
      return null;
    }
  }, []);

  const analyzeDocumentWithAI = useCallback(async (doc: OrganizationDocument): Promise<AILegalAnalysis> => {
    const documentType = doc.document_type;
    const orgData = doc.organization;
    
    const legalChecks: AILegalAnalysis['legalChecks'] = [];
    let baseConfidence = 60;

    const isValidFormat = doc.file_path.match(/\.(pdf|jpg|jpeg|png|gif|webp)$/i);
    legalChecks.push({
      name: 'صيغة المستند',
      passed: !!isValidFormat,
      details: isValidFormat ? 'صيغة المستند صالحة ومقبولة' : 'صيغة المستند غير معتمدة',
    });
    if (isValidFormat) baseConfidence += 5;

    const hasValidSize = doc.file_size && doc.file_size > 1000 && doc.file_size < 20 * 1024 * 1024;
    legalChecks.push({
      name: 'حجم الملف',
      passed: !!hasValidSize,
      details: hasValidSize ? 'حجم الملف مناسب' : 'حجم الملف غير مناسب',
    });
    if (hasValidSize) baseConfidence += 5;

    const orgVerified = orgData?.is_verified;
    legalChecks.push({
      name: 'توثيق الجهة',
      passed: !!orgVerified,
      details: orgVerified ? 'الجهة المقدمة موثقة في النظام' : 'الجهة المقدمة غير موثقة',
    });
    if (orgVerified) baseConfidence += 10;

    const hasCommercialRegister = !!orgData?.commercial_register;
    legalChecks.push({
      name: 'السجل التجاري',
      passed: hasCommercialRegister,
      details: hasCommercialRegister ? 'السجل التجاري متوفر' : 'السجل التجاري غير متوفر',
    });
    if (hasCommercialRegister) baseConfidence += 10;

    const needsEnvLicense = orgData?.organization_type === 'recycler' || orgData?.organization_type === 'transporter';
    const hasEnvLicense = !!orgData?.environmental_license;
    if (needsEnvLicense) {
      legalChecks.push({
        name: 'الترخيص البيئي',
        passed: hasEnvLicense,
        details: hasEnvLicense ? 'الترخيص البيئي متوفر' : 'الترخيص البيئي مطلوب ولكنه غير متوفر',
      });
      if (hasEnvLicense) baseConfidence += 10;
    }

    const validDocTypes = ['commercial_register', 'environmental_license', 'tax_card', 'id_card', 'delegation_letter', 'contract', 'certificate', 'license'];
    const isValidType = validDocTypes.includes(documentType);
    legalChecks.push({
      name: 'نوع المستند',
      passed: isValidType,
      details: isValidType ? `نوع المستند (${getDocumentTypeLabel(documentType)}) معترف به قانونياً` : 'نوع المستند غير معروف',
    });
    if (isValidType) baseConfidence += 5;

    const uploadDate = new Date(doc.created_at);
    const daysSinceUpload = Math.floor((Date.now() - uploadDate.getTime()) / (1000 * 60 * 60 * 24));
    const isRecentUpload = daysSinceUpload < 365;
    legalChecks.push({
      name: 'تاريخ الرفع',
      passed: isRecentUpload,
      details: isRecentUpload ? `تم رفع المستند منذ ${daysSinceUpload} يوم` : 'المستند قديم (أكثر من سنة)',
    });
    if (isRecentUpload) baseConfidence += 5;

    const passedChecks = legalChecks.filter(c => c.passed).length;
    const totalChecks = legalChecks.length;
    const confidence = Math.min(Math.round(baseConfidence + (passedChecks / totalChecks) * 20), 100);

    let riskLevel: 'low' | 'medium' | 'high';
    if (confidence >= 80) riskLevel = 'low';
    else if (confidence >= 60) riskLevel = 'medium';
    else riskLevel = 'high';

    const recommendations: string[] = [];
    legalChecks.forEach(check => {
      if (!check.passed) {
        switch (check.name) {
          case 'السجل التجاري':
            recommendations.push('يجب التحقق من وجود سجل تجاري ساري المفعول للجهة');
            break;
          case 'الترخيص البيئي':
            recommendations.push('يجب طلب صورة من الترخيص البيئي ساري المفعول');
            break;
          case 'توثيق الجهة':
            recommendations.push('يجب توثيق الجهة في النظام أولاً');
            break;
          case 'صيغة المستند':
            recommendations.push('يجب رفع المستند بصيغة PDF أو صورة');
            break;
          case 'حجم الملف':
            recommendations.push('يرجى التأكد من جودة المستند المرفوع');
            break;
        }
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('المستند يستوفي جميع المتطلبات القانونية');
    }

    let summary = '';
    if (confidence >= 80) {
      summary = `المستند يستوفي ${passedChecks} من ${totalChecks} فحص قانوني ويمكن اعتماده تلقائياً.`;
    } else if (confidence >= 60) {
      summary = `المستند يتطلب مراجعة يدوية. اجتاز ${passedChecks} من ${totalChecks} فحص.`;
    } else {
      summary = `المستند يحتوي على مشاكل قانونية ويجب رفضه أو طلب تصحيح. اجتاز ${passedChecks} من ${totalChecks} فحص فقط.`;
    }

    return {
      isValid: confidence >= 80,
      confidence,
      legalChecks,
      recommendations,
      riskLevel,
      summary,
    };
  }, []);

  const handleVerify = async (
    docId: string, 
    status: 'verified' | 'rejected' | 'requires_review',
    verificationNotes: string,
    rejectionReason: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const doc = documents.find(d => d.id === docId);
      const previousStatus = doc?.verification_status || 'pending';

      const { error: updateError } = await supabase
        .from('organization_documents')
        .update({
          verification_status: status,
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          verification_notes: verificationNotes || null,
          rejection_reason: status === 'rejected' ? rejectionReason : null,
        })
        .eq('id', docId);

      if (updateError) throw updateError;

      await supabase
        .from('document_verifications')
        .insert({
          document_id: docId,
          organization_id: doc?.organization_id,
          verification_type: 'manual',
          verification_action: status === 'verified' ? 'verify' : status === 'rejected' ? 'reject' : 'request_revision',
          previous_status: previousStatus,
          new_status: status,
          verified_by: user.id,
          notes: verificationNotes || rejectionReason || null,
        });

      setDocuments(prev =>
        prev.map(d =>
          d.id === docId
            ? { 
                ...d, 
                verification_status: status,
                verified_by: user.id,
                verified_at: new Date().toISOString(),
                verification_notes: verificationNotes,
                rejection_reason: status === 'rejected' ? rejectionReason : null,
              }
            : d
        )
      );

      const updatedDocs = documents.map(d =>
        d.id === docId ? { ...d, verification_status: status } : d
      );
      setStats({
        total: updatedDocs.length,
        pending: updatedDocs.filter(d => d.verification_status === 'pending' || !d.verification_status).length,
        verified: updatedDocs.filter(d => d.verification_status === 'verified').length,
        rejected: updatedDocs.filter(d => d.verification_status === 'rejected').length,
        requiresReview: updatedDocs.filter(d => d.verification_status === 'requires_review').length,
      });

      const messages = {
        verified: 'تم التحقق من المستند بنجاح',
        rejected: 'تم رفض المستند',
        requires_review: 'تم تحويل المستند للمراجعة',
      };
      toast.success(messages[status]);
      
      return true;
    } catch (error) {
      console.error('Error verifying document:', error);
      toast.error('فشل في تحديث حالة المستند');
      return false;
    }
  };

  const handleAutoVerify = async () => {
    try {
      const pendingDocs = documents.filter(d => d.verification_status === 'pending' || !d.verification_status);
      
      let verifiedCount = 0;
      let reviewCount = 0;
      let rejectedCount = 0;

      for (const doc of pendingDocs) {
        const analysis = await analyzeDocumentWithAI(doc);
        
        const { data: { user } } = await supabase.auth.getUser();
        
        let newStatus: 'verified' | 'requires_review' | 'rejected';
        
        if (analysis.confidence >= 80 && analysis.riskLevel === 'low') {
          newStatus = 'verified';
          verifiedCount++;
        } else if (analysis.confidence >= 50) {
          newStatus = 'requires_review';
          reviewCount++;
        } else {
          newStatus = 'rejected';
          rejectedCount++;
        }

        await supabase
          .from('organization_documents')
          .update({
            verification_status: newStatus,
            verified_by: user?.id,
            verified_at: new Date().toISOString(),
            auto_verified: newStatus === 'verified',
            ai_confidence_score: analysis.confidence,
            ai_verification_result: {
              auto_verified: newStatus === 'verified',
              confidence: analysis.confidence,
              riskLevel: analysis.riskLevel,
              legalChecks: analysis.legalChecks,
              recommendations: analysis.recommendations,
              verified_at: new Date().toISOString(),
            },
            rejection_reason: newStatus === 'rejected' ? analysis.summary : null,
          })
          .eq('id', doc.id);

        await supabase
          .from('document_verifications')
          .insert([{
            document_id: doc.id,
            organization_id: doc.organization_id,
            verification_type: 'auto',
            verification_action: newStatus === 'verified' ? 'verify' : newStatus === 'rejected' ? 'reject' : 'request_revision',
            previous_status: 'pending',
            new_status: newStatus,
            verified_by: user?.id,
            notes: 'تحقق تلقائي: ' + analysis.summary,
            ai_analysis: analysis as any,
          }]);
      }

      await fetchDocuments();
      
      toast.success(
        `تم التحقق التلقائي: ${verifiedCount} موثق، ${reviewCount} للمراجعة، ${rejectedCount} مرفوض`
      );
      return true;
    } catch (error) {
      console.error('Auto verification error:', error);
      toast.error('فشل في التحقق التلقائي');
      return false;
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return {
    documents,
    loading,
    stats,
    verificationHistory,
    fetchDocuments,
    fetchVerificationHistory,
    getDocumentUrl,
    analyzeDocumentWithAI,
    handleVerify,
    handleAutoVerify,
  };
};
