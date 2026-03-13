import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2, User, Bot, ChevronDown, ChevronUp, Crown, Shield,
  Users, Network,
} from 'lucide-react';
import type { Department, Position } from '@/hooks/useOrgStructure';
import type { OrgMember } from '@/hooks/useOrgMembers';

interface Props {
  departments: Department[];
  positions: Position[];
  members: OrgMember[];
  onPositionClick?: (position: Position) => void;
  onMemberClick?: (member: OrgMember) => void;
}

const levelLabels: Record<number, string> = {
  0: 'موظف', 1: 'مشرف', 2: 'مدير', 3: 'مدير أول', 4: 'إدارة عليا',
};

const levelColors: Record<number, string> = {
  0: 'border-muted-foreground/30',
  1: 'border-blue-400',
  2: 'border-amber-400',
  3: 'border-purple-400',
  4: 'border-red-400',
};

const levelBg: Record<number, string> = {
  0: 'bg-muted/50',
  1: 'bg-blue-500/5',
  2: 'bg-amber-500/5',
  3: 'bg-purple-500/5',
  4: 'bg-red-500/5',
};

export default function OrgTreeView({ departments, positions, members, onPositionClick, onMemberClick }: Props) {
  const [expandedDepts, setExpandedDepts] = useState<Set<string> | 'all'>('all');

  // Group positions by department, sorted by level desc
  const tree = useMemo(() => {
    return departments.map(dept => {
      const deptPositions = positions
        .filter(p => p.department_id === dept.id)
        .sort((a, b) => b.level - a.level || a.sort_order - b.sort_order);

      const deptMembers = members.filter(m => m.department_id === dept.id && m.status === 'active');

      // Hierarchy: group by level
      const levels = new Map<number, Position[]>();
      deptPositions.forEach(p => {
        if (!levels.has(p.level)) levels.set(p.level, []);
        levels.get(p.level)!.push(p);
      });

      return { ...dept, deptPositions, deptMembers, levels };
    });
  }, [departments, positions, members]);

  const toggleDept = (id: string) => {
    setExpandedDepts(prev => {
      if (prev === 'all') {
        const next = new Set(tree.map(d => d.id));
        next.delete(id);
        return next;
      }
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const isDeptExpanded = (id: string) => expandedDepts === 'all' || expandedDepts.has(id);

  // Find member assigned to a position
  const getMemberForPosition = (pos: Position) => {
    return members.find(m => m.position_id === pos.id && m.status === 'active');
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={() => setExpandedDepts('all')}>توسيع الكل</Button>
        <Button variant="outline" size="sm" onClick={() => setExpandedDepts(new Set())}>طي الكل</Button>
      </div>

      {/* Organization Root Node */}
      <div className="flex flex-col items-center">
        <div className="px-6 py-3 rounded-xl bg-primary/10 border-2 border-primary/30 text-center mb-2">
          <Crown className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-sm font-bold">الإدارة العليا</p>
          <p className="text-[10px] text-muted-foreground">{tree.length} أقسام</p>
        </div>
        {/* Connector line */}
        <div className="w-0.5 h-6 bg-border" />
      </div>

      {/* Departments */}
      <div className="space-y-3">
        {tree.map((dept, idx) => {
          const isExpanded = isDeptExpanded(dept.id);
          const aiCount = dept.deptPositions.filter(p => p.operator_type === 'ai').length;
          const filledCount = dept.deptPositions.filter(p => p.assigned_user_id || p.holder_name).length;

          return (
            <motion.div
              key={dept.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <Card className="overflow-hidden border-r-4" style={{ borderRightColor: `var(--primary)` }}>
                {/* Department Header */}
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => toggleDept(dept.id)}
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    <div className="flex gap-1.5 flex-wrap">
                      <Badge variant="secondary" className="text-[10px]">{dept.deptPositions.length} منصب</Badge>
                      <Badge variant="outline" className="text-[10px] text-green-600">{filledCount} مشغول</Badge>
                      {aiCount > 0 && <Badge variant="outline" className="text-[10px] text-primary">🤖 {aiCount}</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <h3 className="font-semibold text-sm">{dept.name_ar}</h3>
                      <p className="text-[10px] text-muted-foreground">{dept.name}</p>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                </div>

                {/* Positions Tree */}
                <AnimatePresence>
                  {isExpanded && dept.deptPositions.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CardContent className="border-t pt-3 pb-3 px-3">
                        <div className="relative">
                          {/* Vertical connector line */}
                          <div className="absolute right-5 top-0 bottom-0 w-0.5 bg-border" />

                          <div className="space-y-2">
                            {Array.from(dept.levels.entries())
                              .sort(([a], [b]) => b - a)
                              .map(([level, levelPositions]) => (
                                <div key={level} className="space-y-1.5">
                                  {/* Level label */}
                                  <div className="flex items-center gap-2 pr-8 mb-1">
                                    <div className="flex-1 h-px bg-border" />
                                    <span className="text-[10px] text-muted-foreground font-medium px-2 py-0.5 rounded-full bg-muted">
                                      {levelLabels[level] || `مستوى ${level}`}
                                    </span>
                                  </div>

                                  {levelPositions.map(pos => {
                                    const isAI = pos.operator_type === 'ai';
                                    const isOccupied = pos.assigned_user_id || pos.holder_name;
                                    const member = getMemberForPosition(pos);

                                    return (
                                      <div
                                        key={pos.id}
                                        className={`relative flex items-center gap-3 p-2.5 rounded-lg border-r-2 cursor-pointer transition-all hover:shadow-sm ${levelBg[level] || ''} ${levelColors[level] || ''} ${
                                          isAI ? 'bg-primary/5 border-r-primary' : ''
                                        }`}
                                        onClick={() => onPositionClick?.(pos)}
                                      >
                                        {/* Horizontal connector */}
                                        <div className="absolute right-0 top-1/2 w-3 h-0.5 bg-border -translate-y-1/2" style={{ right: '-1px' }} />

                                        <div className="flex-1 text-right min-w-0">
                                          <p className="text-sm font-medium truncate">{pos.title_ar}</p>
                                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                            <p className="text-[10px] text-muted-foreground">{pos.title}</p>
                                            {pos.holder_name && (
                                              <span className="text-[10px] text-foreground/70">— {pos.holder_name}</span>
                                            )}
                                          </div>
                                          {member && (
                                            <button
                                              className="text-[10px] text-primary hover:underline mt-0.5"
                                              onClick={e => { e.stopPropagation(); onMemberClick?.(member); }}
                                            >
                                              👤 {member.profile?.full_name}
                                            </button>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                          {isAI ? (
                                            <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">🤖</Badge>
                                          ) : isOccupied ? (
                                            <Badge variant="default" className="bg-green-600 text-white text-[10px]">✓</Badge>
                                          ) : (
                                            <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px]">شاغر</Badge>
                                          )}
                                        </div>

                                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${
                                          isAI ? 'bg-primary/10 border-primary/30' : 'bg-background'
                                        }`}>
                                          {isAI ? <Bot className="w-4 h-4 text-primary" /> : <User className="w-4 h-4 text-muted-foreground" />}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ))}
                          </div>
                        </div>

                        {/* Unassigned members in this department */}
                        {dept.deptMembers.filter(m => !m.position_id).length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-[10px] text-muted-foreground font-medium mb-1.5 flex items-center gap-1">
                              <Users className="w-3 h-3" /> أعضاء بدون منصب محدد
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {dept.deptMembers.filter(m => !m.position_id).map(m => (
                                <button
                                  key={m.id}
                                  className="text-[10px] px-2 py-1 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                                  onClick={() => onMemberClick?.(m)}
                                >
                                  👤 {m.profile?.full_name || m.invitation_email}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {departments.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Network className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">لا يوجد هيكل تنظيمي بعد</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
