import { useState } from 'react';
import { useShipmentDocuments, useDocumentTemplates, ShipmentDocSignature } from '@/hooks/useDocumentTemplates';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
  const [showAttach, setShowAttach] = useState(false);
  const [showSign, setShowSign] = useState<ShipmentDocSignature | null>(null);
  const [signerName, setSignerName] = useState('');
  const [signerTitle, setSignerTitle] = useState('');
  const [signerNationalId, setSignerNationalId] = useState('');

  const activeTemplates = templates.filter(t => t.is_active);
  const attachedTemplateIds = documents.map(d => d.template_id);
  const availableTemplates = activeTemplates.filter(t => !attachedTemplateIds.includes(t.id));

  const handleSign = () => {
    if (!showSign || !signerName.trim()) return;
    signDocument.mutate(
      {
        signatureId: showSign.id,
        signerName: signerName,
        signerTitle: signerTitle || showSign.signer_title,
        signerNationalId: signerNationalId,
        signatureMethod: 'click_approve',
      },
      {
        onSuccess: () => {
          setShowSign(null);
          setSignerName('');
          setSignerTitle('');
          setSignerNationalId('');
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

                return (
                  <div key={doc.id} className="border rounded-lg p-3 space-y-3">
                    {/* Document Header */}
                    <div className="flex items-center justify-between">
                      <Badge className={`${getStatusColor(doc.status)} text-[10px]`}>
                        {getStatusLabel(doc.status)}
                      </Badge>
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
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-[10px] text-green-700 dark:text-green-400"
                                  disabled
                                >
                                  <CheckCircle2 className="w-3 h-3 ml-1" />
                                  تم التوقيع
                                </Button>
                              ) : canSign ? (
                                <Button
                                  variant="eco"
                                  size="sm"
                                  className="h-6 text-[10px]"
                                  onClick={() => {
                                    setSignerName(profile?.full_name || '');
                                    setSignerTitle(sig.signer_title);
                                    setShowSign(sig);
                                  }}
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
                                    {sig.signer_name} — {sig.signed_at && format(new Date(sig.signed_at), 'dd/MM HH:mm', { locale: ar })}
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

      {/* Sign Dialog */}
      <Dialog open={!!showSign} onOpenChange={open => { if (!open) setShowSign(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenTool className="w-5 h-5 text-primary" />
              توقيع المستند
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4" dir="rtl">
            <div className="bg-muted/50 rounded-lg p-3 text-sm text-center">
              <p className="font-medium">{showSign?.signer_title}</p>
            </div>
            <div className="space-y-2">
              <Label>الاسم الكامل *</Label>
              <Input value={signerName} onChange={e => setSignerName(e.target.value)} dir="rtl" />
            </div>
            <div className="space-y-2">
              <Label>المسمى الوظيفي</Label>
              <Input value={signerTitle} onChange={e => setSignerTitle(e.target.value)} dir="rtl" />
            </div>
            <div className="space-y-2">
              <Label>الرقم القومي (اختياري)</Label>
              <Input value={signerNationalId} onChange={e => setSignerNationalId(e.target.value)} dir="ltr" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSign(null)}>إلغاء</Button>
            <Button
              onClick={handleSign}
              disabled={!signerName.trim() || signDocument.isPending}
              className="gap-2"
            >
              {signDocument.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <CheckCircle2 className="w-4 h-4" />
              تأكيد التوقيع
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShipmentDocumentsPanel;
