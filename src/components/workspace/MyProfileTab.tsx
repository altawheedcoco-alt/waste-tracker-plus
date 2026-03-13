import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Phone, Building2, Briefcase, Calendar, MapPin, IdCard } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const MyProfileTab = () => {
  const { profile, organization, user } = useAuth();

  // Get position from org structure
  const { data: position } = useQuery({
    queryKey: ['my-position', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data } = await supabase
        .from('organization_positions')
        .select('title, level, department, is_ai_operator')
        .eq('holder_profile_id', profile.id)
        .maybeSingle();
      return data;
    },
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 10,
  });

  const initials = (profile?.full_name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2);

  const infoItems = [
    { icon: Mail, label: 'البريد الإلكتروني', value: user?.email },
    { icon: Phone, label: 'الهاتف', value: profile?.phone },
    { icon: Building2, label: 'المنظمة', value: organization?.name },
    { icon: Briefcase, label: 'المنصب', value: position?.title },
    { icon: MapPin, label: 'القسم', value: position?.department },
    { icon: Calendar, label: 'تاريخ الانضمام', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ar-EG') : undefined },
    { icon: IdCard, label: 'الرقم القومي', value: profile?.national_id },
  ].filter(item => item.value);

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Profile Card */}
      <Card className="md:col-span-1 border-primary/10">
        <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
          <Avatar className="w-24 h-24 border-4 border-primary/20">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-primary/60 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold">{profile?.full_name || 'عضو'}</h2>
            {position?.title && (
              <p className="text-sm text-muted-foreground mt-1">{position.title}</p>
            )}
            <div className="flex items-center justify-center gap-2 mt-2">
              {position?.is_ai_operator && (
                <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">🤖 AI</Badge>
              )}
              <Badge variant="secondary">{organization?.name}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5 text-primary" />
            البيانات الشخصية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {infoItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyProfileTab;
