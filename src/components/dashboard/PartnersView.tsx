import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Building2,
  Factory,
  Recycle,
  Truck,
  Search,
  Eye,
  Phone,
  Mail,
  MapPin,
  User,
  FileText,
  Download,
  Loader2,
  MessageCircle,
  ExternalLink,
  StickyNote,
  Info,
} from 'lucide-react';
import PartnerNotesDialog from '@/components/partners/PartnerNotesDialog';
import PartnerLinkingCard from '@/components/partners/PartnerLinkingCard';
import usePartners from '@/hooks/usePartners';
import { useAuth } from '@/contexts/AuthContext';

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

const PartnersView = () => {
  const navigate = useNavigate();
  const { organization } = useAuth();
  const { generators, transporters, recyclers, loading, error } = usePartners();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [orgDocuments, setOrgDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [notesPartner, setNotesPartner] = useState<{ id: string; name: string } | null>(null);

  const fetchOrgDocuments = async (orgId: string) => {
    setLoadingDocs(true);
    try {
      const { data, error } = await supabase
        .from('organization_documents')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrgDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('فشل في تحميل الوثائق');
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleViewProfile = async (org: Organization) => {
    setSelectedOrg(org);
    setShowProfileDialog(true);
    await fetchOrgDocuments(org.id);
  };

  const handleOpenNotes = (org: Organization) => {
    setNotesPartner({ id: org.id, name: org.name });
    setShowNotesDialog(true);
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
    } catch (error) {
      console.error('Error downloading document:', error);
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

  const filterOrgs = (orgs: Organization[]) => {
    if (!searchTerm) return orgs;
    const term = searchTerm.toLowerCase();
    return orgs.filter(
      o =>
        o.name.toLowerCase().includes(term) ||
        o.city.toLowerCase().includes(term) ||
        o.email.toLowerCase().includes(term) ||
        (o.client_code && o.client_code.toLowerCase().includes(term))
    );
  };

  const OrgCard = ({ org }: { org: Organization }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-lg border hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer"
      onClick={() => navigate(`/dashboard/organization/${org.id}`)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/dashboard/organization/${org.id}`);
            }}
          >
            <Eye className="w-4 h-4 ml-1" />
            عرض الملف
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              handleViewProfile(org);
            }}
          >
            <ExternalLink className="w-4 h-4 ml-1" />
            نافذة سريعة
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              handleOpenNotes(org);
            }}
          >
            <StickyNote className="w-4 h-4 ml-1" />
            الملاحظات
          </Button>
        </div>
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-1 text-right">
            <div className="flex items-center gap-2 justify-end">
              <Badge variant={org.is_verified ? 'default' : 'secondary'}>
                {org.is_verified ? 'موثق' : 'غير موثق'}
              </Badge>
              {org.client_code && (
                <Badge variant="outline" className="font-mono text-xs">
                  {org.client_code}
                </Badge>
              )}
              <h3 className="font-bold">{org.name}</h3>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground justify-end flex-wrap">
              <span className="flex items-center gap-1">
                {org.city}
                <MapPin className="w-3 h-3" />
              </span>
              <span className="flex items-center gap-1" dir="ltr">
                {org.phone}
                <Phone className="w-3 h-3" />
              </span>
              <span className="flex items-center gap-1">
                {org.email}
                <Mail className="w-3 h-3" />
              </span>
            </div>
            {org.representative_name && (
              <p className="text-sm text-muted-foreground mt-1">
                الممثل القانوني: {org.representative_name}
              </p>
            )}
          </div>
          <Avatar className="w-12 h-12">
            <AvatarImage src={org.logo_url || undefined} />
            <AvatarFallback className="bg-primary/10">
              {org.organization_type === 'generator' ? (
                <Factory className="w-6 h-6 text-blue-600" />
              ) : org.organization_type === 'transporter' ? (
                <Truck className="w-6 h-6 text-amber-600" />
              ) : (
                <Recycle className="w-6 h-6 text-green-600" />
              )}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalPartners = generators.length + transporters.length + recyclers.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم، المدينة، البريد أو كود العميل..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-bold flex items-center gap-2 justify-end">
            شركائي
            <Building2 className="w-6 h-6 text-primary" />
          </h1>
          <p className="text-muted-foreground">
            الجهات التي تم التعامل معها عبر الشحنات ({totalPartners} شريك)
          </p>
        </div>
      </div>

      {/* Partner Linking Card */}
      <PartnerLinkingCard />

      {/* Info Banner */}
      {totalPartners === 0 && (
        <div className="bg-muted/50 border rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
          <div className="text-right">
            <p className="font-medium">لا يوجد شركاء عبر الشحنات بعد</p>
            <p className="text-sm text-muted-foreground">
              ستظهر هنا الجهات التي تتعامل معها عبر الشحنات. يمكنك أيضاً ربط شركاء مباشرة باستخدام كود التحقق أعلاه.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="generators" dir="rtl">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generators" className="gap-2">
            <Factory className="w-4 h-4" />
            الجهات المولدة ({generators.length})
          </TabsTrigger>
          <TabsTrigger value="transporters" className="gap-2">
            <Truck className="w-4 h-4" />
            الجهات الناقلة ({transporters.length})
          </TabsTrigger>
          <TabsTrigger value="recyclers" className="gap-2">
            <Recycle className="w-4 h-4" />
            الجهات المدورة ({recyclers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generators" className="mt-4">
          <Card>
            <CardHeader className="text-right">
              <CardTitle className="flex items-center gap-2 justify-end">
                <Factory className="w-5 h-5 text-blue-600" />
                الجهات المولدة الشريكة
              </CardTitle>
              <CardDescription>
                الجهات المولدة التي تم التعامل معها عبر الشحنات
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {filterOrgs(generators).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'لا توجد جهات مولدة مطابقة للبحث' : 'لا توجد جهات مولدة شريكة بعد'}
                </div>
              ) : (
                filterOrgs(generators).map(org => <OrgCard key={org.id} org={org} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transporters" className="mt-4">
          <Card>
            <CardHeader className="text-right">
              <CardTitle className="flex items-center gap-2 justify-end">
                <Truck className="w-5 h-5 text-amber-600" />
                الجهات الناقلة الشريكة
              </CardTitle>
              <CardDescription>
                شركات النقل التي تم التعامل معها عبر الشحنات
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {filterOrgs(transporters).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'لا توجد جهات ناقلة مطابقة للبحث' : 'لا توجد جهات ناقلة شريكة بعد'}
                </div>
              ) : (
                filterOrgs(transporters).map(org => <OrgCard key={org.id} org={org} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recyclers" className="mt-4">
          <Card>
            <CardHeader className="text-right">
              <CardTitle className="flex items-center gap-2 justify-end">
                <Recycle className="w-5 h-5 text-green-600" />
                الجهات المدورة الشريكة
              </CardTitle>
              <CardDescription>
                الجهات المدورة التي تم التعامل معها عبر الشحنات
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {filterOrgs(recyclers).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'لا توجد جهات مدورة مطابقة للبحث' : 'لا توجد جهات مدورة شريكة بعد'}
                </div>
              ) : (
                filterOrgs(recyclers).map(org => <OrgCard key={org.id} org={org} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-end">
              الملف التعريفي
              {selectedOrg?.organization_type === 'generator' ? (
                <Factory className="w-5 h-5 text-blue-600" />
              ) : selectedOrg?.organization_type === 'transporter' ? (
                <Truck className="w-5 h-5 text-amber-600" />
              ) : (
                <Recycle className="w-5 h-5 text-green-600" />
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedOrg && (
            <div className="space-y-6">
              {/* Company Header */}
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex-1 text-right">
                  <h2 className="text-xl font-bold">{selectedOrg.name}</h2>
                  {selectedOrg.name_en && (
                    <p className="text-muted-foreground">{selectedOrg.name_en}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 justify-end">
                    <Badge>
                      {selectedOrg.organization_type === 'generator' 
                        ? 'الجهة المولدة' 
                        : selectedOrg.organization_type === 'transporter'
                        ? 'الجهة الناقلة'
                        : 'الجهة المدورة'}
                    </Badge>
                    {selectedOrg.is_verified && <Badge variant="secondary">موثق</Badge>}
                  </div>
                </div>
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedOrg.logo_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-2xl">
                    {selectedOrg.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg space-y-3 text-right">
                  <h3 className="font-bold flex items-center gap-2 justify-end">
                    معلومات التواصل
                    <Phone className="w-4 h-4" />
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">البريد الإلكتروني:</span> {selectedOrg.email}</p>
                    <p><span className="text-muted-foreground">الهاتف:</span> <span dir="ltr">{selectedOrg.phone}</span></p>
                    {selectedOrg.secondary_phone && (
                      <p><span className="text-muted-foreground">هاتف ثانوي:</span> <span dir="ltr">{selectedOrg.secondary_phone}</span></p>
                    )}
                  </div>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg space-y-3 text-right">
                  <h3 className="font-bold flex items-center gap-2 justify-end">
                    العنوان
                    <MapPin className="w-4 h-4" />
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">المدينة:</span> {selectedOrg.city}</p>
                    {selectedOrg.region && <p><span className="text-muted-foreground">المنطقة:</span> {selectedOrg.region}</p>}
                    <p><span className="text-muted-foreground">العنوان:</span> {selectedOrg.address}</p>
                  </div>
                </div>
              </div>

              {/* Business Info */}
              {(selectedOrg.commercial_register || selectedOrg.environmental_license || selectedOrg.activity_type) && (
                <div className="p-4 bg-muted/30 rounded-lg space-y-3 text-right">
                  <h3 className="font-bold flex items-center gap-2 justify-end">
                    معلومات تجارية
                    <FileText className="w-4 h-4" />
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedOrg.commercial_register && (
                      <p><span className="text-muted-foreground">السجل التجاري:</span> {selectedOrg.commercial_register}</p>
                    )}
                    {selectedOrg.environmental_license && (
                      <p><span className="text-muted-foreground">الترخيص البيئي:</span> {selectedOrg.environmental_license}</p>
                    )}
                    {selectedOrg.activity_type && (
                      <p><span className="text-muted-foreground">نوع النشاط:</span> {selectedOrg.activity_type}</p>
                    )}
                    {selectedOrg.production_capacity && (
                      <p><span className="text-muted-foreground">الطاقة الإنتاجية:</span> {selectedOrg.production_capacity}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Representatives */}
              <div className="space-y-4">
                {selectedOrg.representative_name && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg space-y-2 text-right">
                    <h3 className="font-bold flex items-center gap-2 justify-end text-blue-700 dark:text-blue-400">
                      الممثل القانوني
                      <User className="w-4 h-4" />
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p><span className="text-muted-foreground">الاسم:</span> {selectedOrg.representative_name}</p>
                      {selectedOrg.representative_position && (
                        <p><span className="text-muted-foreground">المنصب:</span> {selectedOrg.representative_position}</p>
                      )}
                      {selectedOrg.representative_phone && (
                        <p><span className="text-muted-foreground">الهاتف:</span> <span dir="ltr">{selectedOrg.representative_phone}</span></p>
                      )}
                      {selectedOrg.representative_email && (
                        <p><span className="text-muted-foreground">البريد:</span> {selectedOrg.representative_email}</p>
                      )}
                    </div>
                  </div>
                )}

                {selectedOrg.delegate_name && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg space-y-2 text-right">
                    <h3 className="font-bold flex items-center gap-2 justify-end text-amber-700 dark:text-amber-400">
                      المفوض
                      <User className="w-4 h-4" />
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p><span className="text-muted-foreground">الاسم:</span> {selectedOrg.delegate_name}</p>
                      {selectedOrg.delegate_phone && (
                        <p><span className="text-muted-foreground">الهاتف:</span> <span dir="ltr">{selectedOrg.delegate_phone}</span></p>
                      )}
                      {selectedOrg.delegate_email && (
                        <p><span className="text-muted-foreground">البريد:</span> {selectedOrg.delegate_email}</p>
                      )}
                    </div>
                  </div>
                )}

                {selectedOrg.agent_name && (
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg space-y-2 text-right">
                    <h3 className="font-bold flex items-center gap-2 justify-end text-green-700 dark:text-green-400">
                      الوكيل
                      <User className="w-4 h-4" />
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p><span className="text-muted-foreground">الاسم:</span> {selectedOrg.agent_name}</p>
                      {selectedOrg.agent_phone && (
                        <p><span className="text-muted-foreground">الهاتف:</span> <span dir="ltr">{selectedOrg.agent_phone}</span></p>
                      )}
                      {selectedOrg.agent_email && (
                        <p><span className="text-muted-foreground">البريد:</span> {selectedOrg.agent_email}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Documents */}
              <div className="p-4 bg-muted/30 rounded-lg space-y-3 text-right">
                <h3 className="font-bold flex items-center gap-2 justify-end">
                  الوثائق القانونية
                  <FileText className="w-4 h-4" />
                </h3>
                {loadingDocs ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </div>
                ) : orgDocuments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">لا توجد وثائق مرفوعة</p>
                ) : (
                  <div className="space-y-2">
                    {orgDocuments.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-background rounded border">
                        <Button variant="ghost" size="sm" onClick={() => handleDownloadDocument(doc)}>
                          <Download className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="font-medium text-sm">{doc.file_name}</p>
                            <p className="text-xs text-muted-foreground">{getDocumentTypeLabel(doc.document_type)}</p>
                          </div>
                          <FileText className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Partner Notes Dialog */}
      {notesPartner && (
        <PartnerNotesDialog
          open={showNotesDialog}
          onOpenChange={setShowNotesDialog}
          partnerId={notesPartner.id}
          partnerName={notesPartner.name}
        />
      )}
    </div>
  );
};

export default PartnersView;
