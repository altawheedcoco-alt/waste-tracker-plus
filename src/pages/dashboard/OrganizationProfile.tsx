import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Building2, User, FileText, Upload, Trash2, Download,
  Phone, Mail, MapPin, Shield, Users, Loader2, Save,
  Stamp, PenSquare, Target, Briefcase, Award, Globe, Share2, Brain, CheckCircle2, FileSearch
} from 'lucide-react';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import V2TabsNav, { TabItem } from '@/components/dashboard/shared/V2TabsNav';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import ProfileHeader from '@/components/organization/ProfileHeader';
import BackButton from '@/components/ui/back-button';
import LegalDataSection from '@/components/organization/LegalDataSection';

// Lazy load heavy tab components
const BusinessPagePreview = lazy(() => import('@/components/organization/BusinessPagePreview'));
const OrgPublicProfileSettings = lazy(() => import('@/components/org-structure/OrgPublicProfileSettings'));
const OrganizationPortfolio = lazy(() => import('@/components/organization/OrganizationPortfolio'));
const BusinessProfileSettings = lazy(() => import('@/components/organization/BusinessProfileSettings'));
const OrganizationPosts = lazy(() => import('@/components/organization/OrganizationPosts'));
const LocationSettings = lazy(() => import('@/components/organization/LocationSettings'));
const OrganizationPhotoGallery = lazy(() => import('@/components/organization/OrganizationPhotoGallery'));
const BusinessProfileView = lazy(() => import('@/components/organization/BusinessProfileView'));
const StampSignatureUpload = lazy(() => import('@/components/organization/StampSignatureUpload'));
const BiometricManager = lazy(() => import('@/components/biometric/BiometricManager'));
const OrganizationSignatureSettings = lazy(() => import('@/components/signature').then(m => ({ default: m.OrganizationSignatureSettings })));
const LMSProfileCertificates = lazy(() => import('@/components/lms/LMSProfileCertificates'));
const OrganizationAnalysis = lazy(() => import('@/components/organization/OrganizationAnalysis'));
const AttestationTabContent = lazy(() => import('@/components/attestation/AttestationTabContent'));

interface OrganizationDocument {
  id: string;
  organization_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  created_at: string;
}

const TabFallback = () => <Skeleton className="h-48 w-full rounded-xl" />;

const PREF_KEY_ACTIVE_TAB = 'org_profile_active_tab';

// Tab configuration — ordered by logical groups
const ORG_PROFILE_TABS: TabItem[] = [
  // الهوية والعرض
  { value: 'page', label: 'الصفحة التجارية', icon: Globe },
  { value: 'portfolio', label: 'البورتفوليو', icon: Target },
  { value: 'business', label: 'الملف التجاري', icon: Briefcase },
  { value: 'posts', label: 'المنشورات', icon: PenSquare },
  // البيانات الأساسية
  { value: 'basic', label: 'البيانات الأساسية', icon: Building2 },
  { value: 'representatives', label: 'الممثلون', icon: Users },
  { value: 'contact', label: 'التواصل', icon: Phone },
  { value: 'location', label: 'الموقع والصور', icon: MapPin },
  // الوثائق والتوثيق
  { value: 'documents', label: 'الوثائق', icon: FileText },
  { value: 'doc-analysis', label: 'تحليل الوثائق', icon: FileSearch },
  { value: 'analysis', label: 'تحليل الجهة', icon: Brain },
  { value: 'stamps', label: 'الختم والتوقيع', icon: Stamp },
  { value: 'certificates', label: 'الشهادات', icon: Award },
  { value: 'attestation', label: 'الإفادة', icon: Shield },
  { value: 'sharing', label: 'المشاركة', icon: Share2 },
];

const OrganizationProfile = () => {
  const { user, organization, profile, roles, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { getPref, setPref } = useUserPreferences();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [aiExtracting, setAiExtracting] = useState(false);
  const [documents, setDocuments] = useState<OrganizationDocument[]>([]);
  const [orgData, setOrgData] = useState<any>(null);

  const isCompanyAdmin = roles.includes('company_admin') || roles.includes('admin');
  const activeTab = getPref(PREF_KEY_ACTIVE_TAB, 'page');

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    fetchOrganizationData();
  }, [user, organization]);

  const fetchOrganizationData = async () => {
    if (!organization?.id) { setLoading(false); return; }
    try {
      const [{ data: orgDetails, error: orgError }, { data: docs, error: docsError }] = await Promise.all([
        supabase.from('organizations').select('*').eq('id', organization.id).single(),
        supabase.from('organization_documents').select('*').eq('organization_id', organization.id).order('created_at', { ascending: false }),
      ]);
      if (orgError) throw orgError;
      setOrgData(orgDetails);
      if (!docsError && docs) setDocuments(docs as OrganizationDocument[]);
    } catch (error) {
      console.error('Error fetching organization data:', error);
      toast.error(t('orgProfile.dataLoadError'));
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
          name: orgData.name, name_en: orgData.name_en, email: orgData.email,
          phone: orgData.phone, secondary_phone: orgData.secondary_phone,
          address: orgData.address, city: orgData.city, region: orgData.region,
          commercial_register: orgData.commercial_register, environmental_license: orgData.environmental_license,
          activity_type: orgData.activity_type, production_capacity: orgData.production_capacity,
          representative_name: orgData.representative_name, representative_national_id: orgData.representative_national_id,
          representative_phone: orgData.representative_phone, representative_email: orgData.representative_email,
          representative_position: orgData.representative_position,
          delegate_name: orgData.delegate_name, delegate_national_id: orgData.delegate_national_id,
          delegate_phone: orgData.delegate_phone, delegate_email: orgData.delegate_email,
          agent_name: orgData.agent_name, agent_national_id: orgData.agent_national_id,
          agent_phone: orgData.agent_phone, agent_email: orgData.agent_email,
          tax_card: orgData.tax_card, wmra_license: orgData.wmra_license,
          establishment_registration: orgData.establishment_registration,
          registered_activity: orgData.registered_activity,
          environmental_approval_number: orgData.environmental_approval_number,
          land_transport_license: orgData.land_transport_license,
          ida_license: orgData.ida_license, industrial_registry: orgData.industrial_registry,
          license_number: orgData.license_number,
          wmra_license_issue_date: orgData.wmra_license_issue_date || null,
          wmra_license_expiry_date: orgData.wmra_license_expiry_date || null,
          eeaa_license_issue_date: orgData.eeaa_license_issue_date || null,
          eeaa_license_expiry_date: orgData.eeaa_license_expiry_date || null,
          ida_license_issue_date: orgData.ida_license_issue_date || null,
          ida_license_expiry_date: orgData.ida_license_expiry_date || null,
          land_transport_license_issue_date: orgData.land_transport_license_issue_date || null,
          land_transport_license_expiry_date: orgData.land_transport_license_expiry_date || null,
          digital_declaration_number: orgData.digital_declaration_number,
          certifications_approvals: orgData.certifications_approvals || [],
          hazardous_certified: orgData.hazardous_certified,
          location_url: orgData.location_url, address_details: orgData.address_details,
          location_description: orgData.location_description, working_hours: orgData.working_hours,
          is_location_public: orgData.is_location_public,
          location_lat: orgData.location_lat, location_lng: orgData.location_lng,
          bio: orgData.bio, website_url: orgData.website_url,
          price_range: orgData.price_range, cta_type: orgData.cta_type,
          services: orgData.services, founded_year: orgData.founded_year,
          business_email: orgData.business_email, social_links: orgData.social_links,
        })
        .eq('id', organization.id);
      if (error) throw error;
      toast.success(t('orgProfile.dataSaved'));
      await refreshProfile();
    } catch (error) {
      console.error('Error saving organization data:', error);
      toast.error(t('orgProfile.dataSaveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = event.target.files?.[0];
    if (!file || !organization?.id || !user) return;
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) { toast.error(t('orgProfile.unsupportedFileType')); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error(t('orgProfile.fileTooLarge')); return; }
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${documentType}_${Date.now()}.${fileExt}`;
      const filePath = `${organization.id}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('organization-documents').upload(filePath, file);
      if (uploadError) throw uploadError;
      
      // Get public URL for AI extraction
      const { data: urlData } = supabase.storage.from('organization-documents').getPublicUrl(filePath);
      const fileUrl = urlData?.publicUrl || '';

      const { error: dbError } = await supabase.from('organization_documents').insert({
        organization_id: organization.id, document_type: documentType,
        file_name: file.name, file_path: filePath, file_size: file.size, uploaded_by: user.id,
      });
      if (dbError) throw dbError;
      toast.success(t('orgProfile.fileUploaded'));
      fetchOrganizationData();

      // AI Extraction (async, non-blocking)
      setAiExtracting(true);
      try {
        const { useDocumentOCRExtractor } = await import('@/hooks/useDocumentOCRExtractor');
        // Use direct function call approach
        const toBase64 = (blob: Blob): Promise<string> => new Promise((res, rej) => {
          const r = new FileReader();
          r.onloadend = () => res(r.result as string);
          r.onerror = rej;
          r.readAsDataURL(blob);
        });
        
        const base64 = await toBase64(file);
        const { data: aiData } = await supabase.functions.invoke('ocr-extract', {
          body: { imageBase64: base64, fileName: file.name, mimeType: file.type },
        });
        
        if (aiData?.result) {
          const result = aiData.result;
          const fields = result.detected_fields || {};
          const structuredFields: Record<string, string | string[]> = {};
          if (fields.license_number) structuredFields['رقم الترخيص'] = fields.license_number;
          if (fields.issue_date) structuredFields['تاريخ الإصدار'] = fields.issue_date;
          if (fields.expiry_date) structuredFields['تاريخ الانتهاء'] = fields.expiry_date;
          if (fields.holder_name) structuredFields['اسم صاحب الترخيص'] = fields.holder_name;
          if (fields.issuing_authority) structuredFields['الجهة المصدرة'] = fields.issuing_authority;
          if (fields.document_type) structuredFields['نوع المستند'] = fields.document_type;
          if (fields.waste_types?.length) structuredFields['أنواع المخلفات'] = fields.waste_types;
          if (result.obligations?.length) structuredFields['الاشتراطات والالتزامات'] = result.obligations;

          const typeMap: Record<string, string> = {
            wmra_license: 'license', environmental_approval: 'certificate',
            transport_license: 'license', compliance_document: 'certificate',
          };
          const docType = typeMap[fields.document_type] || 'other';

          await supabase.from('entity_documents').insert({
            organization_id: organization.id,
            document_type: docType,
            document_category: 'legal',
            title: `${fields.document_type || documentType} - ${file.name}`,
            file_url: fileUrl,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            reference_number: fields.license_number || null,
            tags: ['ai-extracted', documentType, docType],
            ocr_extracted_data: {
              structured_fields: structuredFields,
              raw_text: result.raw_text || '',
              obligations: result.obligations || [],
              confidence: result.confidence || 0,
              pages_count: result.pages_count,
              detected_fields: fields,
            } as any,
            ocr_confidence: result.confidence || 0,
            ai_extracted: true,
          });
          toast.success('✅ تم استخراج البيانات بالذكاء الاصطناعي وحفظها', { duration: 4000 });

          // === AUTO DEEP ANALYSIS PIPELINE ===
          try {
            toast.info('🔄 جاري التحليل العميق التلقائي للجهة...', { duration: 3000 });
            const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-organization', {
              body: { organization_id: organization.id },
            });
            
            if (analysisData && !analysisError) {
              const orgName = organization.name || 'جهة';
              const reportTitle = `تقرير تحليل تلقائي - ${orgName} - ${new Date().toLocaleDateString('ar-EG')}`;
              
              await supabase.from('entity_documents').insert({
                organization_id: organization.id,
                document_type: 'report',
                document_category: 'analysis',
                title: reportTitle,
                file_name: `${reportTitle}.json`,
                file_url: '',
                ai_extracted: true,
                ocr_extracted_data: analysisData as any,
                ocr_confidence: analysisData.compliance_score || 0,
                uploaded_by: user?.id,
                tags: ['ai-analysis', 'auto-generated', 'deep-analysis'],
              });

              const { notifyAdmins } = await import('@/services/unifiedNotifier');
              const riskEmoji = analysisData.risk_level === 'high' ? '🔴' : analysisData.risk_level === 'medium' ? '🟡' : '🟢';
              await notifyAdmins(
                `📊 تقرير تحليل تلقائي: ${orgName}`,
                `${riskEmoji} مستوى المخاطرة: ${analysisData.risk_level || 'N/A'}\n📈 الامتثال: ${analysisData.compliance_score || 0}%\n📄 مستند: ${file.name}`,
                { type: 'auto_analysis', organization_id: organization.id }
              );
              toast.success('✅ تم التحليل العميق وحفظ التقرير وإبلاغ المدير تلقائياً', { duration: 5000 });
            }
          } catch (deepErr) {
            console.warn('Auto deep analysis (non-blocking):', deepErr);
          }
        }
      } catch (aiErr) {
        console.error('AI extraction error (non-blocking):', aiErr);
        // Non-blocking: don't show error to user since upload succeeded
      } finally {
        setAiExtracting(false);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(t('orgProfile.fileUploadError'));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (doc: OrganizationDocument) => {
    if (!isCompanyAdmin) return;
    try {
      await supabase.storage.from('organization-documents').remove([doc.file_path]);
      const { error } = await supabase.from('organization_documents').delete().eq('id', doc.id);
      if (error) throw error;
      toast.success(t('orgProfile.fileDeleted'));
      setDocuments(documents.filter(d => d.id !== doc.id));
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error(t('orgProfile.fileDeleteError'));
    }
  };

  const handleDownloadDocument = async (doc: OrganizationDocument) => {
    try {
      const { data, error } = await supabase.storage.from('organization-documents').download(doc.file_path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url; a.download = doc.file_name; a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error(t('orgProfile.fileDownloadError'));
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      commercial_register: 'السجل التجاري', environmental_license: 'الترخيص البيئي',
      representative_id: 'هوية الممثل القانوني', delegate_authorization: 'تفويض المفوض', other: 'مستند آخر',
    };
    return map[type] || type;
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
            <h3 className="text-lg font-semibold mb-2">{t('orgProfile.noOrgLinked')}</h3>
            <p className="text-muted-foreground">{t('orgProfile.noOrgLinkedDesc')}</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const SaveButton = () => isCompanyAdmin ? (
    <div className="flex justify-end pt-2">
      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
        حفظ التغييرات
      </Button>
    </div>
  ) : null;

  return (
    <DashboardLayout>
      <div className="space-y-3 sm:space-y-6">
        <BackButton />

        {/* Profile Header */}
        <Card className="overflow-hidden p-0">
          <ProfileHeader
            organization={{
              id: organization.id, name: organization.name, name_en: orgData?.name_en,
              organization_type: organization.organization_type, logo_url: orgData?.logo_url,
              cover_url: orgData?.cover_url, is_verified: organization.is_verified,
              city: orgData?.city, region: orgData?.region, client_code: orgData?.client_code,
              commercial_register: orgData?.commercial_register, environmental_license: orgData?.environmental_license,
              representative_name: orgData?.representative_name, representative_national_id: orgData?.representative_national_id,
              representative_phone: orgData?.representative_phone, bio: orgData?.bio,
              cta_type: orgData?.cta_type, website_url: orgData?.website_url,
              phone: orgData?.phone, founded_year: orgData?.founded_year, activity_type: orgData?.activity_type,
            }}
            isEditable={isCompanyAdmin}
            onUpdate={fetchOrganizationData}
          />
        </Card>

        {/* Tabs with V2TabsNav */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setPref(PREF_KEY_ACTIVE_TAB, v)}
          className="space-y-4"
          dir="rtl"
        >
          <V2TabsNav tabs={ORG_PROFILE_TABS} />

          {/* الصفحة التجارية */}
          <TabsContent value="page">
            <ErrorBoundary fallbackTitle="خطأ في الصفحة التجارية">
              <Suspense fallback={<TabFallback />}>
                <BusinessPagePreview
                  organizationId={organization.id}
                  organizationName={organization.name}
                  orgData={orgData}
                  isOwnPage={true}
                />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          {/* البورتفوليو */}
          <TabsContent value="portfolio">
            <ErrorBoundary fallbackTitle="خطأ في البورتفوليو">
              <Suspense fallback={<TabFallback />}>
                <OrganizationPortfolio
                  organizationId={organization.id}
                  organizationName={organization.name}
                  organizationType={organization.organization_type}
                  currentData={{
                    description: orgData?.description, vision: orgData?.vision,
                    policy: orgData?.policy, headquarters: orgData?.headquarters,
                    branches: orgData?.branches, field_of_work: orgData?.field_of_work,
                    address: orgData?.address, city: orgData?.city, activity_type: orgData?.activity_type,
                  }}
                  isEditable={isCompanyAdmin}
                  onUpdate={fetchOrganizationData}
                />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          {/* الملف التجاري */}
          <TabsContent value="business">
            <ErrorBoundary fallbackTitle="خطأ في الملف التجاري">
              <Suspense fallback={<TabFallback />}>
                <BusinessProfileSettings
                  organizationId={organization.id}
                  organizationType={organization.organization_type}
                  data={orgData}
                  isEditable={isCompanyAdmin}
                  onUpdate={fetchOrganizationData}
                />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          {/* المنشورات */}
          <TabsContent value="posts">
            <ErrorBoundary fallbackTitle="خطأ في المنشورات">
              <Suspense fallback={<TabFallback />}>
                <OrganizationPosts
                  organizationId={organization.id}
                  organizationName={organization.name}
                  organizationLogo={orgData?.logo_url}
                  isOwnOrganization={true}
                />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          {/* البيانات الأساسية */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  {t('orgProfile.basicDataTitle')}
                </CardTitle>
                <CardDescription>{t('orgProfile.basicDataDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('orgProfile.orgNameAr')}</Label>
                    <Input value={orgData?.name || ''} onChange={(e) => setOrgData({ ...orgData, name: e.target.value })} disabled={!isCompanyAdmin} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('orgProfile.orgNameEn')}</Label>
                    <Input value={orgData?.name_en || ''} onChange={(e) => setOrgData({ ...orgData, name_en: e.target.value })} disabled={!isCompanyAdmin} dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('orgProfile.activityType')}</Label>
                    <select
                      value={orgData?.activity_type || ''}
                      onChange={(e) => setOrgData({ ...orgData, activity_type: e.target.value })}
                      disabled={!isCompanyAdmin}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">اختر نوع النشاط</option>
                      {['تجاري','صناعي','خدمي','زراعي','حرفي','مهني','صحي','تعليمي','سياحي','عقاري','لوجستي','تكنولوجي','بيئي','إنشائي','تعديني','غذائي','بتروكيماوي','حكومي','غير ربحي','مختلط','أخرى'].map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('orgProfile.productionCapacity')}</Label>
                    <Input value={orgData?.production_capacity || ''} onChange={(e) => setOrgData({ ...orgData, production_capacity: e.target.value })} disabled={!isCompanyAdmin} />
                  </div>
                </div>
                <Separator />
                <LegalDataSection orgData={orgData} organizationType={organization.organization_type as string} isEditable={isCompanyAdmin} onUpdate={setOrgData} />
                <Separator />
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {t('orgProfile.address')}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>{t('orgProfile.city')}</Label>
                      <Input value={orgData?.city || ''} onChange={(e) => setOrgData({ ...orgData, city: e.target.value })} disabled={!isCompanyAdmin} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('orgProfile.region')}</Label>
                      <Input value={orgData?.region || ''} onChange={(e) => setOrgData({ ...orgData, region: e.target.value })} disabled={!isCompanyAdmin} />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label>{t('orgProfile.detailedAddress')}</Label>
                      <Input value={orgData?.address || ''} onChange={(e) => setOrgData({ ...orgData, address: e.target.value })} disabled={!isCompanyAdmin} />
                    </div>
                  </div>
                </div>
                <SaveButton />
              </CardContent>
            </Card>
          </TabsContent>

          {/* الممثلون */}
          <TabsContent value="representatives">
            <div className="space-y-4">
              {/* الممثل القانوني */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" />الممثل القانوني</CardTitle>
                  <CardDescription>الشخص المخول قانونياً بتمثيل الجهة</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>الاسم الكامل</Label><Input value={orgData?.representative_name || ''} onChange={(e) => setOrgData({ ...orgData, representative_name: e.target.value })} disabled={!isCompanyAdmin} /></div>
                    <div className="space-y-2"><Label>رقم الهوية الوطنية</Label><Input value={orgData?.representative_national_id || ''} onChange={(e) => setOrgData({ ...orgData, representative_national_id: e.target.value })} disabled={!isCompanyAdmin} /></div>
                    <div className="space-y-2"><Label>المنصب</Label><Input value={orgData?.representative_position || ''} onChange={(e) => setOrgData({ ...orgData, representative_position: e.target.value })} disabled={!isCompanyAdmin} /></div>
                    <div className="space-y-2"><Label>رقم الهاتف</Label><Input value={orgData?.representative_phone || ''} onChange={(e) => setOrgData({ ...orgData, representative_phone: e.target.value })} disabled={!isCompanyAdmin} dir="ltr" /></div>
                    <div className="space-y-2 md:col-span-2"><Label>البريد الإلكتروني</Label><Input value={orgData?.representative_email || ''} onChange={(e) => setOrgData({ ...orgData, representative_email: e.target.value })} disabled={!isCompanyAdmin} type="email" dir="ltr" /></div>
                  </div>
                </CardContent>
              </Card>
              {/* المفوض */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" />المفوض</CardTitle>
                  <CardDescription>الشخص المفوض من قبل الممثل القانوني</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>الاسم الكامل</Label><Input value={orgData?.delegate_name || ''} onChange={(e) => setOrgData({ ...orgData, delegate_name: e.target.value })} disabled={!isCompanyAdmin} /></div>
                    <div className="space-y-2"><Label>رقم الهوية الوطنية</Label><Input value={orgData?.delegate_national_id || ''} onChange={(e) => setOrgData({ ...orgData, delegate_national_id: e.target.value })} disabled={!isCompanyAdmin} /></div>
                    <div className="space-y-2"><Label>رقم الهاتف</Label><Input value={orgData?.delegate_phone || ''} onChange={(e) => setOrgData({ ...orgData, delegate_phone: e.target.value })} disabled={!isCompanyAdmin} dir="ltr" /></div>
                    <div className="space-y-2"><Label>البريد الإلكتروني</Label><Input value={orgData?.delegate_email || ''} onChange={(e) => setOrgData({ ...orgData, delegate_email: e.target.value })} disabled={!isCompanyAdmin} type="email" dir="ltr" /></div>
                  </div>
                </CardContent>
              </Card>
              {/* الموكل */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />الموكل</CardTitle>
                  <CardDescription>بيانات الموكل (إن وجد)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>الاسم الكامل</Label><Input value={orgData?.agent_name || ''} onChange={(e) => setOrgData({ ...orgData, agent_name: e.target.value })} disabled={!isCompanyAdmin} /></div>
                    <div className="space-y-2"><Label>رقم الهوية الوطنية</Label><Input value={orgData?.agent_national_id || ''} onChange={(e) => setOrgData({ ...orgData, agent_national_id: e.target.value })} disabled={!isCompanyAdmin} /></div>
                    <div className="space-y-2"><Label>رقم الهاتف</Label><Input value={orgData?.agent_phone || ''} onChange={(e) => setOrgData({ ...orgData, agent_phone: e.target.value })} disabled={!isCompanyAdmin} dir="ltr" /></div>
                    <div className="space-y-2"><Label>البريد الإلكتروني</Label><Input value={orgData?.agent_email || ''} onChange={(e) => setOrgData({ ...orgData, agent_email: e.target.value })} disabled={!isCompanyAdmin} type="email" dir="ltr" /></div>
                  </div>
                </CardContent>
              </Card>
              <SaveButton />
            </div>
          </TabsContent>

          {/* التواصل */}
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Phone className="w-5 h-5" />بيانات التواصل</CardTitle>
                <CardDescription>معلومات الاتصال بالجهة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Mail className="w-4 h-4" />البريد الإلكتروني</Label>
                    <Input value={orgData?.email || ''} onChange={(e) => setOrgData({ ...orgData, email: e.target.value })} disabled={!isCompanyAdmin} type="email" dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Phone className="w-4 h-4" />رقم الهاتف الأساسي</Label>
                    <Input value={orgData?.phone || ''} onChange={(e) => setOrgData({ ...orgData, phone: e.target.value })} disabled={!isCompanyAdmin} dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Phone className="w-4 h-4" />رقم الهاتف الثانوي</Label>
                    <Input value={orgData?.secondary_phone || ''} onChange={(e) => setOrgData({ ...orgData, secondary_phone: e.target.value })} disabled={!isCompanyAdmin} dir="ltr" />
                  </div>
                </div>
                <SaveButton />
              </CardContent>
            </Card>
          </TabsContent>

          {/* الموقع والصور */}
          <TabsContent value="location">
            <ErrorBoundary fallbackTitle="خطأ في الموقع">
              <Suspense fallback={<TabFallback />}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <LocationSettings
                      organizationId={organization.id}
                      data={{
                        location_url: orgData?.location_url, address_details: orgData?.address_details,
                        location_description: orgData?.location_description, working_hours: orgData?.working_hours,
                        is_location_public: orgData?.is_location_public,
                        location_lat: orgData?.location_lat, location_lng: orgData?.location_lng,
                        address: orgData?.address, city: orgData?.city, region: orgData?.region,
                      }}
                      isEditable={isCompanyAdmin}
                      onUpdate={fetchOrganizationData}
                    />
                    <OrganizationPhotoGallery organizationId={organization.id} isEditable={isCompanyAdmin} />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-center">👁️ كيف يراك الآخرون</h3>
                    <BusinessProfileView organizationId={organization.id} organizationName={organization.name} orgData={orgData} isAuthorized={true} />
                  </div>
                </div>
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          {/* الوثائق */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />الوثائق والمستندات</CardTitle>
                <CardDescription>رفع وإدارة الوثائق القانونية للمؤسسة (PDF أو صور)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
                        <input type="file" id={`upload-${type}`} className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => handleFileUpload(e, type)} disabled={uploading} />
                        <label htmlFor={`upload-${type}`} className="cursor-pointer flex flex-col items-center gap-2">
                          <Upload className="w-8 h-8 text-muted-foreground" />
                          <span className="font-medium">{label}</span>
                          <span className="text-xs text-muted-foreground">PDF أو صورة (حد 10MB)</span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
                {(uploading || aiExtracting) && (
                  <div className="flex items-center justify-center gap-2 py-4">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{aiExtracting ? '🧠 جاري استخراج البيانات بالذكاء الاصطناعي...' : 'جاري رفع الملف...'}</span>
                  </div>
                )}
                <Separator />
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
                                {getDocumentTypeLabel(doc.document_type)} • {doc.file_size ? ` ${(doc.file_size / 1024).toFixed(1)} KB` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleDownloadDocument(doc)}><Download className="w-4 h-4" /></Button>
                            {isCompanyAdmin && (
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteDocument(doc)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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

          {/* تحليل الجهة */}
          <TabsContent value="analysis">
            <ErrorBoundary fallbackTitle="خطأ في تحليل الجهة">
              <Suspense fallback={<TabFallback />}>
                <OrganizationAnalysis organizationId={organization.id} />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          {/* الختم والتوقيع */}
          <TabsContent value="stamps">
            <ErrorBoundary fallbackTitle="خطأ في الختم والتوقيع">
              <Suspense fallback={<TabFallback />}>
                <div className="space-y-6">
                  <StampSignatureUpload
                    organizationId={organization.id}
                    stampUrl={orgData?.stamp_url || null}
                    signatureUrl={orgData?.signature_url || null}
                    onUpdate={fetchOrganizationData}
                    disabled={!isCompanyAdmin}
                  />
                  <BiometricManager />
                  {isCompanyAdmin && <OrganizationSignatureSettings />}
                </div>
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          {/* الشهادات */}
          <TabsContent value="certificates">
            <ErrorBoundary fallbackTitle="خطأ في الشهادات">
              <Suspense fallback={<TabFallback />}>
                <LMSProfileCertificates />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          {/* الإفادة */}
          <TabsContent value="attestation">
            <ErrorBoundary fallbackTitle="خطأ في الإفادة">
              <Suspense fallback={<TabFallback />}>
                <AttestationTabContent organizationId={organization.id} />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          {/* المشاركة */}
          <TabsContent value="sharing">
            <ErrorBoundary fallbackTitle="خطأ في إعدادات المشاركة">
              <Suspense fallback={<TabFallback />}>
                <OrgPublicProfileSettings />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default OrganizationProfile;
