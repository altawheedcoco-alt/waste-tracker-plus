import { OrgMember } from '@/hooks/useOrgMembers';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Phone, Building2, Briefcase, Calendar, Hash, IdCard } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Props {
  member: OrgMember;
  open: boolean;
  onClose: () => void;
}

const statusLabels: Record<string, string> = {
  active: 'نشط', suspended: 'موقوف', terminated: 'منتهي',
  on_leave: 'إجازة', pending_invitation: 'دعوة معلقة',
};

export default function MemberProfileSheet({ member, open, onClose }: Props) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[400px] sm:w-[450px]" dir="rtl">
        <SheetHeader>
          <SheetTitle className="text-right">الملف الشخصي للموظف</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Avatar & Name */}
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-20 w-20 mb-3">
              <AvatarImage src={member.profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                <User className="w-10 h-10" />
              </AvatarFallback>
            </Avatar>
            <h3 className="text-lg font-bold">{member.profile?.full_name || member.invitation_email}</h3>
            {member.job_title_ar && <p className="text-sm text-muted-foreground">{member.job_title_ar}</p>}
            <Badge variant="secondary" className="mt-2">{statusLabels[member.status]}</Badge>
          </div>

          <Separator />

          {/* Details */}
          <div className="space-y-4">
            {member.profile?.email && (
              <InfoRow icon={Mail} label="البريد الإلكتروني" value={member.profile.email} dir="ltr" />
            )}
            {member.profile?.phone && (
              <InfoRow icon={Phone} label="الجوال" value={member.profile.phone} dir="ltr" />
            )}
            {member.department?.name_ar && (
              <InfoRow icon={Building2} label="القسم" value={member.department.name_ar} />
            )}
            {member.position?.title_ar && (
              <InfoRow icon={Briefcase} label="المنصب" value={member.position.title_ar} />
            )}
            {member.employee_number && (
              <InfoRow icon={Hash} label="الرقم الوظيفي" value={member.employee_number} />
            )}
            {member.profile?.national_id && (
              <InfoRow icon={IdCard} label="رقم الهوية" value={member.profile.national_id} />
            )}
            {member.joined_at && (
              <InfoRow icon={Calendar} label="تاريخ الانضمام" value={format(new Date(member.joined_at), 'PPP', { locale: ar })} />
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function InfoRow({ icon: Icon, label, value, dir }: { icon: any; label: string; value: string; dir?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 text-right">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium" dir={dir}>{value}</p>
      </div>
    </div>
  );
}
