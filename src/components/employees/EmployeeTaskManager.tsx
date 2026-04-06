import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Plus, Trash2, FileText, ListChecks, Building2 } from 'lucide-react';
import { useEmployeeTasks, useTaskTemplates, ASSIGNABLE_PERMISSIONS, PERMISSION_CATEGORIES } from '@/hooks/useEmployeeTasks';
import PartnerScopeSelector from './PartnerScopeSelector';

interface Props {
  memberId: string;
  memberName: string;
  open: boolean;
  onClose: () => void;
}

export default function EmployeeTaskManager({ memberId, memberName, open, onClose }: Props) {
  const { tasks, isLoading, assignTask, removeTask, assignFromTemplate } = useEmployeeTasks(memberId);
  const { templates } = useTaskTemplates();
  const [addingPerm, setAddingPerm] = useState<string | null>(null);
  const [scopedPartners, setScopedPartners] = useState<string[]>([]);

  const existingKeys = tasks.map(t => t.permission_key);

  const handleAddTask = (permKey: string) => {
    setAddingPerm(permKey);
    setScopedPartners([]);
  };

  const confirmAddTask = () => {
    if (!addingPerm) return;
    assignTask.mutate({
      member_id: memberId,
      permission_key: addingPerm,
      scoped_partner_ids: scopedPartners,
    }, { onSuccess: () => setAddingPerm(null) });
  };

  const handleApplyTemplate = (template: any) => {
    assignFromTemplate.mutate({ member_id: memberId, template });
  };

  const groupedCategories = Object.entries(PERMISSION_CATEGORIES);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent dir="rtl" className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-primary" />
            مهام الموظف: {memberName}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="current" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="current">المهام الحالية</TabsTrigger>
            <TabsTrigger value="add">إضافة مهمة</TabsTrigger>
            <TabsTrigger value="templates">القوالب</TabsTrigger>
          </TabsList>

          {/* المهام الحالية */}
          <TabsContent value="current" className="flex-1 overflow-auto">
            <ScrollArea className="h-[50vh]">
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ListChecks className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>لا توجد مهام معيّنة بعد</p>
                  <p className="text-xs mt-1">اضغط على "إضافة مهمة" أو طبّق قالب جاهز</p>
                </div>
              ) : (
                <div className="space-y-2 p-1">
                  {tasks.map(task => {
                    const permInfo = ASSIGNABLE_PERMISSIONS.find(p => p.key === task.permission_key);
                    return (
                      <Card key={task.id} className="border">
                        <CardContent className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => removeTask.mutate(task.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="text-right flex-1">
                            <p className="text-sm font-medium">{permInfo?.label || task.permission_key}</p>
                            <div className="flex items-center gap-1 justify-end mt-1">
                              {task.scoped_partner_ids?.length > 0 ? (
                                <Badge variant="outline" className="text-xs">
                                  <Building2 className="w-3 h-3 ml-1" />
                                  {task.scoped_partner_ids.length} جهة محددة
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">كل الجهات</Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* إضافة مهمة فردية */}
          <TabsContent value="add" className="flex-1 overflow-auto">
            <ScrollArea className="h-[50vh]">
              {addingPerm ? (
                <div className="p-4 space-y-4">
                  <h4 className="font-semibold text-sm">
                    تحديد نطاق: {ASSIGNABLE_PERMISSIONS.find(p => p.key === addingPerm)?.label}
                  </h4>
                  <PartnerScopeSelector
                    selectedIds={scopedPartners}
                    onChange={setScopedPartners}
                  />
                  <div className="flex gap-2">
                    <Button onClick={confirmAddTask} disabled={assignTask.isPending} className="flex-1">
                      {assignTask.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تعيين المهمة'}
                    </Button>
                    <Button variant="outline" onClick={() => setAddingPerm(null)}>إلغاء</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 p-1">
                  {groupedCategories.map(([catKey, catLabel]) => {
                    const perms = ASSIGNABLE_PERMISSIONS.filter(p => p.category === catKey);
                    return (
                      <div key={catKey}>
                        <h4 className="text-sm font-semibold text-right mb-2">{catLabel}</h4>
                        <div className="space-y-1">
                          {perms.map(perm => {
                            const exists = existingKeys.includes(perm.key);
                            return (
                              <div key={perm.key} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={exists}
                                  onClick={() => handleAddTask(perm.key)}
                                >
                                  {exists ? '✓ معيّن' : <><Plus className="w-4 h-4 ml-1" />إضافة</>}
                                </Button>
                                <span className="text-sm">{perm.label}</span>
                              </div>
                            );
                          })}
                        </div>
                        <Separator className="mt-2" />
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* القوالب الجاهزة */}
          <TabsContent value="templates" className="flex-1 overflow-auto">
            <ScrollArea className="h-[50vh]">
              {templates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>لا توجد قوالب بعد</p>
                  <p className="text-xs mt-1">يمكنك إنشاء قوالب من صفحة إدارة القوالب</p>
                </div>
              ) : (
                <div className="space-y-3 p-1">
                  {templates.map(tpl => (
                    <Card key={tpl.id}>
                      <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-sm">{tpl.name_ar}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-1">
                        <p className="text-xs text-muted-foreground mb-2">{tpl.description_ar}</p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {tpl.task_permissions?.map((tp: any, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {ASSIGNABLE_PERMISSIONS.find(p => p.key === tp.permission)?.label || tp.permission}
                            </Badge>
                          ))}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleApplyTemplate(tpl)}
                          disabled={assignFromTemplate.isPending}
                        >
                          تطبيق القالب
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
