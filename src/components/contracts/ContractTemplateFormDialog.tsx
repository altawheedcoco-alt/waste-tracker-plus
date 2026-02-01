import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Plus, 
  Loader2, 
  Building2, 
  Recycle, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  FileText,
  Users,
  Edit3,
  Search
} from 'lucide-react';
import { ContractTemplate, CreateContractTemplateInput } from '@/hooks/useContractTemplates';
import { usePartners } from '@/hooks/usePartners';
import { useAuth } from '@/contexts/AuthContext';

interface PartnerInfo {
  id?: string;
  name: string;
  organization_type: string;
  email: string;
  phone: string;
  secondary_phone?: string;
  city: string;
  region?: string;
  address: string;
  commercial_register?: string;
  environmental_license?: string;
  representative_name?: string;
  representative_phone?: string;
  representative_email?: string;
  representative_position?: string;
  representative_national_id?: string;
  client_code?: string;
}

interface ContractTemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: ContractTemplate | null;
  isEditing?: boolean;
  onSubmit: (data: CreateContractTemplateInput) => Promise<void>;
  saving?: boolean;
}

const ContractTemplateFormDialog = ({
  open,
  onOpenChange,
  template,
  isEditing = false,
  onSubmit,
  saving = false,
}: ContractTemplateFormDialogProps) => {
  const { organization } = useAuth();
  const { generators, recyclers, loading: loadingPartners } = usePartners();
  
  // Partner selection state
  const [partnerSelectionMode, setPartnerSelectionMode] = useState<'select' | 'manual'>('select');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [partnerSearchQuery, setPartnerSearchQuery] = useState('');
  
  // Partner info (either from selection or manual entry)
  const [partnerInfo, setPartnerInfo] = useState<PartnerInfo>({
    name: '',
    organization_type: 'generator',
    email: '',
    phone: '',
    city: '',
    address: '',
  });

  // Form data
  const [formData, setFormData] = useState<CreateContractTemplateInput>({
    name: '',
    description: '',
    partner_type: 'generator',
    contract_category: 'collection_transport',
    header_text: '',
    introduction_text: '',
    terms_template: '',
    obligations_party_one: '',
    obligations_party_two: '',
    payment_terms_template: '',
    duration_clause: '',
    termination_clause: '',
    dispute_resolution: '',
    closing_text: '',
    include_stamp: true,
    include_signature: true,
    include_header_logo: true,
  });

  // Initialize form with template data when editing or duplicating
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        partner_type: template.partner_type,
        contract_category: template.contract_category,
        header_text: template.header_text || '',
        introduction_text: template.introduction_text || '',
        terms_template: template.terms_template || '',
        obligations_party_one: template.obligations_party_one || '',
        obligations_party_two: template.obligations_party_two || '',
        payment_terms_template: template.payment_terms_template || '',
        duration_clause: template.duration_clause || '',
        termination_clause: template.termination_clause || '',
        dispute_resolution: template.dispute_resolution || '',
        closing_text: template.closing_text || '',
        include_stamp: template.include_stamp,
        include_signature: template.include_signature,
        include_header_logo: template.include_header_logo,
      });
    }
  }, [template]);

  // Auto-set contract category based on partner type
  useEffect(() => {
    if (partnerInfo.organization_type === 'recycler') {
      setFormData(prev => ({ ...prev, partner_type: 'recycler', contract_category: 'recycling' }));
    } else if (partnerInfo.organization_type === 'generator') {
      setFormData(prev => ({ ...prev, partner_type: 'generator', contract_category: 'collection_transport' }));
    }
  }, [partnerInfo.organization_type]);

  // Handle partner selection from list
  const handlePartnerSelect = (partnerId: string) => {
    setSelectedPartnerId(partnerId);
    
    // Find partner in generators or recyclers
    const partner = [...generators, ...recyclers].find(p => p.id === partnerId);
    
    if (partner) {
      setPartnerInfo({
        id: partner.id,
        name: partner.name,
        organization_type: partner.organization_type,
        email: partner.email,
        phone: partner.phone,
        secondary_phone: partner.secondary_phone || undefined,
        city: partner.city,
        region: partner.region || undefined,
        address: partner.address,
        commercial_register: partner.commercial_register || undefined,
        environmental_license: partner.environmental_license || undefined,
        representative_name: partner.representative_name || undefined,
        representative_phone: partner.representative_phone || undefined,
        representative_email: partner.representative_email || undefined,
        representative_position: partner.representative_position || undefined,
        representative_national_id: partner.representative_national_id || undefined,
        client_code: partner.client_code || undefined,
      });

      // Generate introduction text with partner details
      const transporterName = organization?.name || '[اسم شركة النقل]';
      const partnerLabel = partner.organization_type === 'generator' ? 'الجهة المولدة' : 'جهة التدوير';
      
      const introText = generateIntroductionText(transporterName, partner, partnerLabel);
      setFormData(prev => ({ ...prev, introduction_text: introText }));
    }
  };

  // Generate introduction text with all party details
  const generateIntroductionText = (transporterName: string, partner: PartnerInfo, partnerLabel: string) => {
    const today = new Date().toLocaleDateString('ar-EG', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Organization data might not have all fields in the type, so we use optional chaining
    const orgData = organization as any;

    return `بسم الله الرحمن الرحيم

عقد ${partner.organization_type === 'recycler' ? 'تدوير ومعالجة المخلفات' : 'جمع ونقل المخلفات'}

إنه في يوم الموافق: ${today}

تم الاتفاق بين كل من:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【 الطرف الأول 】 - شركة النقل
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
الاسم: ${transporterName}
${orgData?.client_code ? `كود العميل: ${orgData.client_code}` : ''}
${orgData?.address ? `العنوان: ${orgData.address}` : ''}
${orgData?.city ? `المدينة: ${orgData.city}` : ''}
${organization?.phone ? `الهاتف: ${organization.phone}` : ''}
${organization?.email ? `البريد الإلكتروني: ${organization.email}` : ''}
${organization?.commercial_register ? `السجل التجاري: ${organization.commercial_register}` : ''}
${organization?.environmental_license ? `الترخيص البيئي: ${organization.environmental_license}` : ''}
${organization?.representative_name ? `ويمثلها: ${organization.representative_name} - ${organization.representative_phone || 'الممثل القانوني'}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【 الطرف الثاني 】 - ${partnerLabel}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
الاسم: ${partner.name}
${partner.client_code ? `كود العميل: ${partner.client_code}` : ''}
العنوان: ${partner.address}
المدينة: ${partner.city}${partner.region ? ` - ${partner.region}` : ''}
الهاتف: ${partner.phone}${partner.secondary_phone ? ` / ${partner.secondary_phone}` : ''}
البريد الإلكتروني: ${partner.email}
${partner.commercial_register ? `السجل التجاري: ${partner.commercial_register}` : ''}
${partner.environmental_license ? `الترخيص البيئي: ${partner.environmental_license}` : ''}
${partner.representative_name ? `ويمثلها: ${partner.representative_name}${partner.representative_position ? ` - ${partner.representative_position}` : ''}` : ''}
${partner.representative_national_id ? `الرقم القومي للممثل: ${partner.representative_national_id}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

وقد اتفق الطرفان على ما يلي:`;
  };

  // Filter partners based on search query
  const filteredGenerators = generators.filter(g => 
    g.name.toLowerCase().includes(partnerSearchQuery.toLowerCase()) ||
    g.client_code?.toLowerCase().includes(partnerSearchQuery.toLowerCase())
  );
  
  const filteredRecyclers = recyclers.filter(r => 
    r.name.toLowerCase().includes(partnerSearchQuery.toLowerCase()) ||
    r.client_code?.toLowerCase().includes(partnerSearchQuery.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('يرجى إدخال اسم القالب');
      return;
    }
    await onSubmit(formData);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      partner_type: 'generator',
      contract_category: 'collection_transport',
      header_text: '',
      introduction_text: '',
      terms_template: '',
      obligations_party_one: '',
      obligations_party_two: '',
      payment_terms_template: '',
      duration_clause: '',
      termination_clause: '',
      dispute_resolution: '',
      closing_text: '',
      include_stamp: true,
      include_signature: true,
      include_header_logo: true,
    });
    setPartnerInfo({
      name: '',
      organization_type: 'generator',
      email: '',
      phone: '',
      city: '',
      address: '',
    });
    setSelectedPartnerId('');
    setPartnerSelectionMode('select');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-4xl max-h-[95vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/30">
          <DialogTitle className="flex items-center gap-2 text-xl">
            {isEditing ? <Edit3 className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
            {isEditing ? 'تعديل قالب العقد' : 'إنشاء قالب عقد جديد'}
          </DialogTitle>
          <DialogDescription className="text-center">
            أنشئ صيغة عقد جديدة لاستخدامها مع الشركاء
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[70vh]">
          <div className="p-6 space-y-6">
            {/* Partner Selection Section */}
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold flex items-center gap-2 text-lg">
                    <Users className="w-5 h-5 text-primary" />
                    اختيار الشريك
                  </h4>
                  <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                    <Button
                      variant={partnerSelectionMode === 'select' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setPartnerSelectionMode('select')}
                    >
                      اختيار من القائمة
                    </Button>
                    <Button
                      variant={partnerSelectionMode === 'manual' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setPartnerSelectionMode('manual')}
                    >
                      إدخال يدوي
                    </Button>
                  </div>
                </div>

                {partnerSelectionMode === 'select' ? (
                  <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="بحث بالاسم أو كود العميل..."
                        value={partnerSearchQuery}
                        onChange={(e) => setPartnerSearchQuery(e.target.value)}
                        className="pr-10"
                      />
                    </div>

                    <Tabs defaultValue="generators" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="generators" className="gap-1">
                          <Building2 className="w-4 h-4" />
                          جهات مولدة ({filteredGenerators.length})
                        </TabsTrigger>
                        <TabsTrigger value="recyclers" className="gap-1">
                          <Recycle className="w-4 h-4" />
                          جهات تدوير ({filteredRecyclers.length})
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="generators" className="mt-3">
                        {loadingPartners ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin" />
                          </div>
                        ) : filteredGenerators.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            لا توجد جهات مولدة متاحة
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                            {filteredGenerators.map(partner => (
                              <motion.div
                                key={partner.id}
                                whileHover={{ scale: 1.02 }}
                                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                  selectedPartnerId === partner.id
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border hover:border-primary/50'
                                }`}
                                onClick={() => handlePartnerSelect(partner.id)}
                              >
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-primary" />
                                  <span className="font-medium truncate">{partner.name}</span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {partner.client_code && <Badge variant="outline" className="text-[10px]">{partner.client_code}</Badge>}
                                  <span className="mr-2">{partner.city}</span>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="recyclers" className="mt-3">
                        {loadingPartners ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin" />
                          </div>
                        ) : filteredRecyclers.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            لا توجد جهات تدوير متاحة
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                            {filteredRecyclers.map(partner => (
                              <motion.div
                                key={partner.id}
                                whileHover={{ scale: 1.02 }}
                                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                  selectedPartnerId === partner.id
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border hover:border-primary/50'
                                }`}
                                onClick={() => handlePartnerSelect(partner.id)}
                              >
                                <div className="flex items-center gap-2">
                                  <Recycle className="w-4 h-4 text-green-600" />
                                  <span className="font-medium truncate">{partner.name}</span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {partner.client_code && <Badge variant="outline" className="text-[10px]">{partner.client_code}</Badge>}
                                  <span className="mr-2">{partner.city}</span>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>

                    {/* Selected Partner Preview */}
                    {selectedPartnerId && partnerInfo.name && (
                      <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <h5 className="font-medium mb-3 flex items-center gap-2">
                          {partnerInfo.organization_type === 'generator' ? (
                            <Building2 className="w-4 h-4 text-primary" />
                          ) : (
                            <Recycle className="w-4 h-4 text-green-600" />
                          )}
                          بيانات الشريك المختار
                        </h5>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3 text-muted-foreground" />
                            <span>{partnerInfo.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            <span dir="ltr">{partnerInfo.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3 text-muted-foreground" />
                            <span className="truncate">{partnerInfo.email}</span>
                          </div>
                          <div className="flex items-center gap-2 col-span-2">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            <span>{partnerInfo.city} - {partnerInfo.address}</span>
                          </div>
                          {partnerInfo.representative_name && (
                            <div className="flex items-center gap-2">
                              <Users className="w-3 h-3 text-muted-foreground" />
                              <span>الممثل: {partnerInfo.representative_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Manual Entry Fields */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>نوع الشريك *</Label>
                        <Select
                          value={partnerInfo.organization_type}
                          onValueChange={(value) => setPartnerInfo({ ...partnerInfo, organization_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="generator">جهة مولدة</SelectItem>
                            <SelectItem value="recycler">جهة تدوير</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>اسم الشريك *</Label>
                        <Input
                          value={partnerInfo.name}
                          onChange={(e) => setPartnerInfo({ ...partnerInfo, name: e.target.value })}
                          placeholder="اسم الجهة الشريكة"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>البريد الإلكتروني</Label>
                        <Input
                          type="email"
                          value={partnerInfo.email}
                          onChange={(e) => setPartnerInfo({ ...partnerInfo, email: e.target.value })}
                          placeholder="email@example.com"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>رقم الهاتف</Label>
                        <Input
                          value={partnerInfo.phone}
                          onChange={(e) => setPartnerInfo({ ...partnerInfo, phone: e.target.value })}
                          placeholder="01xxxxxxxxx"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>المدينة</Label>
                        <Input
                          value={partnerInfo.city}
                          onChange={(e) => setPartnerInfo({ ...partnerInfo, city: e.target.value })}
                          placeholder="المدينة"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>المنطقة</Label>
                        <Input
                          value={partnerInfo.region || ''}
                          onChange={(e) => setPartnerInfo({ ...partnerInfo, region: e.target.value })}
                          placeholder="المنطقة / الحي"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>العنوان التفصيلي</Label>
                      <Input
                        value={partnerInfo.address}
                        onChange={(e) => setPartnerInfo({ ...partnerInfo, address: e.target.value })}
                        placeholder="العنوان الكامل"
                      />
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>السجل التجاري</Label>
                        <Input
                          value={partnerInfo.commercial_register || ''}
                          onChange={(e) => setPartnerInfo({ ...partnerInfo, commercial_register: e.target.value })}
                          placeholder="رقم السجل التجاري"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>الترخيص البيئي</Label>
                        <Input
                          value={partnerInfo.environmental_license || ''}
                          onChange={(e) => setPartnerInfo({ ...partnerInfo, environmental_license: e.target.value })}
                          placeholder="رقم الترخيص البيئي"
                        />
                      </div>
                    </div>

                    <Separator />

                    <h5 className="font-medium text-sm">بيانات الممثل القانوني</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>اسم الممثل</Label>
                        <Input
                          value={partnerInfo.representative_name || ''}
                          onChange={(e) => setPartnerInfo({ ...partnerInfo, representative_name: e.target.value })}
                          placeholder="الاسم الكامل"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>المنصب</Label>
                        <Input
                          value={partnerInfo.representative_position || ''}
                          onChange={(e) => setPartnerInfo({ ...partnerInfo, representative_position: e.target.value })}
                          placeholder="المنصب الوظيفي"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>هاتف الممثل</Label>
                        <Input
                          value={partnerInfo.representative_phone || ''}
                          onChange={(e) => setPartnerInfo({ ...partnerInfo, representative_phone: e.target.value })}
                          placeholder="01xxxxxxxxx"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>الرقم القومي</Label>
                        <Input
                          value={partnerInfo.representative_national_id || ''}
                          onChange={(e) => setPartnerInfo({ ...partnerInfo, representative_national_id: e.target.value })}
                          placeholder="الرقم القومي (14 رقم)"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    {/* Generate intro button for manual entry */}
                    {partnerInfo.name && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => {
                          const transporterName = organization?.name || '[اسم شركة النقل]';
                          const partnerLabel = partnerInfo.organization_type === 'generator' ? 'الجهة المولدة' : 'جهة التدوير';
                          const introText = generateIntroductionText(transporterName, partnerInfo, partnerLabel);
                          setFormData(prev => ({ ...prev, introduction_text: introText }));
                          toast.success('تم توليد المقدمة بنجاح');
                        }}
                      >
                        <FileText className="w-4 h-4" />
                        توليد المقدمة ببيانات الطرفين
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Separator />

            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="font-semibold border-b pb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                المعلومات الأساسية
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم القالب *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: عقد جمع النفايات الصناعية"
                    className="text-center"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>نوع الشريك</Label>
                  <Select
                    value={formData.partner_type}
                    onValueChange={(value: any) => setFormData({ ...formData, partner_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="generator">جهات مولدة</SelectItem>
                      <SelectItem value="recycler">جهات تدوير</SelectItem>
                      <SelectItem value="both">جميع الجهات</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>تصنيف العقد</Label>
                  <Select
                    value={formData.contract_category}
                    onValueChange={(value: any) => setFormData({ ...formData, contract_category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="collection">عقد جمع</SelectItem>
                      <SelectItem value="transport">عقد نقل</SelectItem>
                      <SelectItem value="collection_transport">عقد جمع ونقل</SelectItem>
                      <SelectItem value="recycling">عقد تدوير</SelectItem>
                      <SelectItem value="other">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>وصف القالب</Label>
                  <Input
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="وصف مختصر للقالب..."
                    className="text-center"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Contract Content */}
            <div className="space-y-4">
              <h4 className="font-semibold border-b pb-2">محتوى العقد</h4>

              <div className="space-y-2">
                <Label>ترويسة العقد</Label>
                <Textarea
                  value={formData.header_text || ''}
                  onChange={(e) => setFormData({ ...formData, header_text: e.target.value })}
                  placeholder="عنوان وترويسة العقد الرسمية..."
                  className="min-h-[60px] text-center"
                />
              </div>

              <div className="space-y-2">
                <Label>المقدمة وبيانات الأطراف</Label>
                <Textarea
                  value={formData.introduction_text || ''}
                  onChange={(e) => setFormData({ ...formData, introduction_text: e.target.value })}
                  placeholder="تمهيد العقد وبيان أطرافه (الطرف الأول والطرف الثاني)..."
                  className="min-h-[200px] text-center leading-relaxed"
                />
              </div>

              <div className="space-y-2">
                <Label>البنود والشروط العامة</Label>
                <Textarea
                  value={formData.terms_template || ''}
                  onChange={(e) => setFormData({ ...formData, terms_template: e.target.value })}
                  placeholder="البنود والشروط العامة للعقد..."
                  className="min-h-[100px] text-center"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>التزامات الطرف الأول (الناقل)</Label>
                  <Textarea
                    value={formData.obligations_party_one || ''}
                    onChange={(e) => setFormData({ ...formData, obligations_party_one: e.target.value })}
                    placeholder="التزامات شركة النقل..."
                    className="min-h-[100px] text-center"
                  />
                </div>

                <div className="space-y-2">
                  <Label>التزامات الطرف الثاني (الشريك)</Label>
                  <Textarea
                    value={formData.obligations_party_two || ''}
                    onChange={(e) => setFormData({ ...formData, obligations_party_two: e.target.value })}
                    placeholder="التزامات الطرف الآخر..."
                    className="min-h-[100px] text-center"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>شروط الدفع والمقابل المادي</Label>
                <Textarea
                  value={formData.payment_terms_template || ''}
                  onChange={(e) => setFormData({ ...formData, payment_terms_template: e.target.value })}
                  placeholder="شروط وطريقة الدفع..."
                  className="min-h-[80px] text-center"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>مدة العقد</Label>
                  <Textarea
                    value={formData.duration_clause || ''}
                    onChange={(e) => setFormData({ ...formData, duration_clause: e.target.value })}
                    placeholder="مدة سريان العقد وشروط التجديد..."
                    className="min-h-[80px] text-center"
                  />
                </div>

                <div className="space-y-2">
                  <Label>شروط الإنهاء</Label>
                  <Textarea
                    value={formData.termination_clause || ''}
                    onChange={(e) => setFormData({ ...formData, termination_clause: e.target.value })}
                    placeholder="شروط وإجراءات إنهاء العقد..."
                    className="min-h-[80px] text-center"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>حل النزاعات</Label>
                <Textarea
                  value={formData.dispute_resolution || ''}
                  onChange={(e) => setFormData({ ...formData, dispute_resolution: e.target.value })}
                  placeholder="آلية حل النزاعات والاختصاص القضائي..."
                  className="min-h-[60px] text-center"
                />
              </div>

              <div className="space-y-2">
                <Label>الختام والتوقيعات</Label>
                <Textarea
                  value={formData.closing_text || ''}
                  onChange={(e) => setFormData({ ...formData, closing_text: e.target.value })}
                  placeholder="نص الختام قبل التوقيعات..."
                  className="min-h-[60px] text-center"
                />
              </div>
            </div>

            <Separator />

            {/* Settings */}
            <div className="space-y-4 bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium">إعدادات القالب</h4>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center justify-between">
                  <Label>شعار الشركة</Label>
                  <Switch
                    checked={formData.include_header_logo}
                    onCheckedChange={(checked) => setFormData({ ...formData, include_header_logo: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>الختم</Label>
                  <Switch
                    checked={formData.include_stamp}
                    onCheckedChange={(checked) => setFormData({ ...formData, include_stamp: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>التوقيع</Label>
                  <Switch
                    checked={formData.include_signature}
                    onCheckedChange={(checked) => setFormData({ ...formData, include_signature: checked })}
                  />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={saving} className="gap-2">
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            {isEditing ? 'حفظ التعديلات' : 'إنشاء القالب'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContractTemplateFormDialog;
