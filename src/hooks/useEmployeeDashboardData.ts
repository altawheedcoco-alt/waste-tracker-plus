import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface EmployeeDashboardStats {
  // Attendance
  todayAttendance: { check_in: string | null; check_out: string | null; status: string } | null;
  monthAttendanceDays: number;
  monthLateDays: number;
  monthOvertimeHours: number;
  // Leave
  leaveBalances: Array<{ leave_type_id: string; entitled_days: number; used_days: number; remaining_days: number }>;
  pendingLeaveRequests: number;
  // Shipments (if applicable)
  myShipmentsCount: number;
  pendingShipmentsCount: number;
  // Notifications
  unreadNotifications: number;
  recentNotifications: Array<{ id: string; title: string; message: string; type: string; is_read: boolean; created_at: string }>;
  // Contract
  contract: { contract_type: string; start_date: string; end_date: string | null; total_salary: number } | null;
  // Profile info from erp_employees
  erpEmployee: { employee_number: string; department: string; job_title: string; hire_date: string } | null;
}

export const useEmployeeDashboardData = () => {
  const { user, organization } = useAuth();
  const orgId = organization?.id;

  return useQuery({
    queryKey: ['employee-dashboard-data', user?.id, orgId],
    queryFn: async (): Promise<EmployeeDashboardStats> => {
      if (!user?.id || !orgId) throw new Error('Missing user or org');

      // Get profile id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('No profile');

      // Get erp_employee record
      const { data: erpEmp } = await supabase
        .from('erp_employees')
        .select('id, employee_number, department, job_title, hire_date')
        .eq('organization_id', orgId)
        .eq('profile_id', profile.id)
        .maybeSingle();

      const erpEmployeeId = erpEmp?.id;

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

      // Run parallel queries
      const [
        todayAttRes,
        monthAttRes,
        leaveBalRes,
        pendingLeaveRes,
        shipmentsRes,
        pendingShipRes,
        notifCountRes,
        notifRecentRes,
        contractRes,
      ] = await Promise.all([
        // Today's attendance
        erpEmployeeId
          ? supabase.from('erp_attendance').select('check_in, check_out, status').eq('employee_id', erpEmployeeId).eq('attendance_date', todayStr).maybeSingle()
          : Promise.resolve({ data: null }),
        // Month attendance
        erpEmployeeId
          ? supabase.from('erp_attendance').select('id, late_minutes, overtime_hours').eq('employee_id', erpEmployeeId).gte('attendance_date', monthStart).lte('attendance_date', todayStr)
          : Promise.resolve({ data: [] }),
        // Leave balances
        erpEmployeeId
          ? supabase.from('hr_leave_balances').select('leave_type_id, entitled_days, used_days, remaining_days').eq('employee_id', erpEmployeeId).eq('year', now.getFullYear())
          : Promise.resolve({ data: [] }),
        // Pending leave requests
        erpEmployeeId
          ? supabase.from('erp_leave_requests').select('id', { count: 'exact', head: true }).eq('employee_id', erpEmployeeId).eq('status', 'pending')
          : Promise.resolve({ count: 0 }),
        // My shipments count
        (supabase.from('shipments').select('id', { count: 'exact', head: true }) as any).eq('organization_id', orgId),
        // Pending shipments
        (supabase.from('shipments').select('id', { count: 'exact', head: true }) as any).eq('organization_id', orgId).eq('status', 'pending'),
        // Unread notifications
        supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false),
        // Recent notifications
        supabase.from('notifications').select('id, title, message, type, is_read, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        // Contract
        erpEmployeeId
          ? supabase.from('hr_employment_contracts').select('contract_type, start_date, end_date, total_salary').eq('employee_id', erpEmployeeId).eq('status', 'active').maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      const monthAtt = (monthAttRes as any)?.data || [];

      return {
        todayAttendance: (todayAttRes as any)?.data || null,
        monthAttendanceDays: monthAtt.length,
        monthLateDays: monthAtt.filter((a: any) => (a.late_minutes || 0) > 0).length,
        monthOvertimeHours: monthAtt.reduce((sum: number, a: any) => sum + (Number(a.overtime_hours) || 0), 0),
        leaveBalances: (leaveBalRes as any)?.data || [],
        pendingLeaveRequests: (pendingLeaveRes as any)?.count || 0,
        myShipmentsCount: (shipmentsRes as any)?.count || 0,
        pendingShipmentsCount: (pendingShipRes as any)?.count || 0,
        unreadNotifications: (notifCountRes as any)?.count || 0,
        recentNotifications: (notifRecentRes as any)?.data || [],
        contract: (contractRes as any)?.data || null,
        erpEmployee: erpEmp ? {
          employee_number: erpEmp.employee_number,
          department: erpEmp.department,
          job_title: erpEmp.job_title,
          hire_date: erpEmp.hire_date,
        } : null,
      };
    },
    enabled: !!user?.id && !!orgId,
    staleTime: 1000 * 60 * 5,
  });
};
