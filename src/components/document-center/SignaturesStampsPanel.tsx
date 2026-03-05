/**
 * لوحة التوقيعات والأختام — إدارة التوقيعات والأختام والمفوضين
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PenTool, BadgeCheck, Stamp, FileSignature, Inbox, Users,
  CheckCircle2, Clock, ArrowRight, Shield,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const SignaturesStampsPanel = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage();

  const { data: signatures = [] } = useQuery({
    queryKey: ['doc-center-signatures', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await (supabase.from('organization_signatures') as any)
        .select('*')
        .eq('organization_id', organization.id);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: stamps = [] } = useQuery({
    queryKey: ['doc-center-stamps', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await (supabase.from('organization_stamps') as any)
        .select('*')
        .eq('organization_id', organization.id);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: signatories = [] } = useQuery({
    queryKey: ['doc-center-signatories', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('authorized_signatories')
        .select('*')
        .eq('organization_id', organization.id);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: signingRequests = [] } = useQuery({
    queryKey: ['doc-center-signing-requests', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('signing_requests')
        .select('*')
        .eq('recipient_organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const pendingCount = signingRequests.filter((r: any) => r.status === 'pending').length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">{signatures.length}</p>
            <p className="text-xs text-muted-foreground">توقيعات</p>
          </CardContent>
        </Card>
        <Card className="bg-accent/10">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{stamps.length}</p>
            <p className="text-xs text-muted-foreground">أختام</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{signatories.length}</p>
            <p className="text-xs text-muted-foreground">مفوضون</p>
          </CardContent>
        </Card>
        <Card className={pendingCount > 0 ? 'bg-destructive/10 border-destructive/30' : 'bg-muted/30'}>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-destructive">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">طلبات معلقة</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="signatures" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="signatures" className="text-xs gap-1"><PenTool className="w-3.5 h-3.5" />التوقيعات</TabsTrigger>
          <TabsTrigger value="stamps" className="text-xs gap-1"><Stamp className="w-3.5 h-3.5" />الأختام</TabsTrigger>
          <TabsTrigger value="signatories" className="text-xs gap-1"><Users className="w-3.5 h-3.5" />المفوضون</TabsTrigger>
          <TabsTrigger value="requests" className="text-xs gap-1">
            <Inbox className="w-3.5 h-3.5" />الطلبات
            {pendingCount > 0 && <Badge variant="destructive" className="text-[10px] px-1 py-0 mr-1">{pendingCount}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="signatures" className="mt-4 space-y-3">
          {signatures.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">لا توجد توقيعات مسجلة</CardContent></Card>
          ) : (
            signatures.map((sig: any) => (
              <Card key={sig.id} className="hover:bg-muted/30 transition-colors">
                <CardContent className="p-3 flex items-center gap-3">
                  {sig.signature_image_url ? (
                    <img src={sig.signature_image_url} alt="signature" className="w-16 h-10 object-contain bg-white rounded border" />
                  ) : (
                    <div className="w-16 h-10 rounded bg-muted flex items-center justify-center"><PenTool className="w-5 h-5 text-muted-foreground" /></div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{sig.signature_name || sig.signer_name || 'توقيع'}</p>
                    <div className="flex gap-2 mt-0.5">
                      <Badge variant={sig.is_active ? 'default' : 'secondary'} className="text-[10px]">
                        {sig.is_active ? 'فعّال' : 'غير فعّال'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          <Button variant="outline" className="w-full gap-2" onClick={() => navigate('/dashboard/signing-status')}>
            <PenTool className="w-4 h-4" />
            إدارة التوقيعات
            <ArrowRight className="w-4 h-4 mr-auto rtl:rotate-180" />
          </Button>
        </TabsContent>

        <TabsContent value="stamps" className="mt-4 space-y-3">
          {stamps.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">لا توجد أختام مسجلة</CardContent></Card>
          ) : (
            stamps.map((stamp: any) => (
              <Card key={stamp.id} className="hover:bg-muted/30 transition-colors">
                <CardContent className="p-3 flex items-center gap-3">
                  {stamp.stamp_image_url ? (
                    <img src={stamp.stamp_image_url} alt="stamp" className="w-14 h-14 object-contain bg-white rounded border" />
                  ) : (
                    <div className="w-14 h-14 rounded bg-muted flex items-center justify-center"><Stamp className="w-6 h-6 text-muted-foreground" /></div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{stamp.stamp_name || 'ختم'}</p>
                    <Badge variant={stamp.is_active ? 'default' : 'secondary'} className="text-[10px] mt-1">
                      {stamp.is_active ? 'فعّال' : 'غير فعّال'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          <Button variant="outline" className="w-full gap-2" onClick={() => navigate('/dashboard/admin-document-stamping')}>
            <BadgeCheck className="w-4 h-4" />
            إدارة الأختام
            <ArrowRight className="w-4 h-4 mr-auto rtl:rotate-180" />
          </Button>
        </TabsContent>

        <TabsContent value="signatories" className="mt-4 space-y-3">
          {signatories.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">لا يوجد مفوضون</CardContent></Card>
          ) : (
            signatories.map((s: any) => (
              <Card key={s.id} className="hover:bg-muted/30 transition-colors">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{s.full_name}</p>
                    <p className="text-xs text-muted-foreground">{s.job_title || 'مفوّض'}</p>
                  </div>
                  <Badge variant={s.is_active ? 'default' : 'secondary'} className="text-[10px]">
                    {s.is_active ? 'فعّال' : 'غير فعّال'}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
          <Button variant="outline" className="w-full gap-2" onClick={() => navigate('/dashboard/authorized-signatories')}>
            <Users className="w-4 h-4" />
            إدارة المفوضين
            <ArrowRight className="w-4 h-4 mr-auto rtl:rotate-180" />
          </Button>
        </TabsContent>

        <TabsContent value="requests" className="mt-4 space-y-3">
          {signingRequests.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">لا توجد طلبات توقيع</CardContent></Card>
          ) : (
            signingRequests.slice(0, 20).map((req: any) => (
              <Card key={req.id} className="hover:bg-muted/30 transition-colors">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    req.status === 'pending' ? 'bg-destructive/10' :
                    req.status === 'signed' ? 'bg-accent/10' : 'bg-muted'
                  }`}>
                    {req.status === 'signed' ? (
                      <CheckCircle2 className="w-5 h-5 text-accent-foreground" />
                    ) : (
                      <Clock className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{req.document_title || 'طلب توقيع'}</p>
                    <p className="text-xs text-muted-foreground">{req.request_type || 'توقيع'}</p>
                  </div>
                  <Badge variant={req.status === 'pending' ? 'outline' : 'default'} className="text-[10px]">
                    {req.status === 'pending' ? 'معلق' : req.status === 'signed' ? 'تم' : req.status}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
          <Button variant="outline" className="w-full gap-2" onClick={() => navigate('/dashboard/signing-inbox')}>
            <Inbox className="w-4 h-4" />
            صندوق التوقيعات
            <ArrowRight className="w-4 h-4 mr-auto rtl:rotate-180" />
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SignaturesStampsPanel;
