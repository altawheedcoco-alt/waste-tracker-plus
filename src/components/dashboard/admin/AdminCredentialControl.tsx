import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  KeyRound, Search, ShieldAlert, Lock, Unlock, Loader2,
  User, Building2, FileKey, Trash2, RotateCcw, AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ResetPasswordDialog from './ResetPasswordDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface UserCredentialInfo {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  organization_id: string | null;
  has_pin: boolean;
  pin_locked: boolean;
  pin_id: string | null;
}

interface PagePassword {
  id: string;
  page_path: string;
  page_name: string | null;
  is_active: boolean;
  created_at: string;
}

const AdminCredentialControl = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [resetPasswordUser, setResetPasswordUser] = useState<UserCredentialInfo | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: string; id: string; name: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-credential-users'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-credential-control', {
        body: { action: 'list_users' },
      });
      if (error) throw error;
      return (data?.users || []) as UserCredentialInfo[];
    },
    enabled: open,
  });

  const { data: pagePasswords = [], isLoading: loadingPages } = useQuery({
    queryKey: ['admin-page-passwords', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return [];
      const { data, error } = await supabase.functions.invoke('admin-credential-control', {
        body: { action: 'list_page_passwords', organizationId: selectedOrgId },
      });
      if (error) throw error;
      return (data?.passwords || []) as PagePassword[];
    },
    enabled: !!selectedOrgId && open,
  });

  // Get unique orgs for page password tab
  const orgsWithUsers = Array.from(
    new Map(
      users
        .filter(u => u.organization_id)
        .map(u => [u.organization_id, u])
    ).entries()
  );

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleResetPin = async (userId: string) => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-credential-control', {
        body: { action: 'reset_pin', targetUserId: userId },
      });
      if (error) throw error;
      toast({ title: 'تم بنجاح', description: 'تم إعادة تعيين رمز PIN - سيُطلب من المستخدم إنشاء رمز جديد' });
      queryClient.invalidateQueries({ queryKey: ['admin-credential-users'] });
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const handleResetPagePassword = async (pagePasswordId: string) => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-credential-control', {
        body: { action: 'reset_page_password', pagePasswordId, organizationId: selectedOrgId },
      });
      if (error) throw error;
      toast({ title: 'تم بنجاح', description: 'تم حذف كلمة مرور الصفحة' });
      queryClient.invalidateQueries({ queryKey: ['admin-page-passwords'] });
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'pin') {
      handleResetPin(confirmAction.id);
    } else if (confirmAction.type === 'page_password') {
      handleResetPagePassword(confirmAction.id);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <KeyRound className="h-4 w-4" />
            إدارة كلمات المرور والرموز
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[85vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              التحكم بكلمات المرور والرموز — صلاحيات المدير
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="passwords" dir="rtl">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="passwords" className="gap-1">
                <Lock className="h-3 w-3" /> كلمات المرور
              </TabsTrigger>
              <TabsTrigger value="pins" className="gap-1">
                <KeyRound className="h-3 w-3" /> رموز PIN
              </TabsTrigger>
              <TabsTrigger value="page-passwords" className="gap-1">
                <FileKey className="h-3 w-3" /> كلمات مرور الصفحات
              </TabsTrigger>
            </TabsList>

            {/* Password Reset Tab */}
            <TabsContent value="passwords" className="space-y-3 mt-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث بالاسم أو البريد..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-10"
                />
              </div>
              <ScrollArea className="h-[400px]">
                {loadingUsers ? (
                  <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
                ) : (
                  <div className="space-y-2">
                    {filteredUsers.map(u => (
                      <Card key={u.id} className="hover:bg-accent/50 transition-colors">
                        <CardContent className="p-3 flex items-center justify-between">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setResetPasswordUser(u)}
                            className="gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            إعادة تعيين
                          </Button>
                          <div className="text-right">
                            <p className="font-medium flex items-center gap-2 justify-end">
                              <User className="w-4 h-4 text-muted-foreground" />
                              {u.full_name || 'بدون اسم'}
                            </p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* PIN Reset Tab */}
            <TabsContent value="pins" className="space-y-3 mt-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث بالاسم أو البريد..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-10"
                />
              </div>
              <ScrollArea className="h-[400px]">
                {loadingUsers ? (
                  <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
                ) : (
                  <div className="space-y-2">
                    {filteredUsers.map(u => (
                      <Card key={u.id} className="hover:bg-accent/50 transition-colors">
                        <CardContent className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {u.has_pin ? (
                              <>
                                {u.pin_locked && (
                                  <Badge variant="destructive" className="text-[10px]">مقفل</Badge>
                                )}
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setConfirmAction({ type: 'pin', id: u.user_id, name: u.full_name })}
                                  className="gap-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  حذف PIN
                                </Button>
                              </>
                            ) : (
                              <Badge variant="outline" className="text-xs">بدون PIN</Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-medium flex items-center gap-2 justify-end">
                              {u.has_pin ? (
                                <Lock className="w-4 h-4 text-green-600" />
                              ) : (
                                <Unlock className="w-4 h-4 text-muted-foreground" />
                              )}
                              {u.full_name || 'بدون اسم'}
                            </p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Page Passwords Tab */}
            <TabsContent value="page-passwords" className="space-y-3 mt-4">
              <div className="flex gap-2 flex-wrap">
                {orgsWithUsers.map(([orgId]) => {
                  const orgUsers = users.filter(u => u.organization_id === orgId);
                  const orgName = orgUsers[0]?.full_name?.split(' ')[0] || orgId;
                  return (
                    <Button
                      key={orgId}
                      size="sm"
                      variant={selectedOrgId === orgId ? 'default' : 'outline'}
                      onClick={() => setSelectedOrgId(orgId as string)}
                      className="gap-1"
                    >
                      <Building2 className="w-3 h-3" />
                      {orgId?.toString().substring(0, 8)}...
                    </Button>
                  );
                })}
              </div>

              {selectedOrgId && (
                <ScrollArea className="h-[350px]">
                  {loadingPages ? (
                    <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
                  ) : pagePasswords.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Unlock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>لا توجد صفحات محمية بكلمة مرور لهذه الجهة</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pagePasswords.map(pp => (
                        <Card key={pp.id}>
                          <CardContent className="p-3 flex items-center justify-between">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setConfirmAction({ type: 'page_password', id: pp.id, name: pp.page_name || pp.page_path })}
                              className="gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              إزالة الحماية
                            </Button>
                            <div className="text-right">
                              <p className="font-medium flex items-center gap-2 justify-end">
                                <FileKey className="w-4 h-4 text-amber-600" />
                                {pp.page_name || pp.page_path}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {pp.is_active ? '🟢 نشط' : '🔴 معطل'}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      {resetPasswordUser && (
        <ResetPasswordDialog
          open={!!resetPasswordUser}
          onOpenChange={(open) => !open && setResetPasswordUser(null)}
          user={resetPasswordUser}
        />
      )}

      {/* Confirm Action Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 justify-end">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              تأكيد الإجراء
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              {confirmAction?.type === 'pin'
                ? `هل تريد حذف رمز PIN لـ "${confirmAction?.name}"؟ سيُطلب منه إنشاء رمز جديد.`
                : `هل تريد إزالة حماية كلمة المرور من "${confirmAction?.name}"؟`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel disabled={actionLoading}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              تأكيد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminCredentialControl;
