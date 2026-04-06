/**
 * ملف الاستشاري المهني
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserCircle, Award, Briefcase, MapPin, Star } from 'lucide-react';

const profile = {
  name: 'د. أحمد سالم',
  title: 'استشاري بيئي أول',
  specializations: ['دراسات الأثر البيئي', 'إدارة المخلفات الخطرة', 'التدقيق البيئي'],
  certifications: ['مراجع بيئي معتمد (EEAA)', 'ISO 14001 Lead Auditor', 'NEBOSH'],
  experience: '15 سنة',
  projectsCompleted: 87,
  rating: 4.8,
  location: 'القاهرة، مصر',
};

const ConsultantProfile = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <UserCircle className="h-4 w-4 text-primary" />
        الملف المهني
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="text-center p-3 rounded-lg bg-primary/5">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary mx-auto mb-2">
          {profile.name.charAt(0)}
        </div>
        <div className="text-base font-bold">{profile.name}</div>
        <p className="text-xs text-muted-foreground">{profile.title}</p>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="flex items-center gap-0.5 text-amber-500 text-xs">
            <Star className="h-3 w-3 fill-current" />{profile.rating}
          </span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <MapPin className="h-2.5 w-2.5" />{profile.location}
          </span>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-medium text-muted-foreground mb-1">التخصصات</p>
        <div className="flex flex-wrap gap-1">
          {profile.specializations.map((s, i) => (
            <Badge key={i} variant="secondary" className="text-[9px]">{s}</Badge>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-medium text-muted-foreground mb-1">الشهادات</p>
        <div className="space-y-1">
          {profile.certifications.map((c, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px]">
              <Award className="h-3 w-3 text-primary" />
              {c}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 rounded border text-center">
          <div className="text-lg font-bold text-primary">{profile.projectsCompleted}</div>
          <p className="text-[9px] text-muted-foreground">مشروع مكتمل</p>
        </div>
        <div className="p-2 rounded border text-center">
          <div className="text-lg font-bold text-primary">{profile.experience}</div>
          <p className="text-[9px] text-muted-foreground">خبرة</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default ConsultantProfile;
