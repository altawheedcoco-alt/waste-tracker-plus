import { useState } from 'react';
import { useShipmentDocuments, useDocumentTemplates, ShipmentDocSignature } from '@/hooks/useDocumentTemplates';
import { useAuth } from '@/contexts/AuthContext';
import { useMentionableUsers } from '@/hooks/useMentionableUsers';
import { useMentionNotifier } from '@/hooks/useMentionNotifier';
import SignaturePadDialog from './SignaturePadDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Plus,
  CheckCircle2,
  Clock,
  Users,
  PenTool,
  AlertTriangle,
  ArrowDownUp,
  Lock,
  Loader2,
  FileSignature,
  Building2,
  Truck,
  Recycle,
  UserCheck,
  Eye,
  Shield,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ShipmentDocumentsPanelProps {
  shipmentId: string;
  shipmentStatus?: string;
}

const partyIcons: Record<string, typeof Building2> = {
  generator_staff: Building2,
  driver: Truck,
  transporter: Truck,
  recycler: Recycle,
  external: UserCheck,
};

const ShipmentDocumentsPanel = ({ shipmentId, shipmentStatus }: ShipmentDocumentsPanelProps) => {
  const { profile } = useAuth();
  const { documents, isLoading, attachTemplate, signDocument, allMandatoryCompleted } = useShipmentDocuments(shipmentId);
  const { templates } = useDocumentTemplates();
  const { users: mentionableUsers } = useMentionableUsers();
  const { notify: notifyMentions } = useMentionNotifier();
  const [showAttach, setShowAttach] = useState(false);
  const [showSign, setShowSign] = useState<{ sig: ShipmentDocSignature; doc: any } | null>(null);
  const [showPreview, setShowPreview] = useState<any>(null);

  const activeTemplates = templates.filter(t => t.is_active);
  const attachedTemplateIds = documents.map(d => d.template_id);
  const availableTemplates = activeTemplates.filter(t => !attachedTemplateIds.includes(t.id));

  // Find template content for a document
  const getTemplateContent = (templateId: string | null) => {
    if (!templateId) return null;
    return templates.find(t => t.id === templateId)?.content_template || null;
  };

  const handleSign = (data: {
    signerName: string;
    signerTitle: string;
    signerNationalId: string;
    signatureImageUrl: string | null;
    signatureMethod: string;
    notes: string;
  }) => {
    if (!showSign) return;
    signDocument.mutate(
      {
        signatureId: showSign.sig.id,
        signerName: data.signerName,
        signerTitle: data.signerTitle,
        signerNationalId: data.signerNationalId,
        signatureImageUrl: data.signatureImageUrl || undefined,
        signatureMethod: data.signatureMethod,
        notes: data.notes,
      },
      {
        onSuccess: () => {
          if (data.notes.trim()) {
            notifyMentions({
              text: data.notes,
              users: mentionableUsers,
              context: 'توقيع مستند شحنة',
              referenceId: shipmentId,
              referenceType: 'shipment',
            });
          }
          setShowSign(null);
        },
      }
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_progress': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'مكتمل ✓';
      case 'in_progress': return 'قيد التوقيع';
      default: return 'في الانتظار';
    }
  };

  const canSignSlot = (sig: ShipmentDocSignature, doc: any) => {
    if (sig.status === 'signed') return false;
    if (doc.is_sequential) {
      const sigs = doc.signatures || [];
      const prevSigs = sigs.filter((s: ShipmentDocSignature) => s.sign_order < sig.sign_order);
      return prevSigs.every((s: ShipmentDocSignature) => s.status === 'signed' || !s.is_required);
    }
    return true;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="text-right pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {availableTemplates.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => setShowAttach(true)} className="gap-1 h-7 text-xs">
                  <Plus className="w-3 h-3" />
                  إرفاق مستند
                </Button>
              )}
              {!allMandatoryCompleted && documents.some(d => d.is_mandatory) && (
                <Badge variant="destructive" className="text-[10px] gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  توقيعات إلزامية ناقصة
                </Badge>
              )}
            </div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileSignature className="w-5 h-5 text-primary" />
              مستندات التوقيع المتعدد
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>لا توجد مستندات مرفقة بهذه الشحنة</p>
              {availableTemplates.length > 0 && (
                <Button variant="outline" size="sm" className="mt-3 gap-1" onClick={() => setShowAttach(true)}>
                  <Plus className="w-3 h-3" />
                  إرفاق مستند
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map(doc => {
                const progress = doc.total_signatures_required > 0
                  ? (doc.completed_signatures / doc.total_signatures_required) * 100
                  : 0;
                const content = getTemplateContent(doc.template_id);

                return (
                  <div key={doc.id} className="border rounded-lg p-3 space-y-3">
                    {/* Document Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Badge className={`${getStatusColor(doc.status)} text-[10px]`}>
                          {getStatusLabel(doc.status)}
                        </Badge>
                        {doc.status === 'completed' && (
                          <Badge variant="outline" className="text-[9px] gap-0.5">
                            <Shield className="w-2.5 h-2.5" />
                            مُعتمد
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{doc.document_name}</span>
                        {doc.is_mandatory && (
                          <Badge variant="destructive" className="text-[9px]">إلزامي</Badge>
                        )}
                        {doc.is_sequential && (
                          <Badge variant="secondary" className="text-[9px] gap-1">
                            <ArrowDownUp className="w-2.5 h-2.5" />
                            تسلسلي
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Content preview */}
                    {content && (
                      <button
                        className="w-full text-right bg-muted/30 rounded p-2 text-[11px] text-muted-foreground line-clamp-2 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => setShowPreview(doc)}
                      >
                        <Eye className="w-3 h-3 inline-block ml-1" />
                        {content.substring(0, 120)}...
                      </button>
                    )}

                    {/* Progress */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {doc.completed_signatures}/{doc.total_signatures_required}
                      </span>
                      <Progress value={progress} className="h-1.5 flex-1" />
                    </div>

                    {/* Signatures */}
                    <div className="space-y-2">
                      {(doc.signatures || []).map((sig, i) => {
                        const isSigned = sig.status === 'signed';
                        const canSign = canSignSlot(sig, doc);
                        const Icon = partyIcons[sig.party_type || ''] || UserCheck;

                        return (
                          <div
                            key={sig.id}
                            className={`flex items-center justify-between p-2 rounded-md text-sm ${
                              isSigned
                                ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800'
                                : canSign
                                ? 'bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-800'
                                : 'bg-muted/20 border border-muted'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isSigned ? (
                                <div className="flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                                  <span className="text-[10px] text-green-700 dark:text-green-400">تم التوقيع</span>
                                  {sig.signature_image_url && (
                                    <img src={sig.signature_image_url} alt="توقيع" className="h-6 max-w-[60px] object-contain border rounded" />
                                  )}
                                </div>
                              ) : canSign ? (
                                <Button
                                  variant="eco"
                                  size="sm"
                                  className="h-6 text-[10px]"
                                  onClick={() => setShowSign({ sig, doc })}
                                >
                                  <PenTool className="w-3 h-3 ml-1" />
                                  توقيع
                                </Button>
                              ) : (
                                <Badge variant="outline" className="text-[9px] gap-1">
                                  <Lock className="w-2.5 h-2.5" />
                                  ينتظر
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-right">
                              {doc.is_sequential && (
                                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center font-bold">
                                  {i + 1}
                                </span>
                              )}
                              <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                              <div>
                                <span className="font-medium text-xs">{sig.signer_title}</span>
                                {isSigned && (
                                  <p className="text-[10px] text-muted-foreground">
                                    {sig.signer_name} — {sig.signed_at && format(new Date(sig.signed_at), 'dd/MM hh:mm a', { locale: ar })}
                                    {sig.integrity_hash && (
                                      <span className="text-[8px] text-green-600 mr-1" title={`SHA-256: ${sig.integrity_hash}`}>
                                        🔒
                                      </span>
                                    )}
                                  </p>
                                )}
                              </div>
                              {!sig.is_required && (
                                <span className="text-[9px] text-muted-foreground">(اختياري)</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Completed timestamp */}
                    {doc.status === 'completed' && doc.completed_at && (
                      <div className="text-[10px] text-green-700 dark:text-green-400 text-center bg-green-50 dark:bg-green-950/20 rounded p-1.5">
                        ✅ اكتمل في {format(new Date(doc.completed_at), 'dd/MM/yyyy hh:mm a', { locale: ar })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attach Template Dialog */}
      <Dialog open={showAttach} onOpenChange={setShowAttach}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              إرفاق مستند بالشحنة
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[50vh]">
            <div className="space-y-3">
              {availableTemplates.map(template => (
                <Card
                  key={template.id}
                  className="cursor-pointer transition-all hover:shadow-md hover:ring-2 hover:ring-primary/30"
                  onClick={() => {
                    attachTemplate.mutate(template, {
                      onSuccess: () => setShowAttach(false),
                    });
                  }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex gap-1">
                        {template.is_mandatory && <Badge variant="destructive" className="text-[9px]">إلزامي</Badge>}
                        {template.is_sequential && <Badge variant="secondary" className="text-[9px]">تسلسلي</Badge>}
                        {template.auto_attach && <Badge variant="outline" className="text-[9px]">تلقائي</Badge>}
                      </div>
                      <span className="font-semibold text-sm">{template.name}</span>
                    </div>
                    {template.description && (
                      <p className="text-[11px] text-muted-foreground text-right">{template.description}</p>
                    )}
                    <div className="flex items-center gap-1 mt-2 justify-end">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">
                        {(template.signatories || []).length} موقّع
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {availableTemplates.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-6">
                  جميع القوالب مرفقة بالفعل
                </p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Signature Pad Dialog */}
      {showSign && (
        <SignaturePadDialog
          open={!!showSign}
          onOpenChange={(open) => { if (!open) setShowSign(null); }}
          signerTitle={showSign.sig.signer_title}
          documentName={showSign.doc.document_name}
          documentContent={getTemplateContent(showSign.doc.template_id)}
          initialName={profile?.full_name || ''}
          initialTitle={showSign.sig.signer_title}
          mentionableUsers={mentionableUsers}
          isPending={signDocument.isPending}
          onSign={handleSign}
        />
      )}

      {/* Document Content Preview Dialog */}
      <Dialog open={!!showPreview} onOpenChange={(open) => { if (!open) setShowPreview(null); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              محتوى المستند: {showPreview?.document_name}
            </DialogTitle>
          </DialogHeader>
          <div className="bg-white dark:bg-muted/20 border rounded-lg p-4 text-sm whitespace-pre-wrap leading-relaxed">
            {showPreview && getTemplateContent(showPreview.template_id)}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShipmentDocumentsPanel;
