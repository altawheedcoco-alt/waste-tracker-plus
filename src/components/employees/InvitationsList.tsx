import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Mail,
  MoreHorizontal,
  Copy,
  RefreshCw,
  XCircle,
  Clock,
  CheckCircle,
  UserPlus,
  Link2,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { useEmployeeInvitations, Invitation } from '@/hooks/useEmployeeInvitations';
import InviteEmployeeDialog from './InviteEmployeeDialog';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'معلق', variant: 'secondary' },
  accepted: { label: 'مقبول', variant: 'default' },
  expired: { label: 'منتهي', variant: 'destructive' },
  cancelled: { label: 'ملغي', variant: 'outline' },
};

const employeeTypeLabels: Record<string, string> = {
  employee: 'موظف',
  accountant: 'محاسب',
  supervisor: 'مشرف',
  manager: 'مدير',
};

const InvitationsList = () => {
  const { invitations, isLoading, cancelInvitation, resendInvitation } = useEmployeeInvitations();
  
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);

  const handleCopyLink = async (token: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('تم نسخ الرابط');
    } catch {
      toast.error('فشل في نسخ الرابط');
    }
  };

  const handleResend = async (invitation: Invitation) => {
    try {
      const result = await resendInvitation.mutateAsync(invitation.id);
      if (result.url) {
        await navigator.clipboard.writeText(result.url);
        toast.success('تم تجديد الدعوة ونسخ الرابط الجديد');
      }
    } catch {
      // Error handled in mutation
    }
  };

  const handleCancel = async () => {
    if (!selectedInvitation) return;
    try {
      await cancelInvitation.mutateAsync(selectedInvitation.id);
      setCancelDialogOpen(false);
      setSelectedInvitation(null);
    } catch {
      // Error handled in mutation
    }
  };

  const pendingCount = invitations.filter(i => i.status === 'pending').length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>الدعوات المرسلة</CardTitle>
            {pendingCount > 0 && (
              <Badge variant="secondary">{pendingCount} معلق</Badge>
            )}
          </div>
          <Button onClick={() => setInviteDialogOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            دعوة موظف
          </Button>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">لا توجد دعوات</h3>
              <p className="text-muted-foreground mb-4">
                لم ترسل أي دعوات بعد. أرسل دعوة لموظف جديد للانضمام.
              </p>
              <Button onClick={() => setInviteDialogOpen(true)} className="gap-2">
                <UserPlus className="h-4 w-4" />
                دعوة موظف
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead>تنتهي في</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => {
                  const status = statusConfig[invitation.status];
                  const isExpired = new Date(invitation.expires_at) < new Date();
                  const isPending = invitation.status === 'pending';

                  return (
                    <TableRow key={invitation.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span dir="ltr">{invitation.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {employeeTypeLabels[invitation.employee_type] || invitation.employee_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>
                          {invitation.status === 'pending' && <Clock className="h-3 w-3 ml-1" />}
                          {invitation.status === 'accepted' && <CheckCircle className="h-3 w-3 ml-1" />}
                          {invitation.status === 'cancelled' && <XCircle className="h-3 w-3 ml-1" />}
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(invitation.created_at), 'dd/MM/yyyy', { locale: ar })}
                      </TableCell>
                      <TableCell>
                        {isPending ? (
                          <span className={isExpired ? 'text-destructive' : 'text-muted-foreground'}>
                            {isExpired ? 'منتهي' : formatDistanceToNow(new Date(invitation.expires_at), { 
                              addSuffix: true, 
                              locale: ar 
                            })}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {isPending && !isExpired && (
                              <DropdownMenuItem onClick={() => handleCopyLink(invitation.token)}>
                                <Copy className="h-4 w-4 ml-2" />
                                نسخ الرابط
                              </DropdownMenuItem>
                            )}
                            {(isPending || invitation.status === 'expired') && (
                              <DropdownMenuItem onClick={() => handleResend(invitation)}>
                                <RefreshCw className="h-4 w-4 ml-2" />
                                تجديد الدعوة
                              </DropdownMenuItem>
                            )}
                            {isPending && (
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => {
                                  setSelectedInvitation(invitation);
                                  setCancelDialogOpen(true);
                                }}
                              >
                                <XCircle className="h-4 w-4 ml-2" />
                                إلغاء الدعوة
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <InviteEmployeeDialog 
        open={inviteDialogOpen} 
        onOpenChange={setInviteDialogOpen} 
      />

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>إلغاء الدعوة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من إلغاء الدعوة المرسلة إلى{' '}
              <span className="font-medium" dir="ltr">{selectedInvitation?.email}</span>؟
              لن يتمكن من استخدام الرابط للانضمام.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>تراجع</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              إلغاء الدعوة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default InvitationsList;
