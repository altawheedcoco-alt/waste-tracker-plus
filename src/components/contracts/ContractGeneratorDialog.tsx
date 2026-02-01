import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  CalendarIcon, 
  Building2, 
  Loader2,
  Wand2,
  Eye,
  Download,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { ContractTemplate, useContractTemplates, contractCategoryLabels } from '@/hooks/useContractTemplates';
import ContractPreview from './ContractPreview';

interface Partner {
  id: string;
  name: string;
  organization_type: string;
  address?: string;
  phone?: string;
  email?: string;
  commercial_register?: string;
  representative_name?: string;
}

interface ContractGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContractGenerated?: () => void;
}

interface ContractData {
  template: ContractTemplate | null;
  partner: Partner | null;
  contractNumber: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  value: string;
  customTerms: string;
}

const ContractGeneratorDialog = ({ open, onOpenChange, onContractGenerated }: ContractGeneratorDialogProps) => {
  const { organization } = useAuth();
  const { templates, incrementUsage } = useContractTemplates();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const [contractData, setContractData] = useState<ContractData>({
    template: null,
    partner: null,
    contractNumber: '',
    startDate: undefined,
    endDate: undefined,
    value: '',
    customTerms: '',
  });

  useEffect(() => {
    if (open) {
      fetchPartners();
      generateContractNumber();
    }
  }, [open]);

  const fetchPartners = async () => {
    if (!organization?.id) return;
    
    setLoading(true);
    try {
      // Get partners from shipments
      const { data: shipments } = await supabase
        .from('shipments')
        .select('generator_id, recycler_id')
        .or(`transporter_id.eq.${organization.id}`);

      const partnerIds = new Set<string>();
      shipments?.forEach(s => {
        if (s.generator_id) partnerIds.add(s.generator_id);
        if (s.recycler_id) partnerIds.add(s.recycler_id);
      });

      if (partnerIds.size > 0) {
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id, name, organization_type, address, phone, email, commercial_register, representative_name')
          .in('id', Array.from(partnerIds));

        setPartners(orgs || []);
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateContractNumber = () => {
    const prefix = 'CNT';
    const date = format(new Date(), 'yyyyMMdd');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    setContractData(prev => ({ ...prev, contractNumber: `${prefix}-${date}-${random}` }));
  };

  const handleSelectTemplate = (template: ContractTemplate) => {
    setContractData(prev => ({ ...prev, template }));
  };

  const handleSelectPartner = (partnerId: string) => {
    const partner = partners.find(p => p.id === partnerId);
    setContractData(prev => ({ ...prev, partner: partner || null }));
  };

  const handleSaveContract = async () => {
    if (!contractData.template || !contractData.partner || !organization?.id) {
      toast.error('يرجى استكمال جميع البيانات المطلوبة');
      return;
    }

    setSaving(true);
    try {
      const contractInsert = {
        organization_id: organization.id,
        partner_organization_id: contractData.partner.id,
        partner_name: contractData.partner.name,
        title: `${contractData.template.name} - ${contractData.partner.name}`,
        contract_type: contractData.template.contract_category === 'recycling' ? 'recycling' : 'transport',
        status: 'active',
        start_date: contractData.startDate ? format(contractData.startDate, 'yyyy-MM-dd') : null,
        end_date: contractData.endDate ? format(contractData.endDate, 'yyyy-MM-dd') : null,
        value: contractData.value ? parseFloat(contractData.value) : null,
        terms: generateFullContractText(),
      };

      const { error } = await supabase
        .from('contracts')
        .insert(contractInsert as any);

      if (error) throw error;

      await incrementUsage(contractData.template.id);
      toast.success('تم إنشاء العقد بنجاح');
      onContractGenerated?.();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error saving contract:', error);
      toast.error('حدث خطأ أثناء حفظ العقد');
    } finally {
      setSaving(false);
    }
  };

  const generateFullContractText = () => {
    if (!contractData.template) return '';
    
    const t = contractData.template;
    const today = format(new Date(), 'dd/MM/yyyy');
    
    let text = '';
    
    if (t.header_text) text += t.header_text + '\n\n';
    if (t.introduction_text) {
      text += t.introduction_text
        .replace(/\{التاريخ\}/g, today)
        .replace(/\{اسم_الطرف_الأول\}/g, organization?.name || '')
        .replace(/\{اسم_الطرف_الثاني\}/g, contractData.partner?.name || '')
        + '\n\n';
    }
    if (t.terms_template) text += '### الشروط والأحكام\n' + t.terms_template + '\n\n';
    if (t.obligations_party_one) text += '### التزامات الطرف الأول\n' + t.obligations_party_one + '\n\n';
    if (t.obligations_party_two) text += '### التزامات الطرف الثاني\n' + t.obligations_party_two + '\n\n';
    if (t.payment_terms_template) text += '### شروط الدفع\n' + t.payment_terms_template + '\n\n';
    if (t.duration_clause) text += '### مدة العقد\n' + t.duration_clause + '\n\n';
    if (t.termination_clause) text += '### إنهاء العقد\n' + t.termination_clause + '\n\n';
    if (t.dispute_resolution) text += '### فض النزاعات\n' + t.dispute_resolution + '\n\n';
    if (t.closing_text) text += t.closing_text;
    if (contractData.customTerms) text += '\n\n### شروط إضافية\n' + contractData.customTerms;
    
    return text;
  };

  const resetForm = () => {
    setStep(1);
    setContractData({
      template: null,
      partner: null,
      contractNumber: '',
      startDate: undefined,
      endDate: undefined,
      value: '',
      customTerms: '',
    });
    setShowPreview(false);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return contractData.template !== null;
      case 2: return contractData.partner !== null;
      case 3: return true;
      default: return false;
    }
  };

  const filteredTemplates = templates.filter(t => {
    if (!contractData.partner) return true;
    const partnerType = contractData.partner.organization_type;
    if (partnerType === 'generator') return t.partner_type === 'generator' || t.partner_type === 'both';
    if (partnerType === 'recycler') return t.partner_type === 'recycler' || t.partner_type === 'both';
    return true;
  });

  if (showPreview) {
    return (
      <ContractPreview
        open={showPreview}
        onOpenChange={setShowPreview}
        template={contractData.template}
        partner={contractData.partner}
        organization={organization}
        contractNumber={contractData.contractNumber}
        startDate={contractData.startDate}
        endDate={contractData.endDate}
        value={contractData.value}
        customTerms={contractData.customTerms}
        onSave={handleSaveContract}
        saving={saving}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            إنشاء عقد جديد - الخطوة {step} من 3
          </DialogTitle>
          <DialogDescription>
            {step === 1 && 'اختر قالب العقد المناسب'}
            {step === 2 && 'اختر الشريك'}
            {step === 3 && 'أكمل تفاصيل العقد'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 py-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                s === step ? "bg-primary text-primary-foreground" :
                s < step ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}
            >
              {s}
            </div>
          ))}
        </div>

        <ScrollArea className="h-[50vh] px-1">
          {/* Step 1: Select Template */}
          {step === 1 && (
            <div className="space-y-3 py-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">لا توجد قوالب متاحة</p>
                  <p className="text-sm text-muted-foreground">أنشئ قالب عقد أولاً من صفحة قوالب العقود</p>
                </div>
              ) : (
                filteredTemplates.map(template => (
                  <div
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className={cn(
                      "p-4 border rounded-lg cursor-pointer transition-all hover:border-primary/50",
                      contractData.template?.id === template.id && "border-primary bg-primary/5"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-medium">{template.name}</h4>
                        {template.description && (
                          <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {contractCategoryLabels[template.contract_category]}
                        </p>
                      </div>
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 transition-all",
                        contractData.template?.id === template.id 
                          ? "border-primary bg-primary" 
                          : "border-muted-foreground"
                      )} />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Step 2: Select Partner */}
          {step === 2 && (
            <div className="space-y-3 py-4">
              {partners.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">لا يوجد شركاء</p>
                  <p className="text-sm text-muted-foreground">أنشئ شحنات أولاً للحصول على شركاء</p>
                </div>
              ) : (
                partners.map(partner => (
                  <div
                    key={partner.id}
                    onClick={() => handleSelectPartner(partner.id)}
                    className={cn(
                      "p-4 border rounded-lg cursor-pointer transition-all hover:border-primary/50",
                      contractData.partner?.id === partner.id && "border-primary bg-primary/5"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{partner.name}</h4>
                          <span className="text-xs px-2 py-0.5 rounded bg-muted">
                            {partner.organization_type === 'generator' ? 'جهة مولدة' : 'جهة تدوير'}
                          </span>
                        </div>
                        {partner.address && (
                          <p className="text-sm text-muted-foreground mt-1">{partner.address}</p>
                        )}
                        {partner.representative_name && (
                          <p className="text-xs text-muted-foreground mt-1">
                            الممثل القانوني: {partner.representative_name}
                          </p>
                        )}
                      </div>
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 transition-all",
                        contractData.partner?.id === partner.id 
                          ? "border-primary bg-primary" 
                          : "border-muted-foreground"
                      )} />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Step 3: Contract Details */}
          {step === 3 && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>رقم العقد</Label>
                  <Input
                    value={contractData.contractNumber}
                    onChange={(e) => setContractData(prev => ({ ...prev, contractNumber: e.target.value }))}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>قيمة العقد (EGP)</Label>
                  <Input
                    type="number"
                    value={contractData.value}
                    onChange={(e) => setContractData(prev => ({ ...prev, value: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>تاريخ البداية</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-right">
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {contractData.startDate ? format(contractData.startDate, 'PPP', { locale: ar }) : 'اختر التاريخ'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={contractData.startDate}
                        onSelect={(date) => setContractData(prev => ({ ...prev, startDate: date }))}
                        locale={ar}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>تاريخ الانتهاء</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-right">
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {contractData.endDate ? format(contractData.endDate, 'PPP', { locale: ar }) : 'اختر التاريخ'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={contractData.endDate}
                        onSelect={(date) => setContractData(prev => ({ ...prev, endDate: date }))}
                        locale={ar}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>ملخص العقد</Label>
                <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">القالب:</span>
                    <span className="font-medium">{contractData.template?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الشريك:</span>
                    <span className="font-medium">{contractData.partner?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">نوع العقد:</span>
                    <span className="font-medium">
                      {contractData.template && contractCategoryLabels[contractData.template.contract_category]}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="flex-row gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)}>
              <ChevronRight className="w-4 h-4 ml-1" />
              السابق
            </Button>
          )}
          
          <div className="flex-1" />

          {step < 3 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>
              التالي
              <ChevronLeft className="w-4 h-4 mr-1" />
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={() => setShowPreview(true)}
                disabled={!contractData.template || !contractData.partner}
              >
                <Eye className="w-4 h-4 ml-1" />
                معاينة
              </Button>
              <Button 
                onClick={handleSaveContract} 
                disabled={saving || !contractData.template || !contractData.partner}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <FileText className="w-4 h-4 ml-1" />}
                حفظ العقد
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContractGeneratorDialog;
