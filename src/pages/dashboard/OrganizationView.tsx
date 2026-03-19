import { useState, useEffect } from 'react';
import { EntityProfileArchive } from '@/components/archive';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Building2, 
  Phone,
  Mail,
  MapPin,
  Shield,
  Users,
  Loader2,
  MessageCircle,
  ArrowRight,
  Globe,
  Briefcase,
  FileText,
  Newspaper,
  Target,
  FolderOpen,
} from 'lucide-react';
import ProfileHeader from '@/components/organization/ProfileHeader';
import BackButton from '@/components/ui/back-button';
import OrganizationPosts from '@/components/organization/OrganizationPosts';
import OrganizationPortfolio from '@/components/organization/OrganizationPortfolio';

interface OrganizationData {
  id: string;
  name: string;
  name_en: string | null;
  organization_type: 'generator' | 'transporter' | 'recycler';
  email: string;
  phone: string;
  secondary_phone: string | null;
  address: string;
  city: string;
  region: string | null;
  commercial_register: string | null;
  environmental_license: string | null;
  activity_type: string | null;
  production_capacity: string | null;
  logo_url: string | null;
  cover_url: string | null;
  is_verified: boolean | null;
  is_active: boolean | null;
  representative_name: string | null;
  representative_position: string | null;
  representative_phone: string | null;
  representative_email: string | null;
  representative_national_id: string | null;
  client_code: string | null;
  // Portfolio fields
  description: string | null;
  vision: string | null;
  policy: string | null;
  headquarters: string | null;
  branches: any[] | null;
  field_of_work: string | null;
}

const OrganizationView = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const { user, organization: myOrganization } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orgData, setOrgData] = useState<OrganizationData | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (organizationId) {
      fetchOrganizationData();
    }
  }, [user, organizationId]);

  const fetchOrganizationData = async () => {
    if (!organizationId) return;

    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        toast.error('لم يتم العثور على الجهة');
        navigate('/dashboard/partners');
        return;
      }

      setOrgData(data as OrganizationData);
    } catch (error) {
      console.error('Error fetching organization:', error);
      toast.error('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
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

  const handleStartChat = () => {
    if (!orgData) return;
    // Navigate to chat with this specific organization
    navigate(`/dashboard/chat?partnerId=${orgData.id}&partnerName=${encodeURIComponent(orgData.name)}`);
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

  if (!orgData) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">لم يتم العثور على الجهة</h3>
            <p className="text-muted-foreground mb-4">الجهة المطلوبة غير موجودة أو ليس لديك صلاحية لعرضها</p>
            <Button onClick={() => navigate('/dashboard/partners')}>
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة للشركاء
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const isOwnOrganization = myOrganization?.id === orgData.id;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <BackButton fallbackPath="/dashboard/partners" />

        {/* Profile Header with Cover and Logo */}
        <Card className="overflow-hidden p-0">
          <ProfileHeader
            organization={{
              id: orgData.id,
              name: orgData.name,
              name_en: orgData.name_en || undefined,
              organization_type: orgData.organization_type,
              logo_url: orgData.logo_url || undefined,
              cover_url: orgData.cover_url || undefined,
              is_verified: orgData.is_verified || false,
              city: orgData.city,
              region: orgData.region || undefined,
              client_code: orgData.client_code || undefined,
              commercial_register: orgData.commercial_register || undefined,
              environmental_license: orgData.environmental_license || undefined,
              representative_name: orgData.representative_name || undefined,
              representative_national_id: orgData.representative_national_id || undefined,
              representative_phone: orgData.representative_phone || undefined,
            }}
            isEditable={false}
          />
        </Card>

        {/* Action Buttons */}
        {!isOwnOrganization && (
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleStartChat} className="gap-2">
              <MessageCircle className="w-4 h-4" />
              بدء محادثة
            </Button>
          </div>
        )}

        {/* Organization Details */}
        <Tabs defaultValue="portfolio" className="space-y-4" dir="rtl">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="portfolio">
              <Target className="w-4 h-4 ml-2" />
              البورتفوليو
            </TabsTrigger>
            <TabsTrigger value="archive">
              <FolderOpen className="w-4 h-4 ml-2" />
              الأرشيف
            </TabsTrigger>
            <TabsTrigger value="posts">
              <Newspaper className="w-4 h-4 ml-2" />
              المنشورات
            </TabsTrigger>
            <TabsTrigger value="about">
              <Building2 className="w-4 h-4 ml-2" />
              نبذة عن الجهة
            </TabsTrigger>
            <TabsTrigger value="contact">
              <Phone className="w-4 h-4 ml-2" />
              معلومات التواصل
            </TabsTrigger>
            <TabsTrigger value="representative">
              <Users className="w-4 h-4 ml-2" />
              الممثل القانوني
            </TabsTrigger>
          </TabsList>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio">
            <OrganizationPortfolio
              organizationId={orgData.id}
              organizationName={orgData.name}
              organizationType={orgData.organization_type}
              currentData={{
                description: orgData.description,
                vision: orgData.vision,
                policy: orgData.policy,
                headquarters: orgData.headquarters,
                branches: orgData.branches,
                field_of_work: orgData.field_of_work,
                address: orgData.address,
                city: orgData.city,
                activity_type: orgData.activity_type,
              }}
              isEditable={false}
              onUpdate={() => {}}
            />
          </TabsContent>

          {/* Archive Tab */}
          <TabsContent value="archive">
            <EntityProfileArchive
              partnerId={orgData.id}
              partnerName={orgData.name}
            />
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts">
            <OrganizationPosts
              organizationId={orgData.id}
              organizationName={orgData.name}
              organizationLogo={orgData.logo_url}
              isOwnOrganization={isOwnOrganization}
            />
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  معلومات الجهة
                </CardTitle>
                <CardDescription>البيانات الأساسية والتسجيلية</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Building2 className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">نوع الجهة</p>
                        <p className="font-medium">{getOrganizationTypeLabel(orgData.organization_type)}</p>
                      </div>
                    </div>

                    {orgData.activity_type && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Briefcase className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">نوع النشاط</p>
                          <p className="font-medium">{orgData.activity_type}</p>
                        </div>
                      </div>
                    )}

                    {orgData.production_capacity && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Globe className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">الطاقة الإنتاجية</p>
                          <p className="font-medium">{orgData.production_capacity}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Registration Info */}
                  <div className="space-y-4">
                    {orgData.commercial_register && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <FileText className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">رقم السجل التجاري</p>
                          <p className="font-medium">{orgData.commercial_register}</p>
                        </div>
                      </div>
                    )}

                    {orgData.environmental_license && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Shield className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">رقم الترخيص البيئي</p>
                          <p className="font-medium">{orgData.environmental_license}</p>
                        </div>
                      </div>
                    )}
                  </div>
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
                  معلومات التواصل
                </CardTitle>
                <CardDescription>بيانات الاتصال والعنوان</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contact Info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Mail className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                        <p className="font-medium" dir="ltr">{orgData.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Phone className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                        <p className="font-medium" dir="ltr">{orgData.phone}</p>
                      </div>
                    </div>

                    {orgData.secondary_phone && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Phone className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">رقم الهاتف الثانوي</p>
                          <p className="font-medium" dir="ltr">{orgData.secondary_phone}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Address Info */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <MapPin className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">العنوان</p>
                        <p className="font-medium">{orgData.address}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {orgData.city}
                          {orgData.region && ` - ${orgData.region}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Representative Tab */}
          <TabsContent value="representative">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  الممثل القانوني
                </CardTitle>
                <CardDescription>معلومات الممثل القانوني للجهة</CardDescription>
              </CardHeader>
              <CardContent>
                {orgData.representative_name ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Users className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">الاسم الكامل</p>
                          <p className="font-medium">{orgData.representative_name}</p>
                        </div>
                      </div>

                      {orgData.representative_position && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <Briefcase className="w-5 h-5 text-primary" />
                          <div>
                            <p className="text-sm text-muted-foreground">المنصب</p>
                            <p className="font-medium">{orgData.representative_position}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {orgData.representative_phone && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <Phone className="w-5 h-5 text-primary" />
                          <div>
                            <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                            <p className="font-medium" dir="ltr">{orgData.representative_phone}</p>
                          </div>
                        </div>
                      )}

                      {orgData.representative_email && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <Mail className="w-5 h-5 text-primary" />
                          <div>
                            <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                            <p className="font-medium" dir="ltr">{orgData.representative_email}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لم يتم إضافة معلومات الممثل القانوني</p>
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

export default OrganizationView;
