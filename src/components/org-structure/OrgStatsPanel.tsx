import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Building2, Users, Bot, UserCheck, UserX, TrendingUp,
  Shield, Briefcase, Network,
} from 'lucide-react';
import type { Department, Position } from '@/hooks/useOrgStructure';
import type { OrgMember } from '@/hooks/useOrgMembers';
import { MEMBER_ROLE_LABELS, type MemberRole } from '@/types/memberRoles';

interface Props {
  departments: Department[];
  positions: Position[];
  members: OrgMember[];
}

export default function OrgStatsPanel({ departments, positions, members }: Props) {
  const stats = useMemo(() => {
    const totalPositions = positions.length;
    const filledPositions = positions.filter(p => p.assigned_user_id || p.holder_name).length;
    const aiPositions = positions.filter(p => p.operator_type === 'ai').length;
    const humanPositions = totalPositions - aiPositions;
    const vacantPositions = totalPositions - filledPositions;
    const fillRate = totalPositions > 0 ? Math.round((filledPositions / totalPositions) * 100) : 0;

    const activeMembers = members.filter(m => m.status === 'active').length;
    const suspendedMembers = members.filter(m => m.status === 'suspended').length;
    const pendingMembers = members.filter(m => m.status === 'pending_invitation').length;
    const onLeaveMembers = members.filter(m => m.status === 'on_leave').length;

    // Role distribution
    const roleDistribution = members
      .filter(m => m.status === 'active')
      .reduce((acc, m) => {
        const role = m.member_role as MemberRole;
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {} as Record<MemberRole, number>);

    // Department distribution
    const deptDistribution = departments.map(d => ({
      id: d.id,
      name: d.name_ar,
      positionCount: positions.filter(p => p.department_id === d.id).length,
      filledCount: positions.filter(p => p.department_id === d.id && (p.assigned_user_id || p.holder_name)).length,
      memberCount: members.filter(m => m.department_id === d.id && m.status === 'active').length,
      aiCount: positions.filter(p => p.department_id === d.id && p.operator_type === 'ai').length,
    }));

    // Permissions stats
    const membersWithPerms = members.filter(m => m.granted_permissions?.length > 0).length;
    const managersCount = members.filter(m => m.can_manage_members).length;

    return {
      totalPositions, filledPositions, aiPositions, humanPositions,
      vacantPositions, fillRate, activeMembers, suspendedMembers,
      pendingMembers, onLeaveMembers, roleDistribution, deptDistribution,
      membersWithPerms, managersCount,
    };
  }, [departments, positions, members]);

  const roleColors: Record<string, string> = {
    entity_head: 'bg-amber-500',
    assistant: 'bg-purple-500',
    deputy_assistant: 'bg-indigo-500',
    agent: 'bg-teal-500',
    delegate: 'bg-sky-500',
    member: 'bg-muted-foreground',
  };

  return (
    <div className="space-y-6">
      {/* Main KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={Building2} label="أقسام" value={departments.length} color="text-primary" />
        <StatCard icon={Briefcase} label="مناصب" value={stats.totalPositions} color="text-primary" />
        <StatCard icon={UserCheck} label="مشغول" value={stats.filledPositions} color="text-green-600" />
        <StatCard icon={UserX} label="شاغر" value={stats.vacantPositions} color="text-amber-600" />
        <StatCard icon={Bot} label="AI" value={stats.aiPositions} color="text-primary" />
        <StatCard icon={Users} label="أعضاء نشطين" value={stats.activeMembers} color="text-blue-600" />
      </div>

      {/* Fill Rate */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary" className="text-xs">{stats.fillRate}%</Badge>
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              نسبة إشغال المناصب
            </h4>
          </div>
          <Progress value={stats.fillRate} className="h-3" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{stats.humanPositions} بشري • {stats.aiPositions} AI</span>
            <span>{stats.filledPositions} / {stats.totalPositions}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Role Distribution */}
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              توزيع الأدوار الهرمية
            </h4>
            <div className="space-y-2">
              {Object.entries(MEMBER_ROLE_LABELS).map(([role, info]) => {
                const count = stats.roleDistribution[role as MemberRole] || 0;
                const pct = stats.activeMembers > 0 ? Math.round((count / stats.activeMembers) * 100) : 0;
                return (
                  <div key={role} className="flex items-center gap-2">
                    <span className="text-sm min-w-[20px] text-left font-medium">{count}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] text-muted-foreground">{pct}%</span>
                        <span className="text-xs">{info.icon} {info.ar}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${roleColors[role] || 'bg-muted-foreground'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Member Status */}
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              حالة الأعضاء
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <StatusBadge label="نشط" count={stats.activeMembers} color="bg-green-500/10 text-green-700 dark:text-green-300" />
              <StatusBadge label="دعوة معلقة" count={stats.pendingMembers} color="bg-blue-500/10 text-blue-700 dark:text-blue-300" />
              <StatusBadge label="إجازة" count={stats.onLeaveMembers} color="bg-yellow-500/10 text-yellow-700 dark:text-yellow-300" />
              <StatusBadge label="موقوف" count={stats.suspendedMembers} color="bg-red-500/10 text-red-700 dark:text-red-300" />
            </div>

            <div className="mt-4 pt-3 border-t space-y-2">
              <div className="flex items-center justify-between text-xs">
                <Badge variant="outline" className="text-[10px]">{stats.membersWithPerms}</Badge>
                <span className="text-muted-foreground">أعضاء بصلاحيات مخصصة</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <Badge variant="outline" className="text-[10px]">{stats.managersCount}</Badge>
                <span className="text-muted-foreground">مديرون (يديرون الأعضاء)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Breakdown */}
      {stats.deptDistribution.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Network className="w-4 h-4 text-primary" />
              توزيع الأقسام
            </h4>
            <div className="space-y-3">
              {stats.deptDistribution.map(dept => {
                const fillPct = dept.positionCount > 0 ? Math.round((dept.filledCount / dept.positionCount) * 100) : 0;
                return (
                  <div key={dept.id} className="p-3 rounded-lg bg-muted/30 border">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex gap-1.5 flex-wrap">
                        <Badge variant="secondary" className="text-[10px]">{dept.positionCount} منصب</Badge>
                        <Badge variant="outline" className="text-[10px]">{dept.memberCount} عضو</Badge>
                        {dept.aiCount > 0 && <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">🤖 {dept.aiCount}</Badge>}
                      </div>
                      <h5 className="text-sm font-medium">{dept.name}</h5>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{fillPct}%</span>
                      <Progress value={fillPct} className="h-1.5 flex-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="p-3 text-center">
        <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
        <p className={`text-xl font-bold ${color}`}>{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className={`p-3 rounded-lg text-center ${color}`}>
      <p className="text-lg font-bold">{count}</p>
      <p className="text-[10px]">{label}</p>
    </div>
  );
}
