import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Search,
  Loader2,
  RotateCw,
  Scale,
  Gavel,
  AlertTriangle,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { ScrollArea } from '@/components/ui/scroll-area';

// Import refactored components
import {
  DocumentsTable,
  VerificationStatsGrid,
  DocumentPreviewPanel,
  AILegalAnalysisPanel,
  VerificationHistoryPanel,
  VerificationActionsPanel,
  DocumentInfoGrid,
  useDocumentVerification,
  OrganizationDocument,
  AILegalAnalysis,
} from '@/components/verification';

const DocumentVerification = () => {
  const {
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
  } = useDocumentVerification();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<OrganizationDocument | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [autoVerifying, setAutoVerifying] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<AILegalAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

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

  const runAIAnalysis = async (doc: OrganizationDocument) => {
    setAnalyzing(true);
    setCurrentAnalysis(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const analysis = await analyzeDocumentWithAI(doc);
      setCurrentAnalysis(analysis);

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

      await supabase
        .from('document_verifications')
        .insert([{
          document_id: doc.id,
          organization_id: doc.organization_id,
          verification_type: 'ai_assisted',
          verification_action: 'verify',
          previous_status: doc.verification_status || 'pending',
          new_status: doc.verification_status || 'pending',
          verified_by: user?.id,
          notes: 'تحليل قانوني بالذكاء الاصطناعي: ' + analysis.summary,
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

  const onVerify = async (docId: string, status: 'verified' | 'rejected' | 'requires_review') => {
    setActionLoading(true);
    const success = await handleVerify(docId, status, verificationNotes, rejectionReason);
    if (success) {
      setDialogOpen(false);
      setVerificationNotes('');
      setRejectionReason('');
    }
    setActionLoading(false);
  };

  const onAutoVerify = async () => {
    setAutoVerifying(true);
    await handleAutoVerify();
    setAutoVerifying(false);
  };

  const openDocumentDialog = async (doc: OrganizationDocument) => {
    setSelectedDoc(doc);
    setDialogOpen(true);
    setCurrentAnalysis(null);
    fetchVerificationHistory(doc.id);
    await loadDocumentPreview(doc);
    
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
              onClick={onAutoVerify}
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
        <VerificationStatsGrid stats={stats} onTabChange={setActiveTab} />

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

            <DocumentsTable
              documents={filteredDocuments}
              loading={loading}
              onView={openDocumentDialog}
              onDownload={handleDownload}
              onVerify={(docId, status) => onVerify(docId, status)}
            />
          </CardContent>
        </Card>

        {/* Document Review Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader className="text-right">
              <DialogTitle className="flex items-center gap-2 justify-end">
                <Scale className="w-5 h-5" />
                مراجعة المستند القانونية
              </DialogTitle>
              <DialogDescription>
                مراجعة تفصيلية للمستند مع التحليل القانوني بالذكاء الاصطناعي
              </DialogDescription>
            </DialogHeader>

            {selectedDoc && (
              <ScrollArea className="max-h-[60vh] pr-4">
                <div className="space-y-6">
                  {/* Document Preview */}
                  <DocumentPreviewPanel
                    document={selectedDoc}
                    previewUrl={previewUrl}
                    previewLoading={previewLoading}
                    previewError={previewError}
                    analyzing={analyzing}
                    onDownload={handleDownload}
                    onAnalyze={runAIAnalysis}
                    onPreviewError={setPreviewError}
                  />

                  {/* Document Info */}
                  <DocumentInfoGrid document={selectedDoc} />

                  {/* AI Legal Analysis Results */}
                  {currentAnalysis && (
                    <AILegalAnalysisPanel analysis={currentAnalysis} />
                  )}

                  {/* Verification History */}
                  <VerificationHistoryPanel
                    history={verificationHistory}
                    isOpen={historyOpen}
                    onOpenChange={setHistoryOpen}
                  />

                  {/* Verification Actions */}
                  {(selectedDoc.verification_status === 'pending' || 
                    !selectedDoc.verification_status ||
                    selectedDoc.verification_status === 'requires_review') && (
                    <VerificationActionsPanel
                      verificationNotes={verificationNotes}
                      rejectionReason={rejectionReason}
                      onVerificationNotesChange={setVerificationNotes}
                      onRejectionReasonChange={setRejectionReason}
                    />
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
                    onClick={() => onVerify(selectedDoc.id, 'requires_review')}
                    disabled={actionLoading}
                    className="gap-2"
                  >
                    {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <AlertTriangle className="w-4 h-4" />
                    تحويل للمراجعة
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => onVerify(selectedDoc.id, 'rejected')}
                    disabled={actionLoading || !rejectionReason}
                    className="gap-2"
                  >
                    {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <X className="w-4 h-4" />
                    رفض
                  </Button>
                  <Button
                    onClick={() => onVerify(selectedDoc.id, 'verified')}
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
      </motion.div>
    </DashboardLayout>
  );
};

export default DocumentVerification;
