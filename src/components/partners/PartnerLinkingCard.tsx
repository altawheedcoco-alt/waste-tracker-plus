import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { toast } from 'sonner';
import {
  Link2,
  Copy,
  Check,
  Key,
  Building2,
  Factory,
  Truck,
  Recycle,
  Loader2,
  Unlink,
  RefreshCw,
  Eye,
  EyeOff,
  Trash2,
  Users,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface VerifiedPartnership {
  id: string;
  requester_org_id: string;
  partner_org_id: string;
  status: string;
  partnership_type: string | null;
  notes: string | null;
  verified_at: string;
  created_at: string;
  partner_organization?: {
    id: string;
    name: string;
    organization_type: string;
    email: string;
    phone: string;
    city: string;
    logo_url: string | null;
    partner_code: string;
  };
  requester_organization?: {
    id: string;
    name: string;
    organization_type: string;
    email: string;
    phone: string;
    city: string;
    logo_url: string | null;
    partner_code: string;
  };
}

const PartnerLinkingCard = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [partnerCode, setPartnerCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [partnerToRemove, setPartnerToRemove] = useState<VerifiedPartnership | null>(null);

  // Fetch current org's partner code
  const { data: orgData, refetch: refetchOrg } = useQuery({
    queryKey: ['organization-partner-code', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data, error } = await supabase
        .from('organizations')
        .select('partner_code')
        .eq('id', organization.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  // Fetch verified partnerships
  const { data: partnerships = [], isLoading: loadingPartnerships } = useQuery({
    queryKey: ['verified-partnerships', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      // Fetch partnerships where we are either requester or partner
      const { data, error } = await supabase
        .from('verified_partnerships')
        .select(`
          *,
          partner_organization:partner_org_id(id, name, organization_type, email, phone, city, logo_url, partner_code),
          requester_organization:requester_org_id(id, name, organization_type, email, phone, city, logo_url, partner_code)
        `)
        .or(`requester_org_id.eq.${organization.id},partner_org_id.eq.${organization.id}`)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as VerifiedPartnership[];
    },
    enabled: !!organization?.id,
  });

  // Link partner mutation
  const linkPartnerMutation = useMutation({
    mutationFn: async (code: string) => {
      // التحقق الأولي
      if (!organization?.id) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }
      
      const trimmedCode = code.trim().toUpperCase();
      if (trimmedCode.length < 6) {
        throw new Error('كود الشراكة يجب أن يكون 8 أحرف على الأقل');
      }

      
      
      // البحث عن المنظمة بالكود
      const { data: partnerOrg, error: findError } = await supabase
        .from('organizations')
        .select('id, name, organization_type')
        .eq('partner_code', trimmedCode)
        .maybeSingle();

      

      if (findError) {
        console.error('❌ خطأ في البحث:', findError);
        throw new Error('حدث خطأ أثناء البحث عن الشريك');
      }
      
      if (!partnerOrg) {
        throw new Error('كود الشريك غير صحيح أو غير موجود');
      }

      if (partnerOrg.id === organization.id) {
        throw new Error('لا يمكنك ربط منظمتك بنفسها');
      }

      // منع ربط الجهات من نفس النوع
      if (partnerOrg.organization_type === organization.organization_type) {
        const typeLabels: Record<string, string> = {
          generator: 'جهة مولدة',
          transporter: 'جهة ناقلة', 
          recycler: 'جهة مدورة',
          disposal: 'جهة تخلص نهائي',
        };
        const typeLabel = typeLabels[organization.organization_type] || organization.organization_type;
        throw new Error(`لا يمكن ربط ${typeLabel} بـ${typeLabel} أخرى`);
      }

      // التحقق من وجود شراكة سابقة
      const { data: existingList, error: checkError } = await supabase
        .from('verified_partnerships')
        .select('id, status')
        .or(`and(requester_org_id.eq.${organization.id},partner_org_id.eq.${partnerOrg.id}),and(requester_org_id.eq.${partnerOrg.id},partner_org_id.eq.${organization.id})`);

      

      if (checkError) {
        console.error('❌ خطأ في التحقق:', checkError);
        throw new Error('حدث خطأ أثناء التحقق من الشراكات السابقة');
      }

      if (existingList && existingList.length > 0) {
        throw new Error('الشراكة موجودة مسبقاً');
      }

      // إنشاء الشراكة
      console.log('✨ إنشاء شراكة جديدة:', {
        requester_org_id: organization.id,
        partner_org_id: partnerOrg.id,
      });

      const { data, error } = await supabase
        .from('verified_partnerships')
        .insert({
          requester_org_id: organization.id,
          partner_org_id: partnerOrg.id,
          status: 'active',
          partnership_type: `${organization.organization_type}-${partnerOrg.organization_type}`,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ خطأ في إنشاء الشراكة:', error);
        if (error.code === '42501') {
          throw new Error('ليس لديك صلاحية لإنشاء شراكات. تأكد من أنك مسؤول المنظمة.');
        }
        throw new Error(`فشل في إنشاء الشراكة: ${error.message}`);
      }

      console.log('✅ تم إنشاء الشراكة:', data);
      return { partnership: data, partnerName: partnerOrg.name };
    },
    onSuccess: (result) => {
      toast.success(`تم ربط الشراكة مع ${result.partnerName} بنجاح 🎉`);
      queryClient.invalidateQueries({ queryKey: ['verified-partnerships'] });
      setPartnerCode('');
      setShowLinkDialog(false);
    },
    onError: (error: Error) => {
      console.error('❌ خطأ في عملية الربط:', error);
      toast.error(error.message);
    },
  });

  // Remove partnership mutation
  const removePartnershipMutation = useMutation({
    mutationFn: async (partnershipId: string) => {
      const { error } = await supabase
        .from('verified_partnerships')
        .delete()
        .eq('id', partnershipId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم إلغاء الشراكة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['verified-partnerships'] });
      setPartnerToRemove(null);
    },
    onError: () => {
      toast.error('فشل في إلغاء الشراكة');
    },
  });

  // Regenerate code mutation
  const regenerateCodeMutation = useMutation({
    mutationFn: async () => {
      if (!organization?.id) throw new Error('لا يوجد منظمة');
      const newCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const { error } = await supabase
        .from('organizations')
        .update({ partner_code: newCode })
        .eq('id', organization.id);
      if (error) throw error;
      return newCode;
    },
    onSuccess: () => {
      toast.success('تم تجديد كود الشراكة');
      refetchOrg();
    },
    onError: () => {
      toast.error('فشل في تجديد الكود');
    },
  });

  const copyCode = () => {
    if (orgData?.partner_code) {
      navigator.clipboard.writeText(orgData.partner_code);
      setCopied(true);
      toast.success('تم نسخ الكود');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getOrgIcon = (type: string) => {
    switch (type) {
      case 'generator':
        return <Factory className="w-4 h-4 text-blue-600" />;
      case 'transporter':
        return <Truck className="w-4 h-4 text-amber-600" />;
      case 'recycler':
        return <Recycle className="w-4 h-4 text-green-600" />;
      default:
        return <Building2 className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getOrgTypeLabel = (type: string) => {
    switch (type) {
      case 'generator':
        return 'جهة مولدة';
      case 'transporter':
        return 'جهة ناقلة';
      case 'recycler':
        return 'جهة مدورة';
      case 'disposal':
        return 'جهة تخلص';
      default:
        return type;
    }
  };

  const getPartnerFromPartnership = (partnership: VerifiedPartnership | null) => {
    if (!partnership) return null;
    if (partnership.requester_org_id === organization?.id) {
      return partnership.partner_organization;
    }
    return partnership.requester_organization;
  };

  return (
    <>
      <Card>
        <CardHeader className="text-right">
          <CardTitle className="flex items-center gap-2 justify-end">
            ربط الجهات بكود التحقق
            <Link2 className="w-5 h-5 text-primary" />
          </CardTitle>
          <CardDescription>
            اربط جهتك بجهات أخرى باستخدام كود التحقق الخاص بكل جهة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Your Partner Code Section */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyCode}
                  disabled={!orgData?.partner_code}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCode(!showCode)}
                >
                  {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => regenerateCodeMutation.mutate()}
                  disabled={regenerateCodeMutation.isPending}
                >
                  <RefreshCw className={`w-4 h-4 ${regenerateCodeMutation.isPending ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <div className="text-right">
                <Label className="flex items-center gap-2 justify-end text-sm font-medium">
                  كود الشراكة الخاص بك
                  <Key className="w-4 h-4 text-primary" />
                </Label>
                <p className="text-xs text-muted-foreground">
                  شارك هذا الكود مع الجهات الأخرى لربطها بمنظمتك
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end">
              <code className="px-4 py-2 bg-background border rounded-lg font-mono text-lg tracking-wider">
                {showCode ? orgData?.partner_code || '--------' : '••••••••'}
              </code>
            </div>
          </div>

          <Separator />

          {/* Link New Partner */}
          <div className="flex items-center justify-between">
            <Button onClick={() => setShowLinkDialog(true)} className="gap-2">
              <Link2 className="w-4 h-4" />
              ربط جهة جديدة
            </Button>
            <h3 className="font-medium flex items-center gap-2">
              ربط جهة بالكود
              <Users className="w-4 h-4 text-muted-foreground" />
            </h3>
          </div>

          <Separator />

          {/* Verified Partners List */}
          <div className="space-y-3">
            <h3 className="font-medium text-right flex items-center gap-2 justify-end">
              الجهات المرتبطة ({partnerships.length})
              <Link2 className="w-4 h-4 text-green-600" />
            </h3>
            
            {loadingPartnerships ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : partnerships.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>لا يوجد جهات مرتبطة بعد</p>
                <p className="text-sm">اربط جهات جديدة باستخدام كود التحقق</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {partnerships.map((partnership) => {
                  const partner = getPartnerFromPartnership(partnership);
                  if (!partner) return null;
                  
                  return (
                    <div
                      key={partnership.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setPartnerToRemove(partnership)}
                      >
                        <Unlink className="w-4 h-4" />
                      </Button>
                      <div className="flex items-center gap-3 flex-1 justify-end">
                        <div className="text-right">
                          <p className="font-medium">{partner.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground justify-end">
                            <span>{partner.city}</span>
                            <Badge variant="outline" className="text-xs">
                              {getOrgTypeLabel(partner.organization_type)}
                            </Badge>
                          </div>
                        </div>
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={partner.logo_url || undefined} />
                          <AvatarFallback className="bg-primary/10">
                            {getOrgIcon(partner.organization_type)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Link Partner Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-end">
              ربط شريك جديد
              <Link2 className="w-5 h-5 text-primary" />
            </DialogTitle>
            <DialogDescription className="text-right">
              أدخل كود الشراكة الخاص بالجهة التي تريد ربطها
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="partner-code" className="text-right block">كود الشريك</Label>
              <Input
                id="partner-code"
                value={partnerCode}
                onChange={(e) => setPartnerCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="أدخل كود الشريك"
                className="font-mono text-center tracking-wider text-lg"
                maxLength={10}
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground text-right">
                الكود يتكون من 8 أحرف وأرقام (مثال: 8AAF2C90)
              </p>
            </div>
            <Button
              onClick={() => linkPartnerMutation.mutate(partnerCode)}
              disabled={partnerCode.length < 6 || linkPartnerMutation.isPending}
              className="w-full"
            >
              {linkPartnerMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  جاري الربط...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4 ml-2" />
                  ربط الشريك
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Partnership Confirmation */}
      <AlertDialog open={!!partnerToRemove} onOpenChange={() => setPartnerToRemove(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">إلغاء الشراكة</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              هل أنت متأكد من إلغاء الشراكة مع{' '}
              <strong>
                {getPartnerFromPartnership(partnerToRemove!)?.name}
              </strong>
              ؟ يمكنك إعادة الربط لاحقاً باستخدام كود الشراكة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => partnerToRemove && removePartnershipMutation.mutate(partnerToRemove.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removePartnershipMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'تأكيد الإلغاء'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PartnerLinkingCard;
