import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  Check,
  X,
  Eye,
  Search,
  Loader2,
  Building2,
  Shield,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  AlertTriangle,
  Download,
  RotateCw,
  Sparkles,
  Clock,
  FileCheck,
  FileX,
  ExternalLink,
  History,
  ChevronDown,
  ChevronUp,
  Scale,
  Gavel,
  CheckCircle2,
  XCircle,
  FileWarning,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface OrganizationDocument {
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

interface VerificationHistory {
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

interface VerificationStats {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
  requiresReview: number;
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

const DocumentVerification = () => {
  const [documents, setDocuments] = useState<OrganizationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<OrganizationDocument | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [verificationHistory, setVerificationHistory] = useState<VerificationHistory[]>([]);
  const [stats, setStats] = useState<VerificationStats>({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
    requiresReview: 0,
  });
  const [autoVerifying, setAutoVerifying] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<AILegalAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

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
      
      // Calculate stats
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

  // Get signed URL for document preview
  const getDocumentUrl = useCallback(async (filePath: string): Promise<string | null> => {
    try {
      // First try to get a signed URL
      const { data: signedData, error: signedError } = await supabase.storage
        .from('organization-documents')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (!signedError && signedData?.signedUrl) {
        return signedData.signedUrl;
      }

      // Fallback to public URL
      const { data } = supabase.storage
        .from('organization-documents')
        .getPublicUrl(filePath);
      
      return data.publicUrl;
    } catch (error) {
      console.error('Error getting document URL:', error);
      return null;
    }
  }, []);

  // Load preview when dialog opens
  const loadDocumentPreview = useCallback(async (doc: OrganizationDocument) => {
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewUrl(null);

    try {
      const url = await getDocumentUrl(doc.file_path);
      if (url) {
        setPreviewUrl(url);
      } else {
        setPreviewError('فشل في تحميل المستند');
      }
    } catch (error) {
      console.error('Error loading preview:', error);
      setPreviewError('فشل في تحميل المستند');
    } finally {
      setPreviewLoading(false);
    }
  }, [getDocumentUrl]);

  // AI Legal Document Analysis
  const analyzeDocumentWithAI = useCallback(async (doc: OrganizationDocument): Promise<AILegalAnalysis> => {
    const documentType = doc.document_type;
    const orgData = doc.organization;
    
    // Legal checks based on document type
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
      details: hasValidSize ? 'حجم الملف مناسب' : 'حجم الملف غير مناسب (يجب أن يكون أكبر من 1KB وأقل من 20MB)',
    });
    if (hasValidSize) baseConfidence += 5;

    // Check 3: Organization verification
    const orgVerified = orgData?.is_verified;
    legalChecks.push({
      name: 'توثيق الجهة',
      passed: !!orgVerified,
      details: orgVerified ? 'الجهة المقدمة موثقة في النظام' : 'الجهة المقدمة غير موثقة',
    });
    if (orgVerified) baseConfidence += 10;

    // Check 4: Commercial register exists
    const hasCommercialRegister = !!orgData?.commercial_register;
    legalChecks.push({
      name: 'السجل التجاري',
      passed: hasCommercialRegister,
      details: hasCommercialRegister ? 'السجل التجاري متوفر' : 'السجل التجاري غير متوفر',
    });
    if (hasCommercialRegister) baseConfidence += 10;

    // Check 5: Environmental license check for relevant org types
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

    // Check 7: Recent upload check
    const uploadDate = new Date(doc.created_at);
    const daysSinceUpload = Math.floor((Date.now() - uploadDate.getTime()) / (1000 * 60 * 60 * 24));
    const isRecentUpload = daysSinceUpload < 365;
    legalChecks.push({
      name: 'تاريخ الرفع',
      passed: isRecentUpload,
      details: isRecentUpload ? `تم رفع المستند منذ ${daysSinceUpload} يوم` : 'المستند قديم (أكثر من سنة)',
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

    // Generate summary
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

  // Run AI analysis for a single document
  const runAIAnalysis = async (doc: OrganizationDocument) => {
    setAnalyzing(true);
    setCurrentAnalysis(null);
    
    try {
      // Simulate processing delay for realistic feel
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const analysis = await analyzeDocumentWithAI(doc);
      setCurrentAnalysis(analysis);

      // Update document with AI score
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .from('organization_documents')
        .update({
          ai_confidence_score: analysis.confidence,
          ai_verification_result: {
            confidence: analysis.confidence,
            riskLevel: analysis.riskLevel,
            legalChecks: analysis.legalChecks,
            recommendations: analysis.recommendations,
            analyzedAt: new Date().toISOString(),
          },
        })
        .eq('id', doc.id);

      // Log analysis
      await supabase
        .from('document_verifications')
        .insert([{
          document_id: doc.id,
          organization_id: doc.organization_id,
          verification_type: 'ai_analysis',
          verification_action: 'analyze',
          previous_status: doc.verification_status || 'pending',
          new_status: doc.verification_status || 'pending',
          verified_by: user?.id,
          notes: analysis.summary,
          ai_analysis: analysis as any,
        }]);

      toast.success('تم تحليل المستند قانونياً');
    } catch (error) {
      console.error('AI Analysis error:', error);
      toast.error('فشل في تحليل المستند');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleVerify = async (docId: string, status: 'verified' | 'rejected' | 'requires_review') => {
    setActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const doc = documents.find(d => d.id === docId);
      const previousStatus = doc?.verification_status || 'pending';

      // Update document
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

      // Log verification action
      const { error: logError } = await supabase
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

      if (logError) console.error('Error logging verification:', logError);

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

      // Recalculate stats
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
      
      setDialogOpen(false);
      setVerificationNotes('');
      setRejectionReason('');
    } catch (error) {
      console.error('Error verifying document:', error);
      toast.error('فشل في تحديث حالة المستند');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAutoVerify = async () => {
    setAutoVerifying(true);
    try {
      const pendingDocs = documents.filter(d => d.verification_status === 'pending' || !d.verification_status);
      
      let verifiedCount = 0;
      let reviewCount = 0;
      let rejectedCount = 0;

      for (const doc of pendingDocs) {
        // Run AI legal analysis
        const analysis = await analyzeDocumentWithAI(doc);
        
        const { data: { user } } = await supabase.auth.getUser();
        
        let newStatus: 'verified' | 'requires_review' | 'rejected';
        
        // Auto-verify if high confidence and low risk
        if (analysis.confidence >= 80 && analysis.riskLevel === 'low') {
          newStatus = 'verified';
          verifiedCount++;
        } else if (analysis.confidence >= 50) {
          // Flag for review if medium confidence
          newStatus = 'requires_review';
          reviewCount++;
        } else {
          // Reject if low confidence
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

        // Log verification
        await supabase
          .from('document_verifications')
          .insert([{
            document_id: doc.id,
            organization_id: doc.organization_id,
            verification_type: 'auto',
            verification_action: newStatus === 'verified' ? 'auto_verify' : newStatus === 'rejected' ? 'auto_reject' : 'auto_review',
            previous_status: 'pending',
            new_status: newStatus,
            verified_by: user?.id,
            notes: analysis.summary,
            ai_analysis: analysis as any,
          }]);
      }

      await fetchDocuments();
      
      toast.success(
        `تم التحقق التلقائي: ${verifiedCount} موثق، ${reviewCount} للمراجعة، ${rejectedCount} مرفوض`
      );
    } catch (error) {
      console.error('Auto verification error:', error);
      toast.error('فشل في التحقق التلقائي');
    } finally {
      setAutoVerifying(false);
    }
  };

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

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'verified':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1">
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
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1">
            <ShieldAlert className="w-3 h-3" />
            يتطلب مراجعة
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="w-3 h-3" />
            معلق
          </Badge>
        );
    }
  };

  const getOrgTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      generator: 'جهة مولدة',
      transporter: 'جهة ناقلة',
      recycler: 'جهة مدورة',
    };
    return labels[type] || type;
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

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch =
      doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.document_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.organization?.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'pending' && (doc.verification_status === 'pending' || !doc.verification_status)) ||
      (activeTab === 'verified' && doc.verification_status === 'verified') ||
      (activeTab === 'rejected' && doc.verification_status === 'rejected') ||
      (activeTab === 'review' && doc.verification_status === 'requires_review');

    return matchesSearch && matchesTab;
  });

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'غير محدد';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const openDocumentDialog = async (doc: OrganizationDocument) => {
    setSelectedDoc(doc);
    setDialogOpen(true);
    setCurrentAnalysis(null);
    fetchVerificationHistory(doc.id);
    await loadDocumentPreview(doc);
    
    // Load existing analysis if available
    if (doc.ai_verification_result && typeof doc.ai_verification_result === 'object') {
      setCurrentAnalysis(doc.ai_verification_result as AILegalAnalysis);
    }
  };

  const handleDownload = async (doc: OrganizationDocument) => {
    const url = await getDocumentUrl(doc.file_path);
    if (url) {
      window.open(url, '_blank');
    } else {
      toast.error('فشل في فتح المستند');
    }
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <BackButton />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              onClick={handleAutoVerify}
              disabled={autoVerifying || stats.pending === 0}
              className="gap-2"
            >
              {autoVerifying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Gavel className="w-4 h-4" />
              )}
              تحقق قانوني تلقائي
            </Button>
            <Button variant="outline" onClick={fetchDocuments} className="gap-2">
              <RotateCw className="w-4 h-4" />
              تحديث
            </Button>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-bold flex items-center gap-3 justify-end">
              <Scale className="w-8 h-8 text-primary" />
              نظام التحقق القانوني من المستندات
            </h1>
            <p className="text-muted-foreground">مراجعة وتوثيق المستندات القانونية للجهات تلقائياً</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActiveTab('all')}>
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">إجمالي المستندات</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-amber-500/50 transition-colors border-amber-500/20 bg-amber-500/5" onClick={() => setActiveTab('pending')}>
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-2">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">في الانتظار</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-emerald-500/50 transition-colors border-emerald-500/20 bg-emerald-500/5" onClick={() => setActiveTab('verified')}>
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
                <FileCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-emerald-600">{stats.verified}</p>
              <p className="text-xs text-muted-foreground">موثق</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-red-500/50 transition-colors border-red-500/20 bg-red-500/5" onClick={() => setActiveTab('rejected')}>
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-2">
                <FileX className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              <p className="text-xs text-muted-foreground">مرفوض</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-blue-500/50 transition-colors border-blue-500/20 bg-blue-500/5" onClick={() => setActiveTab('review')}>
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
                <AlertTriangle className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.requiresReview}</p>
              <p className="text-xs text-muted-foreground">يتطلب مراجعة</p>
            </CardContent>
          </Card>
        </div>

        {/* Verification Progress */}
        {stats.total > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  {Math.round((stats.verified / stats.total) * 100)}% مكتمل
                </span>
                <span className="text-sm font-medium">نسبة التحقق</span>
              </div>
              <Progress value={(stats.verified / stats.total) * 100} className="h-2" />
            </CardContent>
          </Card>
        )}

        {/* Documents Table */}
        <Card>
          <CardHeader className="text-right">
            <CardTitle className="flex items-center gap-2 justify-end">
              <FileText className="w-5 h-5" />
              قائمة المستندات
            </CardTitle>
            <CardDescription>جميع المستندات المقدمة من الجهات مع التحقق القانوني التلقائي</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search & Tabs */}
            <div className="space-y-4 mb-6">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بالاسم أو نوع المستند أو اسم الجهة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 text-right"
                />
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="all">الكل ({stats.total})</TabsTrigger>
                  <TabsTrigger value="pending">معلق ({stats.pending})</TabsTrigger>
                  <TabsTrigger value="verified">موثق ({stats.verified})</TabsTrigger>
                  <TabsTrigger value="rejected">مرفوض ({stats.rejected})</TabsTrigger>
                  <TabsTrigger value="review">مراجعة ({stats.requiresReview})</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center w-32">الإجراءات</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">نسبة الثقة AI</TableHead>
                      <TableHead className="text-right">تاريخ الرفع</TableHead>
                      <TableHead className="text-right">الحجم</TableHead>
                      <TableHead className="text-right">نوع المستند</TableHead>
                      <TableHead className="text-right">الجهة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          لا توجد مستندات
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDocuments.map((doc) => (
                        <TableRow key={doc.id} className="hover:bg-muted/50">
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDocumentDialog(doc)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(doc)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              {(doc.verification_status === 'pending' || !doc.verification_status) && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                    onClick={() => handleVerify(doc.id, 'verified')}
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => openDocumentDialog(doc)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {getStatusBadge(doc.verification_status)}
                            {doc.auto_verified && (
                              <Badge variant="outline" className="mr-1 text-xs">
                                <Sparkles className="w-3 h-3 ml-1" />
                                تلقائي
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {doc.ai_confidence_score ? (
                              <div className="flex items-center gap-2 justify-end">
                                <span className={`font-mono text-sm ${
                                  doc.ai_confidence_score >= 80 ? 'text-emerald-600' :
                                  doc.ai_confidence_score >= 50 ? 'text-amber-600' : 'text-red-600'
                                }`}>
                                  {doc.ai_confidence_score}%
                                </span>
                                <Progress 
                                  value={doc.ai_confidence_score} 
                                  className="w-16 h-1.5"
                                />
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {format(new Date(doc.created_at), 'dd MMM yyyy', { locale: ar })}
                          </TableCell>
                          <TableCell className="text-right text-sm font-mono">
                            {formatFileSize(doc.file_size)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline">
                              {getDocumentTypeLabel(doc.document_type)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <div>
                                <p className="font-medium">{doc.organization?.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {getOrgTypeLabel(doc.organization?.organization_type || '')}
                                </p>
                              </div>
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Building2 className="w-4 h-4 text-primary" />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Document Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="flex items-center gap-2 justify-end">
              <Scale className="w-5 h-5" />
              المراجعة القانونية للمستند
            </DialogTitle>
            <DialogDescription>
              تحليل وتوثيق المستند قانونياً
            </DialogDescription>
          </DialogHeader>

          {selectedDoc && (
            <ScrollArea className="max-h-[65vh] pl-4">
              <div className="space-y-6">
                {/* Document Preview */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(selectedDoc)}
                        className="gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        فتح المستند
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => runAIAnalysis(selectedDoc)}
                        disabled={analyzing}
                        className="gap-2"
                      >
                        {analyzing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Gavel className="w-4 h-4" />
                        )}
                        تحليل قانوني
                      </Button>
                    </div>
                    <h3 className="font-medium">{selectedDoc.file_name}</h3>
                  </div>
                  
                  <div className="aspect-video bg-background rounded-lg border flex items-center justify-center overflow-hidden">
                    {previewLoading ? (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <p>جاري تحميل المستند...</p>
                      </div>
                    ) : previewError ? (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <FileWarning className="w-12 h-12" />
                        <p>{previewError}</p>
                        <Button variant="outline" size="sm" onClick={() => handleDownload(selectedDoc)}>
                          فتح المستند مباشرة
                        </Button>
                      </div>
                    ) : previewUrl ? (
                      selectedDoc.file_path.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <img 
                          src={previewUrl} 
                          alt={selectedDoc.file_name}
                          className="max-w-full max-h-full object-contain"
                          onError={() => setPreviewError('فشل في عرض الصورة')}
                        />
                      ) : selectedDoc.file_path.match(/\.pdf$/i) ? (
                        <iframe
                          src={previewUrl}
                          className="w-full h-full min-h-[400px]"
                          title={selectedDoc.file_name}
                        />
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <FileText className="w-16 h-16 mx-auto mb-2" />
                          <p>انقر لفتح المستند</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={() => handleDownload(selectedDoc)}
                          >
                            فتح المستند
                          </Button>
                        </div>
                      )
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <FileText className="w-16 h-16 mx-auto mb-2" />
                        <p>انقر لفتح المستند</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Document Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg border bg-card">
                    <p className="text-sm text-muted-foreground">نوع المستند</p>
                    <p className="font-medium">{getDocumentTypeLabel(selectedDoc.document_type)}</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-card">
                    <p className="text-sm text-muted-foreground">الحالة</p>
                    {getStatusBadge(selectedDoc.verification_status)}
                  </div>
                  <div className="p-3 rounded-lg border bg-card">
                    <p className="text-sm text-muted-foreground">الجهة</p>
                    <p className="font-medium">{selectedDoc.organization?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getOrgTypeLabel(selectedDoc.organization?.organization_type || '')}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border bg-card">
                    <p className="text-sm text-muted-foreground">تاريخ الرفع</p>
                    <p className="font-medium">
                      {format(new Date(selectedDoc.created_at), 'dd MMMM yyyy', { locale: ar })}
                    </p>
                  </div>
                </div>

                {/* AI Legal Analysis Results */}
                {currentAnalysis && (
                  <div className="p-4 rounded-lg border bg-gradient-to-r from-primary/5 to-primary/10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {getRiskBadge(currentAnalysis.riskLevel)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Gavel className="w-5 h-5 text-primary" />
                        <h4 className="font-medium">التحليل القانوني</h4>
                      </div>
                    </div>
                    
                    {/* Confidence Score */}
                    <div className="flex items-center gap-4 mb-4">
                      <span className={`font-bold text-2xl ${
                        currentAnalysis.confidence >= 80 ? 'text-emerald-600' :
                        currentAnalysis.confidence >= 60 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {currentAnalysis.confidence}%
                      </span>
                      <div className="flex-1">
                        <Progress value={currentAnalysis.confidence} className="h-3" />
                      </div>
                    </div>

                    {/* Summary */}
                    <p className="text-sm text-muted-foreground mb-4 bg-background/50 p-2 rounded">
                      {currentAnalysis.summary}
                    </p>

                    {/* Legal Checks */}
                    <div className="space-y-2 mb-4">
                      <h5 className="text-sm font-medium">الفحوصات القانونية:</h5>
                      {currentAnalysis.legalChecks.map((check, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          {check.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                          )}
                          <div>
                            <span className="font-medium">{check.name}:</span>
                            <span className="text-muted-foreground mr-1">{check.details}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Recommendations */}
                    {currentAnalysis.recommendations.length > 0 && (
                      <div className="border-t pt-3">
                        <h5 className="text-sm font-medium mb-2">التوصيات:</h5>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {currentAnalysis.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-primary">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Verification History */}
                <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between">
                      <div className="flex items-center gap-2">
                        {historyOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <History className="w-4 h-4" />
                        سجل التحقق ({verificationHistory.length})
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-2 mt-2">
                      {verificationHistory.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">لا يوجد سجل تحقق</p>
                      ) : (
                        verificationHistory.map((h) => (
                          <div key={h.id} className="p-3 rounded-lg border text-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-muted-foreground">
                                {format(new Date(h.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                              </span>
                              <Badge variant="outline">
                                {h.verification_type === 'auto' ? 'تلقائي' : 
                                 h.verification_type === 'ai_analysis' ? 'تحليل AI' : 'يدوي'}
                              </Badge>
                            </div>
                            <p>{h.previous_status} ← {h.new_status}</p>
                            {h.notes && <p className="text-muted-foreground mt-1">{h.notes}</p>}
                          </div>
                        ))
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Verification Actions */}
                {(selectedDoc.verification_status === 'pending' || 
                  !selectedDoc.verification_status ||
                  selectedDoc.verification_status === 'requires_review') && (
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-medium text-right">إجراءات التحقق</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-muted-foreground block text-right mb-1">
                          ملاحظات التحقق (اختياري)
                        </label>
                        <Textarea
                          value={verificationNotes}
                          onChange={(e) => setVerificationNotes(e.target.value)}
                          placeholder="أضف ملاحظات حول التحقق..."
                          className="text-right"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm text-muted-foreground block text-right mb-1">
                          سبب الرفض (مطلوب عند الرفض)
                        </label>
                        <Textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="أدخل سبب رفض المستند..."
                          className="text-right"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          <DialogFooter className="gap-2 flex-row-reverse sm:flex-row-reverse">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إغلاق
            </Button>
            {selectedDoc && (selectedDoc.verification_status === 'pending' || 
              !selectedDoc.verification_status ||
              selectedDoc.verification_status === 'requires_review') && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleVerify(selectedDoc.id, 'requires_review')}
                  disabled={actionLoading}
                  className="gap-2"
                >
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <AlertTriangle className="w-4 h-4" />
                  تحويل للمراجعة
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleVerify(selectedDoc.id, 'rejected')}
                  disabled={actionLoading || !rejectionReason}
                  className="gap-2"
                >
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <X className="w-4 h-4" />
                  رفض
                </Button>
                <Button
                  onClick={() => handleVerify(selectedDoc.id, 'verified')}
                  disabled={actionLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                >
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Check className="w-4 h-4" />
                  توثيق
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default DocumentVerification;
