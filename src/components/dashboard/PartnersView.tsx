import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import ClickableImage from '@/components/ui/ClickableImage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Building2, Factory, Recycle, Truck, Trash2, Search, Eye, Phone, Mail,
  MapPin, User, FileText, Download, Loader2, StickyNote, Info, Package,
  Users, ChevronLeft, ExternalLink, Globe,
} from 'lucide-react';
import PartnerNotesDialog from '@/components/partners/PartnerNotesDialog';
import MemberNameLink from '@/components/org-structure/MemberNameLink';
import PartnerLinkingCard from '@/components/partners/PartnerLinkingCard';
import PartnerRestrictionManager from '@/components/partners/PartnerRestrictionManager';
import usePartners from '@/hooks/usePartners';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import BusinessPagePreview from '@/components/organization/BusinessPagePreview';

interface Organization {
  id: string;
  name: string;
  name_en: string | null;
  organization_type: string;
  email: string;
  phone: string;
  secondary_phone: string | null;
  city: string;
  region: string | null;
  address: string;
  commercial_register: string | null;
  environmental_license: string | null;
  activity_type: string | null;
  production_capacity: string | null;
  representative_name: string | null;
  representative_phone: string | null;
  representative_email: string | null;
  representative_position: string | null;
  representative_national_id: string | null;
  delegate_name: string | null;
  delegate_phone: string | null;
  delegate_email: string | null;
  delegate_national_id: string | null;
  agent_name: string | null;
  agent_phone: string | null;
  agent_email: string | null;
  agent_national_id: string | null;
  logo_url: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  client_code: string | null;
}

interface Document {
  id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  created_at: string;
}

type FilterType = 'all' | 'generator' | 'transporter' | 'recycler' | 'disposal';

const typeConfig: Record<string, { label: string; icon: typeof Factory; color: string }> = {
  generator: { label: 'منشأة مولدة', icon: Factory, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
  transporter: { label: 'جهة ناقلة', icon: Truck, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
  recycler: { label: 'جهة معالجة', icon: Recycle, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
  disposal: { label: 'جهة تخلص نهائي', icon: Trash2, color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
};

const PartnersView = () => {
  const navigate = useNavigate();
  const { organization } = useAuth();
  const { generators, transporters, recyclers, loading } = usePartners();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [notesPartner, setNotesPartner] = useState<{ id: string; name: string } | null>(null);
  const [businessPageOrg, setBusinessPageOrg] = useState<Organization | null>(null);

  // Fetch documents for selected org
  const { data: orgDocuments = [], isLoading: loadingDocs } = useQuery({
    queryKey: ['org-documents', selectedOrg?.id],
    queryFn: async () => {
      if (!selectedOrg?.id) return [];
      const { data, error } = await supabase
        .from('organization_documents')
        .select('*')
        .eq('organization_id', selectedOrg.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedOrg?.id,
  });

  // Fetch full org data for business page preview
  const { data: businessPageOrgData } = useQuery({
    queryKey: ['business-page-org-data', businessPageOrg?.id],
    queryFn: async () => {
      if (!businessPageOrg?.id) return null;
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', businessPageOrg.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!businessPageOrg?.id,
  });

  // Fetch stats for selected org
  const { data: orgStats } = useQuery({
    queryKey: ['partner-stats', selectedOrg?.id],
    queryFn: async () => {
      if (!selectedOrg?.id) return null;
      const [shipmentsRes, employeesRes] = await Promise.all([
        supabase.from('shipments').select('id', { count: 'exact', head: true })
          .or(`generator_id.eq.${selectedOrg.id},transporter_id.eq.${selectedOrg.id},recycler_id.eq.${selectedOrg.id}`),
        supabase.from('profiles').select('id', { count: 'exact', head: true })
          .eq('organization_id', selectedOrg.id),
      ]);
      return {
        shipmentsCount: shipmentsRes.count || 0,
        employeesCount: employeesRes.count || 0,
      };
    },
    enabled: !!selectedOrg?.id,
  });

  const allPartners = [...generators, ...transporters, ...recyclers];

  const filteredPartners = allPartners.filter(org => {
    const matchesSearch = !searchTerm ||
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (org.client_code && org.client_code.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || org.organization_type === filterType;
    return matchesSearch && matchesType;
  });

  const counts = {
    all: allPartners.length,
    generator: generators.length,
    transporter: transporters.length,
    recycler: recyclers.length,
    disposal: allPartners.filter(o => o.organization_type === 'disposal').length,
  };

  const handleDownloadDocument = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('organization-documents')
        .download(doc.file_path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      toast.error('فشل في تحميل الوثيقة');
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      commercial_register: 'السجل التجاري',
      environmental_license: 'الترخيص البيئي',
      representative_id: 'هوية الممثل القانوني',
      delegate_id: 'هوية المفوض',
      agent_id: 'هوية الوكيل',
      other: 'وثيقة أخرى',
    };
    return labels[type] || type;
  };

  const filterButtons: { key: FilterType; label: string; icon: typeof Building2 }[] = [
    { key: 'all', label: 'الكل', icon: Building2 },
    { key: 'generator', label: 'مولدة', icon: Factory },
    { key: 'transporter', label: 'ناقلة', icon: Truck },
    { key: 'recycler', label: 'معالجة', icon: Recycle },
    { key: 'disposal', label: 'تخلص', icon: Trash2 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="text-right">
        <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2 justify-end">
          <span className="truncate">شركائي</span>
          <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
        </h1>
        <p className="text-xs sm:text-base text-muted-foreground">
          الجهات المرتبطة ({allPartners.length} شريك)
        </p>
      </div>

      {/* Partner Linking Card */}
      <PartnerLinkingCard />

      {allPartners.length === 0 && (
        <div className="bg-muted/50 border rounded-lg p-3 sm:p-4 flex items-start gap-2.5 sm:gap-3">
          <Info className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground mt-0.5 shrink-0" />
          <div className="text-right min-w-0">
            <p className="font-medium text-sm sm:text-base">لا يوجد جهات مرتبطة بعد</p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              يمكنك ربط جهات جديدة باستخدام كود التحقق أعلاه.
            </p>
          </div>
        </div>
      )}

      {/* Main Layout: Sidebar + Detail */}
      {allPartners.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-h-[400px] sm:min-h-[600px]">
          {/* Sidebar - Organization List */}
          <div className="lg:col-span-1 space-y-3">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث بالاسم أو المدينة..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pr-10"
                    dir="rtl"
                  />
                </div>
                {/* Filter buttons */}
                <div className="flex gap-1 sm:gap-1.5 mt-2 sm:mt-3 overflow-x-auto scrollbar-hide pb-0.5">
                  {filterButtons.map(fb => {
                    const count = counts[fb.key];
                    if (fb.key !== 'all' && count === 0) return null;
                    const Icon = fb.icon;
                    return (
                      <Button
                        key={fb.key}
                        variant={filterType === fb.key ? 'default' : 'outline'}
                        size="sm"
                        className="gap-0.5 sm:gap-1 text-[10px] sm:text-xs shrink-0 h-7 px-2 sm:px-2.5 touch-manipulation"
                        onClick={() => setFilterType(fb.key)}
                      >
                        <Icon className="h-3 w-3" />
                        {fb.label} ({count})
                      </Button>
                    );
                  })}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-1 px-3 pb-3">
                    {filteredPartners.map(org => {
                      const config = typeConfig[org.organization_type] || typeConfig.generator;
                      const Icon = config.icon;
                      const isSelected = selectedOrg?.id === org.id;

                      return (
                        <motion.div
                          key={org.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedOrg(org)}
                          className={`p-3 rounded-lg cursor-pointer transition-all border ${
                            isSelected
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-transparent hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <ChevronLeft className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0 text-right">
                              <div className="flex items-center gap-1.5 justify-end">
                                {org.is_verified && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5">موثق</Badge>
                                )}
                                {org.client_code && (
                                  <Badge variant="outline" className="text-[10px] font-mono px-1.5">{org.client_code}</Badge>
                                )}
                                <p className="font-medium truncate text-sm">{org.name}</p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {config.label} • {org.city || '—'}
                              </p>
                            </div>
                            <ClickableImage src={org.logo_url || ''} protected>
                              <Avatar className="w-9 h-9 shrink-0">
                                <AvatarImage src={org.logo_url || undefined} />
                                <AvatarFallback className={`${config.color} text-xs`}>
                                  <Icon className="w-4 h-4" />
                                </AvatarFallback>
                              </Avatar>
                            </ClickableImage>
                          </div>
                        </motion.div>
                      );
                    })}

                    {filteredPartners.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">لا توجد جهات مطابقة</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {selectedOrg ? (
                <motion.div
                  key={selectedOrg.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <PartnerDetailPanel
                    org={selectedOrg}
                    stats={orgStats}
                    documents={orgDocuments as Document[]}
                    loadingDocs={loadingDocs}
                    onDownloadDoc={handleDownloadDocument}
                    getDocTypeLabel={getDocumentTypeLabel}
                    onViewProfile={() => navigate(`/dashboard/organization/${selectedOrg.id}`)}
                    onViewBusinessPage={() => setBusinessPageOrg(selectedOrg)}
                    onOpenNotes={() => {
                      setNotesPartner({ id: selectedOrg.id, name: selectedOrg.name });
                      setShowNotesDialog(true);
                    }}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full text-center text-muted-foreground border rounded-lg bg-muted/20 min-h-[500px]"
                >
                  <Building2 className="w-16 h-16 mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-1">اختر جهة من القائمة</p>
                  <p className="text-sm">اضغط على أي شريك لعرض تفاصيله الكاملة</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Partner Notes Dialog */}
      {notesPartner && (
        <PartnerNotesDialog
          open={showNotesDialog}
          onOpenChange={setShowNotesDialog}
          partnerId={notesPartner.id}
          partnerName={notesPartner.name}
        />
      )}

      {/* Business Page Preview Dialog */}
      <Dialog open={!!businessPageOrg} onOpenChange={(open) => !open && setBusinessPageOrg(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center gap-2 justify-end">
              <span>صفحة المنظمة - {businessPageOrg?.name}</span>
              <Globe className="w-5 h-5 text-primary" />
            </DialogTitle>
          </DialogHeader>
          {businessPageOrg && businessPageOrgData && (
            <div className="p-4 pt-0">
              <BusinessPagePreview
                organizationId={businessPageOrg.id}
                organizationName={businessPageOrg.name}
                orgData={businessPageOrgData}
                isOwnPage={false}
              />
            </div>
          )}
          {businessPageOrg && !businessPageOrgData && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ─── Detail Panel Component ─── */
interface PartnerDetailPanelProps {
  org: Organization;
  stats: { shipmentsCount: number; employeesCount: number } | null | undefined;
  documents: Document[];
  loadingDocs: boolean;
  onDownloadDoc: (doc: Document) => void;
  getDocTypeLabel: (type: string) => string;
  onViewProfile: () => void;
  onViewBusinessPage: () => void;
  onOpenNotes: () => void;
}

const PartnerDetailPanel = ({
  org, stats, documents, loadingDocs, onDownloadDoc, getDocTypeLabel, onViewProfile, onViewBusinessPage, onOpenNotes,
}: PartnerDetailPanelProps) => {
  const config = typeConfig[org.organization_type] || typeConfig.generator;
  const Icon = config.icon;

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex-1 text-right">
            <h2 className="text-xl font-bold">{org.name}</h2>
            {org.name_en && <p className="text-muted-foreground text-sm">{org.name_en}</p>}
            <div className="flex items-center gap-2 mt-2 justify-end">
              <Badge className={config.color}>{config.label}</Badge>
              {org.is_verified && <Badge variant="secondary">موثق ✓</Badge>}
              {org.client_code && <Badge variant="outline" className="font-mono">{org.client_code}</Badge>}
            </div>
          </div>
          <Avatar className="w-16 h-16">
            <AvatarImage src={org.logo_url || undefined} />
            <AvatarFallback className={`${config.color} text-2xl`}>
              <Icon className="w-8 h-8" />
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3 text-center bg-muted/30">
              <Package className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-lg font-bold">{stats.shipmentsCount}</p>
              <p className="text-xs text-muted-foreground">شحنة مشتركة</p>
            </Card>
            <Card className="p-3 text-center bg-muted/30">
              <Users className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-lg font-bold">{stats.employeesCount}</p>
              <p className="text-xs text-muted-foreground">موظف</p>
            </Card>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          <Button onClick={onViewProfile} className="gap-2">
            <Eye className="w-4 h-4" /> عرض الملف الكامل
          </Button>
          <Button variant="secondary" onClick={onOpenNotes} className="gap-2">
            <StickyNote className="w-4 h-4" /> الملاحظات
          </Button>
          <Button variant="outline" onClick={onViewBusinessPage} className="gap-2">
            <Globe className="w-4 h-4" /> صفحة المنظمة
          </Button>
          <PartnerRestrictionManager targetOrgId={org.id} targetOrgName={org.name} />
        </div>

        <Separator />

        {/* Contact & Address */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-muted/30 rounded-lg space-y-2 text-right">
            <h3 className="font-bold text-sm flex items-center gap-2 justify-end">
              معلومات التواصل <Phone className="w-4 h-4" />
            </h3>
            <p className="text-sm"><span className="text-muted-foreground">البريد:</span> {org.email}</p>
            <p className="text-sm"><span className="text-muted-foreground">الهاتف:</span> <span dir="ltr">{org.phone}</span></p>
            {org.secondary_phone && (
              <p className="text-sm"><span className="text-muted-foreground">ثانوي:</span> <span dir="ltr">{org.secondary_phone}</span></p>
            )}
          </div>
          <div className="p-4 bg-muted/30 rounded-lg space-y-2 text-right">
            <h3 className="font-bold text-sm flex items-center gap-2 justify-end">
              العنوان <MapPin className="w-4 h-4" />
            </h3>
            <p className="text-sm"><span className="text-muted-foreground">المدينة:</span> {org.city}</p>
            {org.region && <p className="text-sm"><span className="text-muted-foreground">المنطقة:</span> {org.region}</p>}
            <p className="text-sm"><span className="text-muted-foreground">العنوان:</span> {org.address}</p>
          </div>
        </div>

        {/* Business Info */}
        {(org.commercial_register || org.environmental_license || org.activity_type) && (
          <div className="p-4 bg-muted/30 rounded-lg space-y-2 text-right">
            <h3 className="font-bold text-sm flex items-center gap-2 justify-end">
              معلومات تجارية <FileText className="w-4 h-4" />
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {org.commercial_register && <p><span className="text-muted-foreground">السجل التجاري:</span> {org.commercial_register}</p>}
              {org.environmental_license && <p><span className="text-muted-foreground">الترخيص البيئي:</span> {org.environmental_license}</p>}
              {org.activity_type && <p><span className="text-muted-foreground">نوع النشاط:</span> {org.activity_type}</p>}
              {org.production_capacity && <p><span className="text-muted-foreground">الطاقة الإنتاجية:</span> {org.production_capacity}</p>}
            </div>
          </div>
        )}

        {/* Representatives */}
        {org.representative_name && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg space-y-2 text-right">
            <h3 className="font-bold text-sm flex items-center gap-2 justify-end text-blue-700 dark:text-blue-400">
              الممثل القانوني <User className="w-4 h-4" />
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p><span className="text-muted-foreground">الاسم:</span> <MemberNameLink name={org.representative_name!} email={org.representative_email} showIcon className="font-semibold" /></p>
              {org.representative_position && <p><span className="text-muted-foreground">المنصب:</span> {org.representative_position}</p>}
              {org.representative_phone && <p><span className="text-muted-foreground">الهاتف:</span> <span dir="ltr">{org.representative_phone}</span></p>}
              {org.representative_email && <p><span className="text-muted-foreground">البريد:</span> {org.representative_email}</p>}
            </div>
          </div>
        )}

        {org.delegate_name && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg space-y-2 text-right">
            <h3 className="font-bold text-sm flex items-center gap-2 justify-end text-amber-700 dark:text-amber-400">
              المفوض <User className="w-4 h-4" />
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p><span className="text-muted-foreground">الاسم:</span> <MemberNameLink name={org.delegate_name!} email={org.delegate_email} showIcon className="font-semibold" /></p>
              {org.delegate_phone && <p><span className="text-muted-foreground">الهاتف:</span> <span dir="ltr">{org.delegate_phone}</span></p>}
              {org.delegate_email && <p><span className="text-muted-foreground">البريد:</span> {org.delegate_email}</p>}
            </div>
          </div>
        )}

        {/* Documents */}
        <div className="p-4 bg-muted/30 rounded-lg space-y-3 text-right">
          <h3 className="font-bold text-sm flex items-center gap-2 justify-end">
            الوثائق القانونية <FileText className="w-4 h-4" />
          </h3>
          {loadingDocs ? (
            <div className="text-center py-4"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
          ) : documents.length === 0 ? (
            <p className="text-muted-foreground text-center py-4 text-sm">لا توجد وثائق مرفوعة</p>
          ) : (
            <div className="space-y-2">
              {documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-background rounded border">
                  <Button variant="ghost" size="sm" onClick={() => onDownloadDoc(doc)}>
                    <Download className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="font-medium text-sm">{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground">{getDocTypeLabel(doc.document_type)}</p>
                    </div>
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PartnersView;
