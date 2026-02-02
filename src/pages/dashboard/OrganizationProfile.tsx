import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Building2, 
  User, 
  FileText, 
  Upload, 
  Trash2, 
  Download,
  Phone,
  Mail,
  MapPin,
  Shield,
  Users,
  Loader2,
  Save,
  CheckCircle,
  XCircle,
  Stamp,
  PenSquare,
  Target
} from 'lucide-react';
import OrganizationPosts from '@/components/organization/OrganizationPosts';
import StampSignatureUpload from '@/components/organization/StampSignatureUpload';
import ProfileHeader from '@/components/organization/ProfileHeader';
import BackButton from '@/components/ui/back-button';
import OrganizationPortfolio from '@/components/organization/OrganizationPortfolio';

interface OrganizationDocument {
  id: string;
  organization_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  created_at: string;
}

const OrganizationProfile = () => {
  const { user, organization, profile, roles, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<OrganizationDocument[]>([]);
  const [orgData, setOrgData] = useState<any>(null);

  const isCompanyAdmin = roles.includes('company_admin') || roles.includes('admin');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchOrganizationData();
  }, [user, organization]);

  const fetchOrganizationData = async () => {
    if (!organization?.id) {
      setLoading(false);
      return;
    }

    try {
      // Fetch full organization data
      const { data: orgDetails, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organization.id)
        .single();

      if (orgError) throw orgError;
      setOrgData(orgDetails);

      // Fetch documents
      const { data: docs, error: docsError } = await supabase
        .from('organization_documents')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (!docsError && docs) {
        setDocuments(docs as OrganizationDocument[]);
      }
    } catch (error) {
      console.error('Error fetching organization data:', error);
      toast.error('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!organization?.id || !isCompanyAdmin) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: orgData.name,
          name_en: orgData.name_en,
          email: orgData.email,
          phone: orgData.phone,
          secondary_phone: orgData.secondary_phone,
          address: orgData.address,
          city: orgData.city,
          region: orgData.region,
          commercial_register: orgData.commercial_register,
          environmental_license: orgData.environmental_license,
          activity_type: orgData.activity_type,
          production_capacity: orgData.production_capacity,
          representative_name: orgData.representative_name,
          representative_national_id: orgData.representative_national_id,
          representative_phone: orgData.representative_phone,
          representative_email: orgData.representative_email,
          representative_position: orgData.representative_position,
          delegate_name: orgData.delegate_name,
          delegate_national_id: orgData.delegate_national_id,
          delegate_phone: orgData.delegate_phone,
          delegate_email: orgData.delegate_email,
          agent_name: orgData.agent_name,
          agent_national_id: orgData.agent_national_id,
          agent_phone: orgData.agent_phone,
          agent_email: orgData.agent_email,
          // الحقول الجديدة
          tax_card: orgData.tax_card,
          wmra_license: orgData.wmra_license,
          establishment_registration: orgData.establishment_registration,
          registered_activity: orgData.registered_activity,
          environmental_approval_number: orgData.environmental_approval_number,
          land_transport_license: orgData.land_transport_license,
          ida_license: orgData.ida_license,
          industrial_registry: orgData.industrial_registry,
          license_number: orgData.license_number,
        })
        .eq('id', organization.id);

      if (error) throw error;
      
      toast.success('تم حفظ البيانات بنجاح');
      await refreshProfile();
    } catch (error) {
      console.error('Error saving organization data:', error);
      toast.error('حدث خطأ في حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = event.target.files?.[0];
    if (!file || !organization?.id || !user) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('نوع الملف غير مدعوم. يرجى رفع PDF أو صورة.');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت.');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${documentType}_${Date.now()}.${fileExt}`;
      const filePath = `${organization.id}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('organization-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save document record
      const { error: dbError } = await supabase
        .from('organization_documents')
        .insert({
          organization_id: organization.id,
          document_type: documentType,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          uploaded_by: user.id,
        });

      if (dbError) throw dbError;

      toast.success('تم رفع الملف بنجاح');
      fetchOrganizationData();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('حدث خطأ في رفع الملف');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (doc: OrganizationDocument) => {
    if (!isCompanyAdmin) return;

    try {
      // Delete from storage
      await supabase.storage
        .from('organization-documents')
        .remove([doc.file_path]);

      // Delete record
      const { error } = await supabase
        .from('organization_documents')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;

      toast.success('تم حذف الملف');
      setDocuments(documents.filter(d => d.id !== doc.id));
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('حدث خطأ في حذف الملف');
    }
  };

  const handleDownloadDocument = async (doc: OrganizationDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('organization-documents')
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('حدث خطأ في تحميل الملف');
    }
  };

  const getOrganizationTypeLabel = (type: string) => {
    switch (type) {
      case 'generator': return 'الجهة المولدة';
      case 'transporter': return 'الجهة الناقلة';
      case 'recycler': return 'الجهة المدورة';
      default: return type;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'commercial_register': return 'السجل التجاري';
      case 'environmental_license': return 'الترخيص البيئي';
      case 'representative_id': return 'هوية الممثل القانوني';
      case 'delegate_authorization': return 'تفويض المفوض';
      case 'other': return 'مستند آخر';
      default: return type;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!organization) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">لا توجد جهة مرتبطة</h3>
            <p className="text-muted-foreground">لم يتم ربط حسابك بأي جهة بعد</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <BackButton />

        {/* Profile Header with Cover and Logo */}
        <Card className="overflow-hidden p-0">
          <ProfileHeader
            organization={{
              id: organization.id,
              name: organization.name,
              name_en: orgData?.name_en,
              organization_type: organization.organization_type,
              logo_url: orgData?.logo_url,
              cover_url: orgData?.cover_url,
              is_verified: organization.is_verified,
              city: orgData?.city,
              region: orgData?.region,
              client_code: orgData?.client_code,
              commercial_register: orgData?.commercial_register,
              environmental_license: orgData?.environmental_license,
              representative_name: orgData?.representative_name,
              representative_national_id: orgData?.representative_national_id,
              representative_phone: orgData?.representative_phone,
            }}
            isEditable={isCompanyAdmin}
            onUpdate={fetchOrganizationData}
          />
        </Card>

        <Tabs defaultValue="portfolio" className="space-y-4" dir="rtl">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="portfolio">
              <Target className="w-4 h-4 ml-2" />
              البورتفوليو
            </TabsTrigger>
            <TabsTrigger value="posts">
              <PenSquare className="w-4 h-4 ml-2" />
              المنشورات
            </TabsTrigger>
            <TabsTrigger value="basic">
              <Building2 className="w-4 h-4 ml-2" />
              البيانات الأساسية
            </TabsTrigger>
            <TabsTrigger value="representatives">
              <Users className="w-4 h-4 ml-2" />
              الممثلين
            </TabsTrigger>
            <TabsTrigger value="stamps">
              <Stamp className="w-4 h-4 ml-2" />
              الختم والتوقيع
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="w-4 h-4 ml-2" />
              الوثائق
            </TabsTrigger>
            <TabsTrigger value="contact">
              <Phone className="w-4 h-4 ml-2" />
              التواصل
            </TabsTrigger>
          </TabsList>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio">
            <OrganizationPortfolio
              organizationId={organization.id}
              organizationName={organization.name}
              organizationType={organization.organization_type}
              currentData={{
                description: orgData?.description,
                vision: orgData?.vision,
                policy: orgData?.policy,
                headquarters: orgData?.headquarters,
                branches: orgData?.branches,
                field_of_work: orgData?.field_of_work,
                address: orgData?.address,
                city: orgData?.city,
                activity_type: orgData?.activity_type,
              }}
              isEditable={isCompanyAdmin}
              onUpdate={fetchOrganizationData}
            />
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts">
            <OrganizationPosts
              organizationId={organization.id}
              organizationName={organization.name}
              organizationLogo={orgData?.logo_url}
              isOwnOrganization={true}
            />
          </TabsContent>

          {/* Basic Information Tab */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  البيانات الأساسية للجهة
                </CardTitle>
                <CardDescription>المعلومات الأساسية والتسجيلية للجهة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>اسم الجهة (عربي)</Label>
                    <Input
                      value={orgData?.name || ''}
                      onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                      disabled={!isCompanyAdmin}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>اسم الجهة (إنجليزي)</Label>
                    <Input
                      value={orgData?.name_en || ''}
                      onChange={(e) => setOrgData({ ...orgData, name_en: e.target.value })}
                      disabled={!isCompanyAdmin}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>رقم السجل التجاري</Label>
                    <Input
                      value={orgData?.commercial_register || ''}
                      onChange={(e) => setOrgData({ ...orgData, commercial_register: e.target.value })}
                      disabled={!isCompanyAdmin}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>البطاقة الضريبية</Label>
                    <Input
                      value={orgData?.tax_card || ''}
                      onChange={(e) => setOrgData({ ...orgData, tax_card: e.target.value })}
                      disabled={!isCompanyAdmin}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>رقم الموافقة البيئية</Label>
                    <Input
                      value={orgData?.environmental_approval_number || ''}
                      onChange={(e) => setOrgData({ ...orgData, environmental_approval_number: e.target.value })}
                      disabled={!isCompanyAdmin}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>رقم الترخيص البيئي</Label>
                    <Input
                      value={orgData?.environmental_license || ''}
                      onChange={(e) => setOrgData({ ...orgData, environmental_license: e.target.value })}
                      disabled={!isCompanyAdmin}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>رخصة جهاز تنظيم إدارة المخلفات</Label>
                    <Input
                      value={orgData?.wmra_license || ''}
                      onChange={(e) => setOrgData({ ...orgData, wmra_license: e.target.value })}
                      disabled={!isCompanyAdmin}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>رقم تسجيل المنشأة</Label>
                    <Input
                      value={orgData?.establishment_registration || ''}
                      onChange={(e) => setOrgData({ ...orgData, establishment_registration: e.target.value })}
                      disabled={!isCompanyAdmin}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>النشاط المسجل</Label>
                    <Input
                      value={orgData?.registered_activity || ''}
                      onChange={(e) => setOrgData({ ...orgData, registered_activity: e.target.value })}
                      disabled={!isCompanyAdmin}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>نوع النشاط</Label>
                    <Input
                      value={orgData?.activity_type || ''}
                      onChange={(e) => setOrgData({ ...orgData, activity_type: e.target.value })}
                      disabled={!isCompanyAdmin}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الطاقة الإنتاجية</Label>
                    <Input
                      value={orgData?.production_capacity || ''}
                      onChange={(e) => setOrgData({ ...orgData, production_capacity: e.target.value })}
                      disabled={!isCompanyAdmin}
                    />
                  </div>
                </div>

                {/* حقول خاصة بالجهة الناقلة */}
                {organization.organization_type === 'transporter' && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h4 className="font-medium text-primary">بيانات خاصة بالجهة الناقلة</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>رقم موافقة رخصة جهاز تنظيم النقل البري</Label>
                          <Input
                            value={orgData?.land_transport_license || ''}
                            onChange={(e) => setOrgData({ ...orgData, land_transport_license: e.target.value })}
                            disabled={!isCompanyAdmin}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* حقول خاصة بجهة التدوير */}
                {organization.organization_type === 'recycler' && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h4 className="font-medium text-primary">بيانات خاصة بجهة التدوير</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>رقم الرخصة الهيئة العامة للتنمية الصناعية</Label>
                          <Input
                            value={orgData?.ida_license || ''}
                            onChange={(e) => setOrgData({ ...orgData, ida_license: e.target.value })}
                            disabled={!isCompanyAdmin}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>رقم السجل الصناعي للهيئة العامة للتنمية الصناعية</Label>
                          <Input
                            value={orgData?.industrial_registry || ''}
                            onChange={(e) => setOrgData({ ...orgData, industrial_registry: e.target.value })}
                            disabled={!isCompanyAdmin}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>رقم الترخيص</Label>
                          <Input
                            value={orgData?.license_number || ''}
                            onChange={(e) => setOrgData({ ...orgData, license_number: e.target.value })}
                            disabled={!isCompanyAdmin}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    العنوان
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>المدينة</Label>
                      <Input
                        value={orgData?.city || ''}
                        onChange={(e) => setOrgData({ ...orgData, city: e.target.value })}
                        disabled={!isCompanyAdmin}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>المنطقة</Label>
                      <Input
                        value={orgData?.region || ''}
                        onChange={(e) => setOrgData({ ...orgData, region: e.target.value })}
                        disabled={!isCompanyAdmin}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label>العنوان التفصيلي</Label>
                      <Input
                        value={orgData?.address || ''}
                        onChange={(e) => setOrgData({ ...orgData, address: e.target.value })}
                        disabled={!isCompanyAdmin}
                      />
                    </div>
                  </div>
                </div>

                {isCompanyAdmin && (
                  <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
                      حفظ التغييرات
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Representatives Tab */}
          <TabsContent value="representatives">
            <div className="space-y-4">
              {/* Legal Representative */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    الممثل القانوني
                  </CardTitle>
                  <CardDescription>الشخص المخول قانونياً بتمثيل الجهة</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>الاسم الكامل</Label>
                      <Input
                        value={orgData?.representative_name || ''}
                        onChange={(e) => setOrgData({ ...orgData, representative_name: e.target.value })}
                        disabled={!isCompanyAdmin}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>رقم الهوية الوطنية</Label>
                      <Input
                        value={orgData?.representative_national_id || ''}
                        onChange={(e) => setOrgData({ ...orgData, representative_national_id: e.target.value })}
                        disabled={!isCompanyAdmin}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>المنصب</Label>
                      <Input
                        value={orgData?.representative_position || ''}
                        onChange={(e) => setOrgData({ ...orgData, representative_position: e.target.value })}
                        disabled={!isCompanyAdmin}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>رقم الهاتف</Label>
                      <Input
                        value={orgData?.representative_phone || ''}
                        onChange={(e) => setOrgData({ ...orgData, representative_phone: e.target.value })}
                        disabled={!isCompanyAdmin}
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>البريد الإلكتروني</Label>
                      <Input
                        value={orgData?.representative_email || ''}
                        onChange={(e) => setOrgData({ ...orgData, representative_email: e.target.value })}
                        disabled={!isCompanyAdmin}
                        type="email"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Delegate */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    المفوض
                  </CardTitle>
                  <CardDescription>الشخص المفوض من قبل الممثل القانوني</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>الاسم الكامل</Label>
                      <Input
                        value={orgData?.delegate_name || ''}
                        onChange={(e) => setOrgData({ ...orgData, delegate_name: e.target.value })}
                        disabled={!isCompanyAdmin}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>رقم الهوية الوطنية</Label>
                      <Input
                        value={orgData?.delegate_national_id || ''}
                        onChange={(e) => setOrgData({ ...orgData, delegate_national_id: e.target.value })}
                        disabled={!isCompanyAdmin}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>رقم الهاتف</Label>
                      <Input
                        value={orgData?.delegate_phone || ''}
                        onChange={(e) => setOrgData({ ...orgData, delegate_phone: e.target.value })}
                        disabled={!isCompanyAdmin}
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>البريد الإلكتروني</Label>
                      <Input
                        value={orgData?.delegate_email || ''}
                        onChange={(e) => setOrgData({ ...orgData, delegate_email: e.target.value })}
                        disabled={!isCompanyAdmin}
                        type="email"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Agent */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    الموكل
                  </CardTitle>
                  <CardDescription>بيانات الموكل (إن وجد)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>الاسم الكامل</Label>
                      <Input
                        value={orgData?.agent_name || ''}
                        onChange={(e) => setOrgData({ ...orgData, agent_name: e.target.value })}
                        disabled={!isCompanyAdmin}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>رقم الهوية الوطنية</Label>
                      <Input
                        value={orgData?.agent_national_id || ''}
                        onChange={(e) => setOrgData({ ...orgData, agent_national_id: e.target.value })}
                        disabled={!isCompanyAdmin}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>رقم الهاتف</Label>
                      <Input
                        value={orgData?.agent_phone || ''}
                        onChange={(e) => setOrgData({ ...orgData, agent_phone: e.target.value })}
                        disabled={!isCompanyAdmin}
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>البريد الإلكتروني</Label>
                      <Input
                        value={orgData?.agent_email || ''}
                        onChange={(e) => setOrgData({ ...orgData, agent_email: e.target.value })}
                        disabled={!isCompanyAdmin}
                        type="email"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {isCompanyAdmin && (
                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
                    حفظ التغييرات
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Stamps and Signatures Tab */}
          <TabsContent value="stamps">
            <StampSignatureUpload
              organizationId={organization.id}
              stampUrl={orgData?.stamp_url || null}
              signatureUrl={orgData?.signature_url || null}
              onUpdate={fetchOrganizationData}
              disabled={!isCompanyAdmin}
            />
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  الوثائق والمستندات
                </CardTitle>
                <CardDescription>رفع وإدارة الوثائق القانونية للمؤسسة (PDF أو صور)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Upload Section */}
                {isCompanyAdmin && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { type: 'commercial_register', label: 'السجل التجاري' },
                      { type: 'environmental_license', label: 'الترخيص البيئي' },
                      { type: 'representative_id', label: 'هوية الممثل القانوني' },
                      { type: 'delegate_authorization', label: 'تفويض المفوض' },
                      { type: 'other', label: 'مستند آخر' },
                    ].map(({ type, label }) => (
                      <div key={type} className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors">
                        <input
                          type="file"
                          id={`upload-${type}`}
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          onChange={(e) => handleFileUpload(e, type)}
                          disabled={uploading}
                        />
                        <label
                          htmlFor={`upload-${type}`}
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          <Upload className="w-8 h-8 text-muted-foreground" />
                          <span className="font-medium">{label}</span>
                          <span className="text-xs text-muted-foreground">PDF أو صورة (حد 10MB)</span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                {uploading && (
                  <div className="flex items-center justify-center gap-2 py-4">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>جاري رفع الملف...</span>
                  </div>
                )}

                <Separator />

                {/* Documents List */}
                <div className="space-y-2">
                  <h4 className="font-medium">الملفات المرفوعة</h4>
                  {documents.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">لا توجد ملفات مرفوعة</p>
                  ) : (
                    <div className="divide-y">
                      {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between py-3">
                          <div className="flex items-center gap-3">
                            <FileText className="w-8 h-8 text-primary" />
                            <div>
                              <p className="font-medium">{doc.file_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {getDocumentTypeLabel(doc.document_type)} • 
                                {doc.file_size ? ` ${(doc.file_size / 1024).toFixed(1)} KB` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleDownloadDocument(doc)}>
                              <Download className="w-4 h-4" />
                            </Button>
                            {isCompanyAdmin && (
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteDocument(doc)}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  بيانات التواصل
                </CardTitle>
                <CardDescription>معلومات الاتصال بالجهة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      البريد الإلكتروني
                    </Label>
                    <Input
                      value={orgData?.email || ''}
                      onChange={(e) => setOrgData({ ...orgData, email: e.target.value })}
                      disabled={!isCompanyAdmin}
                      type="email"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      رقم الهاتف الأساسي
                    </Label>
                    <Input
                      value={orgData?.phone || ''}
                      onChange={(e) => setOrgData({ ...orgData, phone: e.target.value })}
                      disabled={!isCompanyAdmin}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      رقم الهاتف الثانوي
                    </Label>
                    <Input
                      value={orgData?.secondary_phone || ''}
                      onChange={(e) => setOrgData({ ...orgData, secondary_phone: e.target.value })}
                      disabled={!isCompanyAdmin}
                      dir="ltr"
                    />
                  </div>
                </div>

                {isCompanyAdmin && (
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
                      حفظ التغييرات
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default OrganizationProfile;
