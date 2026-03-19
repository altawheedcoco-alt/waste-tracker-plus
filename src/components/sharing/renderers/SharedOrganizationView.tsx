import { Building2, MapPin, Phone, Mail, Globe, Calendar, Award, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ClickableImage from '@/components/ui/ClickableImage';

interface SharedOrganizationViewProps {
  data: any;
  accessLevel: string;
}

const orgTypeLabels: Record<string, string> = {
  generator: 'مولّد نفايات',
  transporter: 'ناقل',
  recycler: 'مدوّر',
  disposal: 'مرفق تخلص',
  consultant: 'استشاري بيئي',
  consultant_office: 'مكتب استشاري',
};

const SharedOrganizationView = ({ data, accessLevel }: SharedOrganizationViewProps) => {
  const isPublic = accessLevel === 'public';

  return (
    <div className="space-y-6" dir="rtl">
      {/* Profile Card */}
      <div className="bg-card rounded-xl border overflow-hidden">
        {/* Cover */}
        {data.cover_url && (
          <ClickableImage
            src={data.cover_url}
            gallery={[data.cover_url, data.logo_url].filter(Boolean)}
            className="w-full h-40 object-cover"
          />
        )}

        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            {data.logo_url ? (
              <img src={data.logo_url} alt={data.name} className="w-16 h-16 rounded-lg object-cover border" />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-bold">{data.name}</h2>
              {data.organization_type && (
                <Badge variant="secondary" className="mt-1">
                  {orgTypeLabels[data.organization_type] || data.organization_type}
                </Badge>
              )}
            </div>
            {data.is_verified && (
              <div className="flex items-center gap-1 text-primary">
                <Shield className="w-5 h-5" />
                <span className="text-xs font-medium">موثقة</span>
              </div>
            )}
          </div>

          {data.bio && (
            <p className="text-sm text-muted-foreground leading-relaxed">{data.bio}</p>
          )}
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-card rounded-xl border p-6 space-y-3">
        <h3 className="font-bold mb-3">معلومات التواصل</h3>

        <div className="grid gap-3 text-sm">
          {data.city && (
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>{data.address ? `${data.address}، ${data.city}` : data.city}</span>
            </div>
          )}
          {data.phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
              <span dir="ltr">{data.phone}</span>
            </div>
          )}
          {data.email && (
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
              <span dir="ltr">{data.email}</span>
            </div>
          )}
          {data.website && (
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
              <a href={data.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" dir="ltr">
                {data.website}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Details for linked users */}
      {!isPublic && (
        <>
          {/* Licenses */}
          {(data.license_number || data.commercial_register || data.environmental_license) && (
            <div className="bg-card rounded-xl border p-6 space-y-3">
              <h3 className="font-bold flex items-center gap-2">
                <Award className="w-4 h-4" />
                التراخيص والسجلات
              </h3>
              <div className="grid gap-2 text-sm">
                {data.license_number && (
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">رقم الترخيص</span>
                    <span className="font-mono">{data.license_number}</span>
                  </div>
                )}
                {data.commercial_register && (
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">السجل التجاري</span>
                    <span className="font-mono">{data.commercial_register}</span>
                  </div>
                )}
                {data.environmental_license && (
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">الترخيص البيئي</span>
                    <span className="font-mono">{data.environmental_license}</span>
                  </div>
                )}
                {data.founded_year && (
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">سنة التأسيس</span>
                    <span>{data.founded_year}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SharedOrganizationView;
