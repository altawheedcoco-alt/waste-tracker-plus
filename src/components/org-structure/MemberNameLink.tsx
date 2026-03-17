/**
 * MemberNameLink - رابط تفاعلي لاسم الموظف
 * عند الضغط على اسم أي موظف في الشحنات أو العمليات يفتح ملفه الشامل
 */
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthContext';
import { OrgMember } from '@/hooks/useOrgMembers';
import MemberProfileSheet from './MemberProfileSheet';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MemberNameLinkProps {
  /** الاسم المعروض */
  name: string;
  /** معرف الملف الشخصي (profile_id) للبحث */
  profileId?: string | null;
  /** معرف المستخدم (user_id) للبحث */
  userId?: string | null;
  /** البريد الإلكتروني للبحث البديل */
  email?: string | null;
  /** إظهار أيقونة المستخدم */
  showIcon?: boolean;
  /** تخصيص الشكل */
  className?: string;
}

export default function MemberNameLink({
  name,
  profileId,
  userId,
  email,
  showIcon = false,
  className,
}: MemberNameLinkProps) {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [open, setOpen] = useState(false);

  // Only fetch member data when the sheet is opened
  const { data: member, isLoading } = useQuery({
    queryKey: ['member-lookup', orgId, profileId, userId, email],
    queryFn: async (): Promise<OrgMember | null> => {
      if (!orgId) return null;

      // Try own org first, then any org (for partner members)
      const tryLookup = async (filterOrgId?: string) => {
        let query = supabase
          .from('organization_members' as any)
          .select('*');

        if (filterOrgId) query = query.eq('organization_id', filterOrgId);

        if (profileId) {
          query = query.eq('profile_id', profileId);
        } else if (userId) {
          query = query.eq('user_id', userId);
        } else if (email) {
          query = query.eq('invitation_email', email);
        } else {
          return null;
        }

        const { data, error } = await query.limit(1).single();
        if (error || !data) return null;
        return data as any;
      };

      // Try own org first
      let m = await tryLookup(orgId);
      // If not found, try without org filter (partner members)
      if (!m) m = await tryLookup();
      if (!m) return null;

      // Enrich with profile, position, department
      const [profileRes, posRes, deptRes] = await Promise.all([
        m.profile_id
          ? supabase.from('profiles').select('full_name, email, phone, avatar_url').eq('id', m.profile_id).single()
          : { data: null },
        m.position_id
          ? supabase.from('organization_positions' as any).select('title_ar, title, level').eq('id', m.position_id).single()
          : { data: null },
        m.department_id
          ? supabase.from('organization_departments' as any).select('name_ar, name').eq('id', m.department_id).single()
          : { data: null },
      ]);

      return {
        ...m,
        profile: profileRes.data,
        position: posRes.data,
        department: deptRes.data,
      } as OrgMember;
    },
    enabled: open && !!orgId && !!(profileId || userId || email),
    staleTime: 5 * 60 * 1000,
  });

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (profileId || userId || email) {
      setOpen(true);
    }
  }, [profileId, userId, email]);

  const isClickable = !!(profileId || userId || email);

  return (
    <>
      <span
        onClick={isClickable ? handleClick : undefined}
        className={cn(
          'inline-flex items-center gap-1',
          isClickable && 'cursor-pointer text-primary hover:underline hover:text-primary/80 transition-colors',
          className,
        )}
        title={isClickable ? 'اضغط لعرض الملف الشامل' : undefined}
      >
        {showIcon && <User className="w-3.5 h-3.5 shrink-0" />}
        {name}
      </span>

      {open && member && (
        <MemberProfileSheet
          member={member}
          open={open}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
