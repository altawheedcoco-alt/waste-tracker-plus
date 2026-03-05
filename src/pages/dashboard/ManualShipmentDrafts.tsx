import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { generateManualShipmentPDF } from '@/utils/manualShipmentPdf';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  FileText, Download, Share2, Printer, Edit, Trash2, Search,
  Loader2, Plus, MessageCircle, Clock, CheckCircle, Send,
  PenTool, Stamp,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import UniversalSignatureDialog from '@/components/signatures/UniversalSignatureDialog';
import { saveDocumentSignature } from '@/components/signatures/signatureService';
import type { SignatureData } from '@/components/signatures/UniversalSignatureDialog';

const ManualShipmentDrafts = () => {
  const { user, organization } = useAuth();
  const navigate = useAppNavigate();
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [signingDraft, setSigningDraft] = useState<any | null>(null);
  const [signLoading, setSignLoading] = useState(false);

  useEffect(() => {
    if (organization?.id) fetchDrafts();
  }, [organization?.id]);

  const fetchDrafts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('manual_shipment_drafts')
      .select('*')
      .eq('organization_id', organization!.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error(error);
      toast.error('فشل في تحميل النماذج');
    } else {
      setDrafts(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('manual_shipment_drafts')
      .delete()
      .eq('id', id);
    if (error) {
      toast.error('فشل في حذف النموذج');
    } else {
      toast.success('تم حذف النموذج');
      setDrafts(prev => prev.filter(d => d.id !== id));
    }
  };

  const handleExportPDF = (draft: any) => {
    generateManualShipmentPDF({
      shipment_number: draft.shipment_number || '',
      generator_name: draft.generator_name || '',
      generator_address: draft.generator_address || '',
      generator_phone: draft.generator_phone || '',
      generator_license: draft.generator_license || '',
      generator_commercial_register: draft.generator_commercial_register || '',
      generator_tax_id: draft.generator_tax_id || '',
      generator_representative: draft.generator_representative || '',
      generator_email: draft.generator_email || '',
      transporter_name: draft.transporter_name || '',
      transporter_address: draft.transporter_address || '',
      transporter_phone: draft.transporter_phone || '',
      transporter_license: draft.transporter_license || '',
      transporter_commercial_register: draft.transporter_commercial_register || '',
      transporter_tax_id: draft.transporter_tax_id || '',
      transporter_representative: draft.transporter_representative || '',
      transporter_email: draft.transporter_email || '',
      destination_name: draft.destination_name || '',
      destination_address: draft.destination_address || '',
      destination_phone: draft.destination_phone || '',
      destination_license: draft.destination_license || '',
      destination_commercial_register: draft.destination_commercial_register || '',
      destination_tax_id: draft.destination_tax_id || '',
      destination_representative: draft.destination_representative || '',
      destination_email: draft.destination_email || '',
      destination_type: draft.destination_type || 'recycling',
      waste_type: draft.waste_type || '',
      waste_description: draft.waste_description || '',
      waste_state: draft.waste_state || 'solid',
      hazard_level: draft.hazard_level || 'non_hazardous',
      quantity: draft.quantity?.toString() || '',
      unit: draft.unit || 'ton',
      packaging_method: draft.packaging_method || '',
      disposal_method: draft.disposal_method || '',
      driver_name: draft.driver_name || '',
      driver_phone: draft.driver_phone || '',
      driver_license: draft.driver_license || '',
      vehicle_plate: draft.vehicle_plate || '',
      vehicle_type: draft.vehicle_type || '',
      pickup_address: draft.pickup_address || '',
      delivery_address: draft.delivery_address || '',
      pickup_date: draft.pickup_date || '',
      delivery_date: draft.delivery_date || '',
      shipment_type: draft.shipment_type || 'regular',
      price: draft.price?.toString() || '',
      price_notes: draft.price_notes || '',
      notes: draft.notes || '',
      special_instructions: draft.special_instructions || '',
    });
  };

  const handleWhatsApp = (draft: any) => {
    const shareUrl = `${window.location.origin}/shared-shipment/${draft.share_code}`;
    const shipmentNo = draft.shipment_number ? ` رقم ${draft.shipment_number}` : '';
    const generator = draft.generator_name ? `\nالمولّد: ${draft.generator_name}` : '';
    const transporter = draft.transporter_name ? `\nالناقل: ${draft.transporter_name}` : '';
    const message = `📋 *نموذج شحنة${shipmentNo}*${generator}${transporter}\n\n🔗 رابط النموذج:\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCopyLink = (draft: any) => {
    const url = `${window.location.origin}/shared-shipment/${draft.share_code}`;
    navigator.clipboard.writeText(url);
    toast.success('تم نسخ الرابط');
  };

  const handleSignDocument = async (data: SignatureData) => {
    if (!signingDraft || !user?.id || !organization?.id) return;
    setSignLoading(true);
    try {
      const result = await saveDocumentSignature({
        signatureData: data,
        documentType: 'shipment',
        documentId: signingDraft.id,
        organizationId: organization.id,
        userId: user.id,
      });
      if (result.success) {
        setSigningDraft(null);
        toast.success('تم توقيع المستند بنجاح', {
          description: result.sealNumber ? `رقم الختم: ${result.sealNumber}` : undefined,
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('فشل في توقيع المستند');
    } finally {
      setSignLoading(false);
    }
  };

  const getStatusBadge = (draft: any) => {
    if (draft.status === 'submitted' || draft.is_submitted) {
      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200"><CheckCircle className="w-3 h-3 ml-1" />تم الإرسال</Badge>;
    }
    return <Badge variant="outline" className="text-amber-600 border-amber-200"><Clock className="w-3 h-3 ml-1" />مسودة</Badge>;
  };

  const filtered = drafts.filter(d => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (d.shipment_number || '').toLowerCase().includes(q) ||
      (d.generator_name || '').toLowerCase().includes(q) ||
      (d.transporter_name || '').toLowerCase().includes(q) ||
      (d.destination_name || '').toLowerCase().includes(q) ||
      (d.waste_type || '').toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-6xl mx-auto" dir="rtl">
        <BackButton />

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 mt-2">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 shadow-sm">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="text-right">
              <h1 className="text-xl font-bold tracking-tight">أرشيف النماذج اليدوية</h1>
              <p className="text-sm text-muted-foreground">
                جميع نماذج الشحنات المحفوظة — عدّل، وقّع، اطبع، أو شارك
              </p>
            </div>
          </div>
          <Button onClick={() => navigate('/dashboard/manual-shipment')} className="gap-2">
            <Plus className="w-4 h-4" />
            نموذج جديد
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ابحث برقم الشحنة، اسم المولد، الناقل..."
            className="pr-10"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <FileText className="w-16 h-16 text-muted-foreground/30" />
              <p className="text-muted-foreground font-medium">
                {searchQuery ? 'لا توجد نتائج مطابقة' : 'لا توجد نماذج محفوظة بعد'}
              </p>
              {!searchQuery && (
                <Button variant="outline" onClick={() => navigate('/dashboard/manual-shipment')} className="gap-2">
                  <Plus className="w-4 h-4" />
                  إنشاء أول نموذج
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {filtered.map(draft => (
              <Card key={draft.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Draft Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm">
                          {draft.shipment_number || 'بدون رقم'}
                        </h3>
                        {getStatusBadge(draft)}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {draft.generator_name && <span>المولّد: {draft.generator_name}</span>}
                        {draft.transporter_name && <span>الناقل: {draft.transporter_name}</span>}
                        {draft.destination_name && <span>الوجهة: {draft.destination_name}</span>}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {draft.waste_type && <span>المخلف: {draft.waste_type}</span>}
                        {draft.quantity && <span>الكمية: {draft.quantity} {draft.unit === 'ton' ? 'طن' : draft.unit === 'kg' ? 'كجم' : draft.unit}</span>}
                      </div>
                      <p className="text-[11px] text-muted-foreground/60">
                        آخر تعديل: {format(new Date(draft.updated_at), 'dd MMM yyyy - hh:mm a', { locale: ar })}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:flex-col sm:items-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs"
                        onClick={() => navigate(`/dashboard/manual-shipment?draft=${draft.id}`)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                        تعديل
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs"
                        onClick={() => handleExportPDF(draft)}
                      >
                        <Download className="w-3.5 h-3.5" />
                        PDF
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs"
                        onClick={() => handleCopyLink(draft)}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        رابط
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                        onClick={() => handleWhatsApp(draft)}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        واتساب
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs"
                        onClick={() => {
                          handleExportPDF(draft);
                          setTimeout(() => window.print(), 500);
                        }}
                      >
                        <Printer className="w-3.5 h-3.5" />
                        طباعة
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs text-primary border-primary/20 hover:bg-primary/5"
                        onClick={() => setSigningDraft(draft)}
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        توقيع
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs text-destructive border-destructive/20 hover:bg-destructive/5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            حذف
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir="rtl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من حذف هذا النموذج؟ لا يمكن التراجع عن هذا الإجراء.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-2">
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(draft.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary */}
        {!loading && drafts.length > 0 && (
          <div className="mt-4 text-center text-xs text-muted-foreground">
            إجمالي النماذج: {drafts.length} — المسودات: {drafts.filter(d => d.status !== 'submitted').length} — المرسلة: {drafts.filter(d => d.status === 'submitted').length}
          </div>
        )}

        {/* Signature Dialog */}
        {signingDraft && (
          <UniversalSignatureDialog
            open={!!signingDraft}
            onOpenChange={(open) => { if (!open) setSigningDraft(null); }}
            onSign={handleSignDocument}
            documentType="shipment"
            documentId={signingDraft.id}
            documentTitle={signingDraft.shipment_number || 'نموذج شحنة يدوي'}
            organizationId={organization?.id || ''}
            signerDefaults={{
              name: user?.user_metadata?.full_name || user?.email || '',
              title: '',
            }}
            loading={signLoading}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default ManualShipmentDrafts;
