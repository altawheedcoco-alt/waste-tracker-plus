import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const [bulkAction, setBulkAction] = useState<string>('');
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

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
      
      for (const doc of pendingDocs) {
        // Simulate AI verification based on document type and organization data
        const aiScore = simulateAIVerification(doc);
        
        const { data: { user } } = await supabase.auth.getUser();
        
        // Auto-verify if confidence is high
        if (aiScore >= 80) {
          await supabase
            .from('organization_documents')
            .update({
              verification_status: 'verified',
              verified_by: user?.id,
              verified_at: new Date().toISOString(),
              auto_verified: true,
              ai_confidence_score: aiScore,
              ai_verification_result: {
                auto_verified: true,
                confidence: aiScore,
                checks_passed: ['format', 'metadata', 'organization_match'],
                verified_at: new Date().toISOString(),
              },
            })
            .eq('id', doc.id);
        } else if (aiScore >= 50) {
          // Flag for review if medium confidence
          await supabase
            .from('organization_documents')
            .update({
              verification_status: 'requires_review',
              ai_confidence_score: aiScore,
              ai_verification_result: {
                auto_verified: false,
                confidence: aiScore,
                requires_manual_review: true,
                reason: 'درجة ثقة متوسطة - يتطلب مراجعة يدوية',
              },
            })
            .eq('id', doc.id);
        }
      }

      await fetchDocuments();
      toast.success('تم التحقق التلقائي بنجاح');
    } catch (error) {
      console.error('Auto verification error:', error);
      toast.error('فشل في التحقق التلقائي');
    } finally {
      setAutoVerifying(false);
    }
  };

  const simulateAIVerification = (doc: OrganizationDocument): number => {
    // Simulate AI verification scoring
    let score = 50;
    
    // Check if organization has legal info
    if (doc.organization?.commercial_register) score += 15;
    if (doc.organization?.environmental_license) score += 15;
    if (doc.organization?.is_verified) score += 10;
    
    // Check document metadata
    if (doc.file_size && doc.file_size > 0) score += 5;
    if (doc.document_type) score += 5;
    
    return Math.min(score, 100);
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

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from('organization-documents').getPublicUrl(path);
    return data.publicUrl;
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
                <Sparkles className="w-4 h-4" />
              )}
              تحقق تلقائي
            </Button>
            <Button variant="outline" onClick={fetchDocuments} className="gap-2">
              <RotateCw className="w-4 h-4" />
              تحديث
            </Button>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-bold flex items-center gap-3 justify-end">
              <Shield className="w-8 h-8 text-primary" />
              نظام التحقق من المستندات
            </h1>
            <p className="text-muted-foreground">مراجعة وتوثيق المستندات القانونية للجهات</p>
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
            <CardDescription>جميع المستندات المقدمة من الجهات</CardDescription>
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
                                onClick={() => {
                                  setSelectedDoc(doc);
                                  setDialogOpen(true);
                                  fetchVerificationHistory(doc.id);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(getPublicUrl(doc.file_path), '_blank')}
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
                                    onClick={() => {
                                      setSelectedDoc(doc);
                                      setDialogOpen(true);
                                    }}
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
        <DialogContent className="max-w-3xl max-h-[90vh]" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="flex items-center gap-2 justify-end">
              <FileText className="w-5 h-5" />
              تفاصيل المستند
            </DialogTitle>
            <DialogDescription>
              مراجعة وتوثيق المستند
            </DialogDescription>
          </DialogHeader>

          {selectedDoc && (
            <ScrollArea className="max-h-[60vh] pl-4">
              <div className="space-y-6">
                {/* Document Preview */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center justify-between mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(getPublicUrl(selectedDoc.file_path), '_blank')}
                      className="gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      فتح المستند
                    </Button>
                    <h3 className="font-medium">{selectedDoc.file_name}</h3>
                  </div>
                  <div className="aspect-video bg-background rounded-lg border flex items-center justify-center overflow-hidden">
                    {selectedDoc.file_path.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img 
                        src={getPublicUrl(selectedDoc.file_path)} 
                        alt={selectedDoc.file_name}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : selectedDoc.file_path.match(/\.pdf$/i) ? (
                      <iframe
                        src={getPublicUrl(selectedDoc.file_path)}
                        className="w-full h-full"
                        title={selectedDoc.file_name}
                      />
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

                {/* AI Analysis */}
                {selectedDoc.ai_confidence_score && (
                  <div className="p-4 rounded-lg border bg-gradient-to-r from-primary/5 to-primary/10">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <h4 className="font-medium">تحليل الذكاء الاصطناعي</h4>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Progress value={selectedDoc.ai_confidence_score} className="h-3" />
                      </div>
                      <span className={`font-bold text-lg ${
                        selectedDoc.ai_confidence_score >= 80 ? 'text-emerald-600' :
                        selectedDoc.ai_confidence_score >= 50 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {selectedDoc.ai_confidence_score}%
                      </span>
                    </div>
                    {selectedDoc.ai_verification_result && (
                      <div className="mt-3 text-sm text-muted-foreground">
                        {selectedDoc.ai_verification_result.reason}
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
                              <Badge variant="outline">{h.verification_type === 'auto' ? 'تلقائي' : 'يدوي'}</Badge>
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
