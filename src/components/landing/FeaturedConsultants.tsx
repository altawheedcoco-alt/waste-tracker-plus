import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Award, ShieldCheck, ArrowLeft, ArrowRight, BadgeCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { withTimeout, logNetworkError } from '@/lib/networkGuard';

interface FeaturedOrg {
  id: string;
  name: string;
  organization_type: string;
  logo_url: string | null;
  bio: string | null;
  city: string | null;
  governorate: string | null;
}

const typeConfig: Record<string, { label: string; labelEn: string; icon: typeof Building2; color: string }> = {
  consultant: { label: 'استشاري بيئي', labelEn: 'Environmental Consultant', icon: ShieldCheck, color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200' },
  consulting_office: { label: 'مكتب استشاري', labelEn: 'Consulting Office', icon: Building2, color: 'bg-blue-500/10 text-blue-700 border-blue-200' },
  iso_body: { label: 'جهة مانحة للأيزو', labelEn: 'ISO Certification Body', icon: Award, color: 'bg-amber-500/10 text-amber-700 border-amber-200' },
};

const FeaturedConsultants = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['featured-consultants'],
    queryFn: async () => {
      try {
        const { data, error } = await withTimeout('featured-consultants', async () => {
          return await supabase
            .from('organizations')
            .select('id, name, organization_type, logo_url, bio, city, region')
            .in('organization_type', ['consultant', 'consulting_office', 'iso_body'] as any[])
            .eq('is_active', true)
            .limit(6);
        });
        if (error || !data) return [];
        return (data as any[]).map(d => ({ ...d, governorate: d.region })) as FeaturedOrg[];
      } catch (error) {
        logNetworkError('featured-consultants', error);
        return [];
      }
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
  });

  if (isLoading || orgs.length === 0) return null;

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 animate-fade-up">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <BadgeCheck className="h-4 w-4" />
            {isAr ? 'شركاء معتمدون' : 'Certified Partners'}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            {isAr ? 'دليل الاستشاريين والجهات المعتمدة' : 'Consultants & Certified Bodies Directory'}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {isAr
              ? 'استشاريون بيئيون ومكاتب استشارية وجهات مانحة لشهادات الأيزو مسجلة ومُتحقق من بياناتها'
              : 'Verified environmental consultants, consulting offices, and ISO certification bodies'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {orgs.map((org, i) => {
            const config = typeConfig[org.organization_type] || typeConfig.consultant;
            const Icon = config.icon;
            return (
              <div
                key={org.id}
                className="group bg-card border border-border rounded-xl p-5 hover:shadow-lg hover:border-primary/30 transition-all duration-300 animate-fade-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-start gap-3 mb-3">
                  {org.logo_url ? (
                    <img src={org.logo_url} alt={org.name} className="w-12 h-12 rounded-lg object-cover border" loading="lazy" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{org.name}</h3>
                    {(org.city || org.governorate) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {[org.city, org.governorate].filter(Boolean).join(isAr ? '، ' : ', ')}
                      </p>
                    )}
                  </div>
                </div>

                <Badge variant="outline" className={`text-[11px] mb-3 ${config.color}`}>
                  <Icon className={`h-3 w-3 ${isAr ? 'ml-1' : 'mr-1'}`} />
                  {isAr ? config.label : config.labelEn}
                </Badge>

                {org.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{org.bio}</p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                    {isAr ? 'مُتحقق' : 'Verified'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10 animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <Button variant="outline" className="gap-2" onClick={() => navigate('/auth')}>
            {isAr ? 'سجل كاستشاري أو مكتب استشاري' : 'Register as a consultant or consulting office'}
            {isAr ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedConsultants;
