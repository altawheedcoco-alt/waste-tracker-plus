import { useState } from "react";
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Network, Users, Building2, ChevronDown, ChevronLeft } from "lucide-react";
import BackButton from '@/components/ui/back-button';

interface OrgNode {
  id: string;
  title: string;
  title_ar: string;
  node_type: string;
  head_name: string | null;
  employee_count: number;
  color: string;
  parent_node_id: string | null;
  children?: OrgNode[];
}

function buildTree(nodes: OrgNode[], parentId: string | null = null): OrgNode[] {
  return nodes
    .filter(n => n.parent_node_id === parentId)
    .map(n => ({ ...n, children: buildTree(nodes, n.id) }));
}

function OrgNodeCard({ node, depth = 0 }: { node: OrgNode; depth?: number }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className={`${depth > 0 ? 'mr-8 border-r-2 border-muted pr-4' : ''}`}>
      <Card className="border-r-4 mb-3 hover:shadow-md transition-shadow" style={{ borderRightColor: node.color || '#3B82F6' }}>
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {hasChildren && (
                <Button size="sm" variant="ghost" className="p-1 h-6 w-6" onClick={() => setExpanded(!expanded)}>
                  {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>
              )}
              <div>
                <h4 className="font-semibold text-sm">{node.title_ar}</h4>
                <p className="text-xs text-muted-foreground">{node.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {node.head_name && <Badge variant="outline" className="text-xs">{node.head_name}</Badge>}
              <Badge variant="secondary" className="text-xs"><Users className="w-3 h-3 ml-1" />{node.employee_count}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      {expanded && hasChildren && node.children!.map(child => <OrgNodeCard key={child.id} node={child} depth={depth + 1} />)}
    </div>
  );
}

export default function HROrgChart() {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [newNode, setNewNode] = useState({ title: '', title_ar: '', type: 'department', parent: '', head: '', color: '#3B82F6' });

  const { data: nodes = [] } = useQuery({
    queryKey: ['hr-org-chart', orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from('hr_org_chart_nodes').select('*').eq('organization_id', orgId!).order('sort_order');
      if (error) throw error;
      return data as OrgNode[];
    },
    enabled: !!orgId,
  });

  const createNodeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('hr_org_chart_nodes').insert({
        organization_id: orgId!,
        title: newNode.title,
        title_ar: newNode.title_ar,
        node_type: newNode.type,
        parent_node_id: newNode.parent || null,
        head_name: newNode.head || null,
        color: newNode.color,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-org-chart'] });
      setShowNew(false);
      setNewNode({ title: '', title_ar: '', type: 'department', parent: '', head: '', color: '#3B82F6' });
      toast.success('تم إضافة العنصر');
    },
  });

  const tree = buildTree(nodes);

  return (
    <DashboardLayout>
    <div className="p-6 space-y-6" dir="rtl">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الهيكل التنظيمي</h1>
          <p className="text-muted-foreground">خريطة الأقسام والوحدات الإدارية</p>
        </div>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 ml-2" />إضافة وحدة</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>إضافة وحدة تنظيمية</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>الاسم (عربي)</Label><Input value={newNode.title_ar} onChange={e => setNewNode(p => ({ ...p, title_ar: e.target.value }))} placeholder="قسم الموارد البشرية" /></div>
                <div><Label>الاسم (إنجليزي)</Label><Input value={newNode.title} onChange={e => setNewNode(p => ({ ...p, title: e.target.value }))} placeholder="HR Department" /></div>
              </div>
              <div><Label>النوع</Label>
                <Select value={newNode.type} onValueChange={v => setNewNode(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="board">مجلس الإدارة</SelectItem>
                    <SelectItem value="executive">الإدارة التنفيذية</SelectItem>
                    <SelectItem value="department">قسم</SelectItem>
                    <SelectItem value="division">شعبة</SelectItem>
                    <SelectItem value="unit">وحدة</SelectItem>
                    <SelectItem value="team">فريق</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>تابع لـ</Label>
                <Select value={newNode.parent} onValueChange={v => setNewNode(p => ({ ...p, parent: v }))}>
                  <SelectTrigger><SelectValue placeholder="(المستوى الأعلى)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">المستوى الأعلى</SelectItem>
                    {nodes.map(n => <SelectItem key={n.id} value={n.id}>{n.title_ar}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>رئيس الوحدة</Label><Input value={newNode.head} onChange={e => setNewNode(p => ({ ...p, head: e.target.value }))} placeholder="اسم المسؤول" /></div>
                <div><Label>اللون</Label><Input type="color" value={newNode.color} onChange={e => setNewNode(p => ({ ...p, color: e.target.value }))} className="h-10" /></div>
              </div>
              <Button className="w-full" onClick={() => createNodeMutation.mutate()} disabled={!newNode.title_ar}>إضافة</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Building2 className="w-8 h-8 text-primary" /><div><p className="text-sm text-muted-foreground">الأقسام</p><p className="text-xl font-bold">{nodes.filter(n => n.node_type === 'department').length}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Network className="w-8 h-8 text-blue-500" /><div><p className="text-sm text-muted-foreground">إجمالي الوحدات</p><p className="text-xl font-bold">{nodes.length}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Users className="w-8 h-8 text-green-500" /><div><p className="text-sm text-muted-foreground">إجمالي الموظفين</p><p className="text-xl font-bold">{nodes.reduce((s, n) => s + (n.employee_count || 0), 0)}</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Network className="w-5 h-5" />شجرة الهيكل التنظيمي</CardTitle></CardHeader>
        <CardContent>
          {nodes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Network className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لم يتم إنشاء هيكل تنظيمي بعد</p>
              <p className="text-sm mt-1">أضف الأقسام والوحدات لبناء الهيكل</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tree.map(node => <OrgNodeCard key={node.id} node={node} />)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
