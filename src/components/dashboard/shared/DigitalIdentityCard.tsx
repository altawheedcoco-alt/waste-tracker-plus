import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  Building2, Mail, Phone, Globe, MapPin, Shield, Users, Truck,
  FileCheck, Calendar, Hash, Eye, EyeOff, Settings2, BadgeCheck,
  Briefcase, Factory, Scale, Award, Link2, UserCheck, Handshake,
  ClipboardList, Crown, Printer, QrCode, Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useResolvedUrl } from '@/hooks/useResolvedUrl';
import { printDigitalIdentityCard } from './printTemplates/printDigitalIdentityCard';

// Organization type labels
const orgTypeLabels: Record<string, string> = {
  generator: 'منشأة مولدة للمخلفات',
  transporter: 'شركة نقل',
  recycler: 'مصنع تدوير / معالجة',
  disposal: 'جهة تخلص نهائي',
  consultant: 'استشاري بيئي',
  consulting_office: 'مكتب استشاري',
  iso_body: 'جهة اعتماد أيزو',
  regulator: 'جهة رقابية',
  transport_office: 'مكتب نقل',
};

interface VisibilitySettings {
  show_email: boolean;
  show_phone: boolean;
  show_address: boolean;
  show_representative: boolean;
  show_licenses: boolean;
  show_partners_count: boolean;
  show_employees_count: boolean;
  show_shipments_stats: boolean;
  show_website: boolean;
  show_description: boolean;
  show_working_hours: boolean;
  show_delegate: boolean;
}

const defaultVisibility: VisibilitySettings = {
  show_email: true,
  show_phone: true,
  show_address: true,
  show_representative: true,
  show_licenses: true,
  show_partners_count: true,
  show_employees_count: true,
  show_shipments_stats: true,
  show_website: true,
  show_description: true,
  show_working_hours: false,
  show_delegate: true,
};

interface OrgStats {
  partnersCount: number;
  employeesCount: number;
  driversCount: number;
  shipmentsThisYear: number;
  totalShipments: number;
  delegatesCount: number;
  workersCount: number;
  externalPartnersCount: number;
}

const DigitalIdentityCard = () => {
  const { organization, profile, user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [visibility, setVisibility] = useState<VisibilitySettings>(defaultVisibility);
  const [showSettings, setShowSettings] = useState(false);

  const org = organization as any;
  const resolvedLogoUrl = useResolvedUrl(org?.logo_url);
  const resolvedCoverUrl = useResolvedUrl(org?.cover_url);

  const orgId = organization?.id;

  // Fetch stats
  useEffect(() => {
    if (!orgId) return;
    const fetchStats = async () => {
      setLoading(true);
      try {
        const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();

        const [
          membersRes,
          driversRes,
          shipmentsYearRes,
          totalShipmentsRes,
          externalPartnersRes,
          delegatesRes,
        ] = await Promise.all([
          supabase.from('organization_members').select('id', { count: 'exact', head: true }).eq('organization_id', orgId) as any,
          supabase.from('drivers').select('id', { count: 'exact', head: true }).eq('organization_id', orgId) as any,
          supabase.from('shipments').select('id', { count: 'exact', head: true })
            .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId}`)
            .gte('created_at', yearStart) as any,
          supabase.from('shipments').select('id', { count: 'exact', head: true })
            .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId}`) as any,
          supabase.from('external_partners').select('id', { count: 'exact', head: true }).eq('organization_id', orgId) as any,
          (supabase.from('organization_members' as any).select('id', { count: 'exact', head: true }) as any).eq('organization_id', orgId).eq('role', 'delegate'),
        ]);

        // Count verified partnerships
        const { count: partnershipsCount } = await (supabase
          .from('verified_partnerships')
          .select('id', { count: 'exact', head: true })
          .or(`requester_org_id.eq.${orgId},partner_org_id.eq.${orgId}`)
          .eq('status', 'active') as any);

        setStats({
          partnersCount: (partnershipsCount || 0) + (externalPartnersRes.count || 0),
          employeesCount: membersRes.count || 0,
          driversCount: driversRes.count || 0,
          shipmentsThisYear: shipmentsYearRes.count || 0,
          totalShipments: totalShipmentsRes.count || 0,
          delegatesCount: delegatesRes.count || 0,
          workersCount: (membersRes.count || 0) + (driversRes.count || 0),
          externalPartnersCount: externalPartnersRes.count || 0,
        });
      } catch (err) {
        console.error('Error fetching ID card stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [orgId]);

  const toggleVisibility = useCallback((key: keyof VisibilitySettings) => {
    setVisibility(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  if (!organization) return null;

  const orgType = org.organization_type as string;
  const isVerified = org.is_verified;
  const createdAt = org.created_at ? new Date(org.created_at) : null;
  const memberSince = createdAt ? `${createdAt.getFullYear()}` : '—';

  const visibilityLabels: Record<keyof VisibilitySettings, string> = {
    show_email: 'البريد الإلكتروني',
    show_phone: 'أرقام التواصل',
    show_address: 'العنوان والموقع',
    show_representative: 'الممثل القانوني',
    show_licenses: 'التراخيص والسجلات',
    show_partners_count: 'عدد الشركاء',
    show_employees_count: 'عدد الموظفين والعمالة',
    show_shipments_stats: 'إحصائيات الشحنات',
    show_website: 'الموقع الإلكتروني',
    show_description: 'الوصف والنبذة',
    show_working_hours: 'ساعات العمل',
    show_delegate: 'المفوضون',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
        {/* Decorative header stripe */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary via-primary/70 to-primary/40" />

        <CardHeader className="pb-3 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {org.logo_url ? (
                <img src={org.logo_url} alt="Logo" className="w-14 h-14 rounded-xl object-cover ring-2 ring-primary/20 shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-7 h-7 text-primary" />
                </div>
              )}
              <div className="min-w-0">
                <CardTitle className="text-lg leading-tight truncate flex items-center gap-2">
                  {org.name}
                  {isVerified && <BadgeCheck className="w-5 h-5 text-primary shrink-0" />}
                </CardTitle>
                {org.name_en && (
                  <p className="text-xs text-muted-foreground truncate">{org.name_en}</p>
                )}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                    <Factory className="w-3 h-3" />
                    {orgTypeLabels[orgType] || orgType}
                  </Badge>
                  {org.partner_code && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1 font-mono">
                      <Hash className="w-3 h-3" />
                      {org.partner_code}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8"
                onClick={() => printDigitalIdentityCard({
                  organization: org,
                  stats,
                  visibility: visibility as unknown as Record<string, boolean>,
                  resolvedLogoUrl,
                  resolvedCoverUrl,
                })}
                title="طباعة الهوية الرقمية"
              >
                <Printer className="w-4 h-4" />
              </Button>

              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                    <Settings2 className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl">
                  <DialogHeader>
                    <DialogTitle>إعدادات الظهور</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="max-h-[60vh]">
                    <div className="space-y-3 p-1">
                      {(Object.keys(visibilityLabels) as Array<keyof VisibilitySettings>).map(key => (
                        <div key={key} className="flex items-center justify-between gap-2">
                          <span className="text-sm">{visibilityLabels[key]}</span>
                          <Switch checked={visibility[key]} onCheckedChange={() => toggleVisibility(key)} />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 text-sm">
          {/* Description */}
          {visibility.show_description && org.bio && (
            <p className="text-muted-foreground text-xs leading-relaxed line-clamp-3">{org.bio}</p>
          )}

          {/* Quick Stats Grid */}
          {loading ? (
            <div className="grid grid-cols-3 gap-2">
              {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : stats && (
            <div className="grid grid-cols-3 gap-2">
              <StatBox icon={Handshake} label="الشركاء" value={stats.partnersCount} visible={visibility.show_partners_count} />
              <StatBox icon={Users} label="الموظفين" value={stats.employeesCount} visible={visibility.show_employees_count} />
              <StatBox icon={Truck} label="السائقين" value={stats.driversCount} visible={visibility.show_employees_count} />
              <StatBox icon={ClipboardList} label="شحنات العام" value={stats.shipmentsThisYear} visible={visibility.show_shipments_stats} />
              <StatBox icon={Scale} label="إجمالي الشحنات" value={stats.totalShipments} visible={visibility.show_shipments_stats} />
              <StatBox icon={UserCheck} label="المفوضون" value={stats.delegatesCount} visible={visibility.show_delegate} />
            </div>
          )}

          <Separator />

          {/* Contact Info */}
          <div className="space-y-2">
            {visibility.show_email && org.email && (
              <InfoRow icon={Mail} label="البريد" value={org.email} />
            )}
            {visibility.show_phone && (
              <>
                {org.phone && <InfoRow icon={Phone} label="الهاتف" value={org.phone} />}
                {org.secondary_phone && <InfoRow icon={Phone} label="هاتف ثانوي" value={org.secondary_phone} />}
              </>
            )}
            {visibility.show_website && org.website_url && (
              <InfoRow icon={Globe} label="الموقع" value={org.website_url} isLink />
            )}
            {visibility.show_address && (
              <>
                {org.address && <InfoRow icon={MapPin} label="العنوان" value={`${org.address}${org.city ? ` - ${org.city}` : ''}${org.region ? ` - ${org.region}` : ''}`} />}
                {org.headquarters && <InfoRow icon={Building2} label="المقر الرئيسي" value={org.headquarters} />}
              </>
            )}
          </div>

          {/* Representative */}
          {visibility.show_representative && org.representative_name && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5" /> الممثل القانوني
                </h4>
                <InfoRow icon={UserCheck} label="الاسم" value={org.representative_name} />
                {org.representative_position && <InfoRow icon={Briefcase} label="المنصب" value={org.representative_position} />}
                {org.representative_phone && <InfoRow icon={Phone} label="الهاتف" value={org.representative_phone} />}
                {org.representative_email && <InfoRow icon={Mail} label="البريد" value={org.representative_email} />}
              </div>
            </>
          )}

          {/* Licenses & Legal */}
          {visibility.show_licenses && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5" /> التراخيص والسجلات
                </h4>
                {org.commercial_register && <InfoRow icon={ClipboardList} label="السجل التجاري" value={org.commercial_register} />}
                {org.tax_card && <InfoRow icon={Hash} label="البطاقة الضريبية" value={org.tax_card} />}
                {org.environmental_license && <InfoRow icon={Shield} label="الترخيص البيئي" value={org.environmental_license} />}
                {org.license_number && <InfoRow icon={Award} label="رقم الترخيص" value={org.license_number} />}
                {org.wmra_license && <InfoRow icon={Shield} label="ترخيص WMRA" value={org.wmra_license} />}
                {org.industrial_registry && <InfoRow icon={Factory} label="السجل الصناعي" value={org.industrial_registry} />}
                {org.license_expiry_date && <InfoRow icon={Calendar} label="انتهاء الترخيص" value={org.license_expiry_date} />}
                {org.digital_declaration_number && <InfoRow icon={Hash} label="رقم الإقرار الرقمي" value={org.digital_declaration_number} />}
              </div>
            </>
          )}

          {/* Activity & Scope */}
          {(org.activity_type || org.field_of_work || org.registered_activity) && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" /> النشاط ونطاق العمل
                </h4>
                {org.activity_type && <InfoRow icon={Factory} label="نوع النشاط" value={org.activity_type} />}
                {org.field_of_work && <InfoRow icon={Briefcase} label="مجال العمل" value={org.field_of_work} />}
                {org.registered_activity && <InfoRow icon={ClipboardList} label="النشاط المسجل" value={org.registered_activity} />}
                {org.production_capacity && <InfoRow icon={Scale} label="الطاقة الإنتاجية" value={org.production_capacity} />}
                {org.hazardous_certified && (
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-destructive" />
                    <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">مرخص للنفايات الخطرة</Badge>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Membership info */}
          <Separator />
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> عضو منذ {memberSince}
            </span>
            {org.client_code && (
              <span className="font-mono flex items-center gap-1">
                <QrCode className="w-3 h-3" /> {org.client_code}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Sub-components
const StatBox = ({ icon: Icon, label, value, visible }: {
  icon: React.ElementType; label: string; value: number; visible: boolean;
}) => {
  if (!visible) return null;
  return (
    <div className="bg-muted/50 rounded-lg p-2 text-center space-y-0.5">
      <Icon className="w-4 h-4 text-primary mx-auto" />
      <p className="text-lg font-bold leading-none">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value, isLink }: {
  icon: React.ElementType; label: string; value: string; isLink?: boolean;
}) => (
  <div className="flex items-center gap-2 text-xs">
    <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
    <span className="text-muted-foreground shrink-0">{label}:</span>
    {isLink ? (
      <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
        {value}
      </a>
    ) : (
      <span className="font-medium truncate">{value}</span>
    )}
  </div>
);

export default DigitalIdentityCard;
