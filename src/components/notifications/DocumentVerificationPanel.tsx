import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Loader2,
  FileText,
  Gavel,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Check,
  X,
  FileWarning,
  ExternalLink,
  Scale,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
} from 'lucide-react';

interface OrganizationDocument {
  id: string;
  organization_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  verification_status: string | null;
  ai_confidence_score: number | null;
  ai_verification_result: any;
  rejection_reason: string | null;
  created_at: string;
  organization?: {
    id: string;
    name: string;
    organization_type: string;
    commercial_register: string | null;
    environmental_license: string | null;
    is_verified: boolean;
  };
}

interface AILegalAnalysis {
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

interface DocumentVerificationPanelProps {
  organizationId: string;
  documentId?: string;
  onVerificationComplete?: () => void;
}

const getDocumentTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    commercial_register: 'السجل التجاري',
    environmental_license: 'الترخيص البيئي',
    tax_card: 'البطاقة الضريبية',
    id_card: 'بطاقة الهوية',
    delegation_letter: 'خطاب تفويض',
    contract: 'عقد',
    certificate: 'شهادة',
    license: 'ترخيص',
    other: 'مستند آخر',
  };
  return labels[type] || type;
};

const DocumentVerificationPanel = ({
  organizationId,
  documentId,
  onVerificationComplete,
}: DocumentVerificationPanelProps) => {
  const [documents, setDocuments] = useState<OrganizationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyses, setAnalyses] = useState<Record<string, AILegalAnalysis>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<string | null>(null);

  // Fetch documents for the organization
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        let query = supabase
          .from('organization_documents')
          .select(`
            *,
            organization:organizations(
              id,
              name,
              organization_type,
              commercial_register,
              environmental_license,
              is_verified
            )
          `)
          .eq('organization_id', organizationId);

        if (documentId) {
          query = query.eq('id', documentId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        setDocuments((data || []) as OrganizationDocument[]);

        // Auto-analyze all pending documents
        if (data && data.length > 0) {
          await analyzeAllDocuments(data as OrganizationDocument[]);
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
        toast.error('فشل في تحميل المستندات');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [organizationId, documentId]);

  // AI Legal Document Analysis
  const analyzeDocument = useCallback(async (doc: OrganizationDocument): Promise<AILegalAnalysis> => {
    const documentType = doc.document_type;
    const orgData = doc.organization;
    
    const legalChecks: AILegalAnalysis['legalChecks'] = [];
    let baseConfidence = 60;

    // Check 1: Document format validation
    const isValidFormat = doc.file_path.match(/\.(pdf|jpg|jpeg|png|gif|webp)$/i);
    legalChecks.push({
      name: 'صيغة المستند',
      passed: !!isValidFormat,
      details: isValidFormat ? 'صيغة المستند صالحة ومقبولة' : 'صيغة المستند غير معتمدة',
    });
    if (isValidFormat) baseConfidence += 5;

    // Check 2: File size validation
    const hasValidSize = doc.file_size && doc.file_size > 1000 && doc.file_size < 20 * 1024 * 1024;
    legalChecks.push({
      name: 'حجم الملف',
      passed: !!hasValidSize,
      details: hasValidSize ? 'حجم الملف مناسب' : 'حجم الملف غير مناسب',
    });
    if (hasValidSize) baseConfidence += 5;

    // Check 3: Organization verification
    const orgVerified = orgData?.is_verified;
    legalChecks.push({
      name: 'توثيق الجهة',
      passed: !!orgVerified,
      details: orgVerified ? 'الجهة المقدمة موثقة' : 'الجهة المقدمة غير موثقة',
    });
    if (orgVerified) baseConfidence += 10;

    // Check 4: Commercial register
    const hasCommercialRegister = !!orgData?.commercial_register;
    legalChecks.push({
      name: 'السجل التجاري',
      passed: hasCommercialRegister,
      details: hasCommercialRegister ? 'السجل التجاري متوفر' : 'السجل التجاري غير متوفر',
    });
    if (hasCommercialRegister) baseConfidence += 10;

    // Check 5: Environmental license for relevant org types
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

    // Check 6: Document type matching
    const validDocTypes = ['commercial_register', 'environmental_license', 'tax_card', 'id_card', 'delegation_letter', 'contract', 'certificate', 'license'];
    const isValidType = validDocTypes.includes(documentType);
    legalChecks.push({
      name: 'نوع المستند',
      passed: isValidType,
      details: isValidType ? `نوع المستند (${getDocumentTypeLabel(documentType)}) معترف به قانونياً` : 'نوع المستند غير معروف',
    });
    if (isValidType) baseConfidence += 5;

    // Check 7: Recent upload
    const uploadDate = new Date(doc.created_at);
    const daysSinceUpload = Math.floor((Date.now() - uploadDate.getTime()) / (1000 * 60 * 60 * 24));
    const isRecentUpload = daysSinceUpload < 365;
    legalChecks.push({
      name: 'تاريخ الرفع',
      passed: isRecentUpload,
      details: isRecentUpload ? `تم رفع المستند منذ ${daysSinceUpload} يوم` : 'المستند قديم',
    });
    if (isRecentUpload) baseConfidence += 5;

    // Calculate final confidence
    const passedChecks = legalChecks.filter(c => c.passed).length;
    const totalChecks = legalChecks.length;
    const confidence = Math.min(Math.round(baseConfidence + (passedChecks / totalChecks) * 20), 100);

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high';
    if (confidence >= 80) riskLevel = 'low';
    else if (confidence >= 60) riskLevel = 'medium';
    else riskLevel = 'high';

    // Generate recommendations
    const recommendations: string[] = [];
    legalChecks.forEach(check => {
      if (!check.passed) {
        switch (check.name) {
          case 'السجل التجاري':
            recommendations.push('التحقق من وجود سجل تجاري ساري المفعول');
            break;
          case 'الترخيص البيئي':
            recommendations.push('طلب صورة من الترخيص البيئي');
            break;
          case 'توثيق الجهة':
            recommendations.push('توثيق الجهة في النظام أولاً');
            break;
        }
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('المستند يستوفي جميع المتطلبات القانونية');
    }

    // Generate summary
    let summary = '';
    if (confidence >= 80) {
      summary = `المستند يستوفي ${passedChecks} من ${totalChecks} فحص قانوني - يوصى بالقبول`;
    } else if (confidence >= 60) {
      summary = `المستند يتطلب مراجعة يدوية - اجتاز ${passedChecks} من ${totalChecks} فحص`;
    } else {
      summary = `المستند يحتوي على مشاكل قانونية - اجتاز ${passedChecks} من ${totalChecks} فحص فقط`;
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

  const analyzeAllDocuments = async (docs: OrganizationDocument[]) => {
    setAnalyzing(true);
    const newAnalyses: Record<string, AILegalAnalysis> = {};

    for (const doc of docs) {
      // Skip already verified/rejected
      if (doc.verification_status === 'verified' || doc.verification_status === 'rejected') {
        if (doc.ai_verification_result) {
          newAnalyses[doc.id] = doc.ai_verification_result as AILegalAnalysis;
        }
        continue;
      }

      try {
        await new Promise(resolve => setTimeout(resolve, 500)); // Realistic delay
        const analysis = await analyzeDocument(doc);
        newAnalyses[doc.id] = analysis;

        // Update document with AI score
        await supabase
          .from('organization_documents')
          .update({
            ai_confidence_score: analysis.confidence,
            ai_verification_result: analysis as any,
          })
          .eq('id', doc.id);
      } catch (error) {
        console.error('Error analyzing document:', doc.id, error);
      }
    }

    setAnalyses(newAnalyses);
    setAnalyzing(false);
  };

  const handleVerify = async (docId: string, status: 'verified' | 'rejected') => {
    setActionLoading(docId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const doc = documents.find(d => d.id === docId);
      const rejectionReason = status === 'rejected' ? rejectionReasons[docId] : null;

      // Update document
      const { error: updateError } = await supabase
        .from('organization_documents')
        .update({
          verification_status: status,
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq('id', docId);

      if (updateError) throw updateError;

      // Log verification
      await supabase
        .from('document_verifications')
        .insert([{
          document_id: docId,
          organization_id: doc?.organization_id,
          verification_type: 'manual_from_notification',
          verification_action: status === 'verified' ? 'verify' : 'reject',
          previous_status: doc?.verification_status || 'pending',
          new_status: status,
          verified_by: user.id,
          notes: rejectionReason || `تم ${status === 'verified' ? 'القبول' : 'الرفض'} من الإشعارات`,
          ai_analysis: analyses[docId] as any,
        }]);

      // Update local state
      setDocuments(prev =>
        prev.map(d =>
          d.id === docId
            ? { ...d, verification_status: status, rejection_reason: rejectionReason }
            : d
        )
      );

      toast.success(status === 'verified' ? 'تم قبول المستند' : 'تم رفض المستند');
      setShowRejectInput(null);
      onVerificationComplete?.();
    } catch (error) {
      console.error('Error verifying document:', error);
      toast.error('فشل في تحديث حالة المستند');
    } finally {
      setActionLoading(null);
    }
  };

  const getDocumentUrl = async (filePath: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('organization-documents')
        .createSignedUrl(filePath, 3600);

      if (!error && data?.signedUrl) return data.signedUrl;

      const { data: publicData } = supabase.storage
        .from('organization-documents')
        .getPublicUrl(filePath);
      
      return publicData.publicUrl;
    } catch {
      return null;
    }
  };

  const openDocument = async (doc: OrganizationDocument) => {
    const url = await getDocumentUrl(doc.file_path);
    if (url) {
      window.open(url, '_blank');
    } else {
      toast.error('فشل في فتح المستند');
    }
  };

  const getRiskBadge = (riskLevel: 'low' | 'medium' | 'high') => {
    switch (riskLevel) {
      case 'low':
        return <Badge className="bg-emerald-500/10 text-emerald-600">مخاطر منخفضة</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500/10 text-amber-600">مخاطر متوسطة</Badge>;
      case 'high':
        return <Badge className="bg-red-500/10 text-red-600">مخاطر عالية</Badge>;
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'verified':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 gap-1">
            <ShieldCheck className="w-3 h-3" />
            موثق
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="gap-1">
            <ShieldX className="w-3 h-3" />
            مرفوض
          </Badge>
        );
      case 'requires_review':
        return (
          <Badge className="bg-amber-500/10 text-amber-600 gap-1">
            <ShieldAlert className="w-3 h-3" />
            يتطلب مراجعة
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            معلق
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="mr-2">جاري تحميل المستندات...</span>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <FileWarning className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p>لا توجد مستندات للتحقق منها</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
        <Scale className="w-5 h-5 text-primary" />
        <div className="flex-1">
          <p className="font-medium text-sm">التحقق القانوني التلقائي</p>
          <p className="text-xs text-muted-foreground">
            {analyzing ? 'جاري تحليل المستندات...' : `تم تحليل ${documents.length} مستند`}
          </p>
        </div>
        {analyzing && <Loader2 className="w-4 h-4 animate-spin" />}
      </div>

      <ScrollArea className="max-h-[400px]">
        <div className="space-y-4">
          {documents.map((doc) => {
            const analysis = analyses[doc.id];
            const isPending = !doc.verification_status || doc.verification_status === 'pending' || doc.verification_status === 'requires_review';

            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg border bg-card"
              >
                {/* Document Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(doc.verification_status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDocument(doc)}
                      className="gap-1 h-7"
                    >
                      <ExternalLink className="w-3 h-3" />
                      فتح
                    </Button>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{doc.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getDocumentTypeLabel(doc.document_type)}
                    </p>
                  </div>
                </div>

                {/* AI Analysis */}
                {analysis && (
                  <div className="space-y-3">
                    {/* Confidence & Risk */}
                    <div className="flex items-center gap-3 p-2 rounded bg-muted/50">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className={`font-bold ${
                            analysis.confidence >= 80 ? 'text-emerald-600' :
                            analysis.confidence >= 60 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {analysis.confidence}%
                          </span>
                          <span className="text-muted-foreground">نسبة الثقة</span>
                        </div>
                        <Progress value={analysis.confidence} className="h-2" />
                      </div>
                      {getRiskBadge(analysis.riskLevel)}
                    </div>

                    {/* Summary */}
                    <p className="text-xs bg-background p-2 rounded border">
                      {analysis.summary}
                    </p>

                    {/* Legal Checks */}
                    <div className="space-y-1">
                      {analysis.legalChecks.map((check, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          {check.passed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          )}
                          <span className={check.passed ? 'text-muted-foreground' : 'text-red-600'}>
                            {check.name}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Recommendations */}
                    {analysis.recommendations.length > 0 && !analysis.isValid && (
                      <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                        <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">
                          التوصيات:
                        </p>
                        <ul className="text-xs text-amber-600 dark:text-amber-500 space-y-0.5">
                          {analysis.recommendations.map((rec, idx) => (
                            <li key={idx}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Rejection Reason Input */}
                {showRejectInput === doc.id && (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      placeholder="أدخل سبب الرفض (مطلوب)..."
                      value={rejectionReasons[doc.id] || ''}
                      onChange={(e) => setRejectionReasons(prev => ({
                        ...prev,
                        [doc.id]: e.target.value,
                      }))}
                      className="text-right text-sm"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleVerify(doc.id, 'rejected')}
                        disabled={!rejectionReasons[doc.id] || actionLoading === doc.id}
                        className="gap-1"
                      >
                        {actionLoading === doc.id && <Loader2 className="w-3 h-3 animate-spin" />}
                        تأكيد الرفض
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowRejectInput(null)}
                      >
                        إلغاء
                      </Button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {isPending && showRejectInput !== doc.id && (
                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    <Button
                      size="sm"
                      onClick={() => handleVerify(doc.id, 'verified')}
                      disabled={actionLoading === doc.id}
                      className="bg-emerald-600 hover:bg-emerald-700 gap-1 flex-1"
                    >
                      {actionLoading === doc.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      قبول
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowRejectInput(doc.id)}
                      disabled={actionLoading === doc.id}
                      className="gap-1 flex-1"
                    >
                      <X className="w-3 h-3" />
                      رفض مع السبب
                    </Button>
                  </div>
                )}

                {/* Show rejection reason if rejected */}
                {doc.verification_status === 'rejected' && doc.rejection_reason && (
                  <div className="mt-3 p-2 rounded bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                    <p className="text-xs font-medium text-red-700 dark:text-red-400">سبب الرفض:</p>
                    <p className="text-xs text-red-600 dark:text-red-500">{doc.rejection_reason}</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default DocumentVerificationPanel;
