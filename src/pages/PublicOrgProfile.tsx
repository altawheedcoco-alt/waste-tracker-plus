/**
 * صفحة الملف العام للمنشأة - يمكن لأي شخص الوصول إليها عبر كود المشاركة
 */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Building2, Mail, Phone, MapPin, Shield, FileText, Users,
  Briefcase, Award, Loader2, AlertCircle, Globe, Hash,
} from 'lucide-react';

interface PublicProfile {
  id: string;
  share_code: string;
  show_basic_info: boolean;
  show_contact_info: boolean;
  show_licenses: boolean;
  show_team: boolean;
  show_team_details: boolean;
  show_team_documents: boolean;
  show_statistics: boolean;
  custom_message: string | null;
  organization_id: string;
}

interface OrgData {
  name: string;
  name_en: string | null;
  email: string | null;
  phone: string | null;
  secondary_phone: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  logo_url: string | null;
  activity_type: string | null;
  commercial_register: string | null;
  environmental_license: string | null;
  tax_card: string | null;
  representative_name: string | null;
  representative_position: string | null;
  bio: string | null;
  founded_year: number | null;
  website_url: string | null;
}

interface TeamMember {
  id: string;
  job_title_ar: string | null;
  employee_number: string | null;
  profile: {
    full_name: string;
    avatar_url: string | null;
  } | null;
  position: { title_ar: string } | null;
  department: { name_ar: string } | null;
}

export default function PublicOrgProfile() {
  const { code } = useParams<{ code: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<PublicProfile | null>(null);
  const [org, setOrg] = useState<OrgData | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);

  useEffect(() => {
    if (!code) return;
    loadProfile();
  }, [code]);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);

    // 1. Get sharing settings
    const { data: profileData, error: profileError } = await supabase
      .from('org_public_profiles' as any)
      .select('*')
      .eq('share_code', code)
      .eq('is_active', true)
      .single();

    if (profileError || !profileData) {
      setError('هذا الرابط غير صالح أو تم تعطيله');
      setLoading(false);
      return;
    }

    const p = profileData as any as PublicProfile;
    setSettings(p);

    // 2. Get org data
    const { data: orgData } = await supabase
      .from('organizations')
      .select('name, name_en, email, phone, secondary_phone, address, city, region, logo_url, activity_type, commercial_register, environmental_license, tax_card, representative_name, representative_position, bio, founded_year, website_url')
      .eq('id', p.organization_id)
      .single();

    if (orgData) setOrg(orgData as OrgData);

    // 3. Get team if enabled
    if (p.show_team) {
      const { data: members } = await supabase
        .from('organization_members' as any)
        .select('id, job_title_ar, employee_number, profile_id, position_id, department_id')
        .eq('organization_id', p.organization_id)
        .eq('status', 'active');

      if (members) {
        const enriched = await Promise.all(
          (members as any[]).map(async (m: any) => {
            const [profileRes, posRes, deptRes] = await Promise.all([
              m.profile_id
                ? supabase.from('profiles').select('full_name, avatar_url').eq('id', m.profile_id).single()
                : { data: null },
              m.position_id && p.show_team_details
                ? supabase.from('organization_positions' as any).select('title_ar').eq('id', m.position_id).single()
                : { data: null },
              m.department_id && p.show_team_details
                ? supabase.from('organization_departments' as any).select('name_ar').eq('id', m.department_id).single()
                : { data: null },
            ]);
            return { ...m, profile: profileRes.data, position: posRes.data, department: deptRes.data };
          })
        );
        setTeam(enriched);
      }
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !settings || !org) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">رابط غير صالح</h2>
            <p className="text-muted-foreground">{error || 'لم يتم العثور على بيانات'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background" dir="rtl">
      {/* Header */}
      <div className="bg-primary/5 border-b">
        <div className="max-w-3xl mx-auto p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-primary/20">
              <AvatarImage src={org.logo_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                <Building2 className="w-10 h-10" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{org.name}</h1>
              {org.name_en && <p className="text-sm text-muted-foreground" dir="ltr">{org.name_en}</p>}
              {org.activity_type && (
                <Badge variant="secondary" className="mt-2">{org.activity_type}</Badge>
              )}
            </div>
          </div>
          {settings.custom_message && (
            <p className="mt-4 text-sm text-muted-foreground bg-background/50 p-3 rounded-lg border">
              {settings.custom_message}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Bio */}
        {org.bio && settings.show_basic_info && (
          <Card>
            <CardContent className="p-5">
              <p className="text-sm leading-relaxed">{org.bio}</p>
              {org.founded_year && (
                <p className="text-xs text-muted-foreground mt-2">تأسست عام {org.founded_year}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Contact Info */}
        {settings.show_contact_info && (
          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="font-semibold flex items-center gap-2"><Phone className="w-4 h-4 text-primary" /> بيانات التواصل</h3>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {org.phone && <InfoItem icon={Phone} label="الهاتف" value={org.phone} dir="ltr" />}
                {org.secondary_phone && <InfoItem icon={Phone} label="هاتف إضافي" value={org.secondary_phone} dir="ltr" />}
                {org.email && <InfoItem icon={Mail} label="البريد" value={org.email} dir="ltr" />}
                {org.address && <InfoItem icon={MapPin} label="العنوان" value={`${org.address}${org.city ? ` - ${org.city}` : ''}${org.region ? ` - ${org.region}` : ''}`} />}
                {org.website_url && <InfoItem icon={Globe} label="الموقع" value={org.website_url} dir="ltr" />}
                {org.representative_name && <InfoItem icon={Briefcase} label="الممثل القانوني" value={`${org.representative_name}${org.representative_position ? ` (${org.representative_position})` : ''}`} />}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Licenses */}
        {settings.show_licenses && (
          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="font-semibold flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> التراخيص والسجلات</h3>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {org.commercial_register && <InfoItem icon={FileText} label="السجل التجاري" value={org.commercial_register} />}
                {org.tax_card && <InfoItem icon={Hash} label="البطاقة الضريبية" value={org.tax_card} />}
                {org.environmental_license && <InfoItem icon={Award} label="الترخيص البيئي" value={org.environmental_license} />}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team */}
        {settings.show_team && team.length > 0 && (
          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> فريق العمل
                <Badge variant="outline" className="mr-auto">{team.length} عضو</Badge>
              </h3>
              <Separator />
              <div className="space-y-2">
                {team.map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={m.profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        <Users className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{m.profile?.full_name || 'عضو'}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {m.job_title_ar && <span>{m.job_title_ar}</span>}
                        {settings.show_team_details && m.department?.name_ar && (
                          <Badge variant="outline" className="text-[10px]">{m.department.name_ar}</Badge>
                        )}
                        {settings.show_team_details && m.position?.title_ar && (
                          <Badge variant="outline" className="text-[10px]">{m.position.title_ar}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pb-8 pt-4">
          <p>تم إنشاء هذا الملف التعريفي عبر منصة iRecycle</p>
          <p className="mt-1">جميع البيانات موثقة ومحمية</p>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value, dir }: { icon: any; label: string; value: string; dir?: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium" dir={dir}>{value}</p>
      </div>
    </div>
  );
}
