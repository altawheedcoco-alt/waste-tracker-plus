import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useConsultingOffice } from '@/hooks/useConsultingOffice';
import {
  Building2, Users, Eye, MapPin, Loader2, UserPlus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SERVICE_TYPE_LABELS: Record<string, string> = {
  environmental_oversight: 'إشراف بيئي',
  waste_management: 'إدارة مخلفات',
  compliance_audit: 'تدقيق امتثال',
  eia_preparation: 'تقييم أثر بيئي',
  licensing_support: 'دعم تراخيص',
  training: 'تدريب',
  emergency_response: 'استجابة طوارئ',
};

const ORG_TYPE_LABELS: Record<string, string> = {
  generator: 'مولد مخلفات',
  transporter: 'ناقل',
  recycler: 'مدوّر',
  disposal: 'تخلص نهائي',
  transport_office: 'مكتب نقل',
};

const OfficeClientsPanel = memo(() => {
  const { clients, members, loadingClients } = useConsultingOffice();
  const navigate = useNavigate();

  if (loadingClients) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              عملاء المكتب
              <Badge variant="outline">{clients.length}</Badge>
            </CardTitle>
            <CardDescription>الجهات التي يشرف عليها المكتب واستشاريوه</CardDescription>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5">
            <UserPlus className="w-4 h-4" />تعيين جهة جديدة
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="font-medium">لا توجد جهات عميلة بعد</p>
            <p className="text-sm mt-1">عيّن جهات جديدة لبدء الإشراف عليها</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map(client => (
              <Card key={client.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {client.client_organization?.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate text-sm">{client.client_organization?.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px]">
                          {ORG_TYPE_LABELS[client.client_organization?.organization_type || ''] || client.client_organization?.organization_type}
                        </Badge>
                        {client.client_organization?.city && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5" />{client.client_organization.city}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-2">
                    <Badge variant="secondary" className="text-[9px]">
                      {SERVICE_TYPE_LABELS[client.service_type] || client.service_type}
                    </Badge>
                    {client.contract_end && (
                      <Badge variant="outline" className="text-[9px]">
                        حتى {new Date(client.contract_end).toLocaleDateString('ar-EG')}
                      </Badge>
                    )}
                  </div>

                  {client.consultant && (
                    <p className="text-[10px] text-muted-foreground mb-2">
                      <Users className="w-3 h-3 inline ml-1" />
                      المسؤول: {client.consultant.full_name} ({client.consultant.consultant_code})
                    </p>
                  )}

                  <Button variant="outline" size="sm" className="w-full gap-1.5"
                    onClick={() => navigate(`/dashboard/organization/${client.client_organization?.id}`)}>
                    <Eye className="w-3.5 h-3.5" />عرض ملف العميل
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

OfficeClientsPanel.displayName = 'OfficeClientsPanel';
export default OfficeClientsPanel;
