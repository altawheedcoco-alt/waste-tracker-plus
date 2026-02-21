import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, LogIn, Package, FileText, Truck, Clock, CheckCircle2,
  XCircle, MapPin, Calendar, LogOut, Plus, Star, Receipt,
  Loader2, Shield, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface PortalSession {
  portal: { id: string; name: string; primaryColor: string; secondaryColor: string; logoUrl: string | null; welcomeMessage: string };
  client: { id: string; name: string; email: string | null };
  organization: { name: string; logoUrl: string | null; phone: string | null; email: string | null } | null;
  permissions: { trackShipments: boolean; viewInvoices: boolean; downloadDocuments: boolean; requestServices: boolean };
  organizationId: string;
  sessionToken: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  accepted: { label: 'مقبول', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
  in_transit: { label: 'في الطريق', color: 'bg-purple-100 text-purple-700', icon: Truck },
  delivered: { label: 'تم التسليم', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-700', icon: XCircle },
  completed: { label: 'مكتمل', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  rejected: { label: 'مرفوض', color: 'bg-red-100 text-red-700', icon: XCircle },
  en_route: { label: 'في الطريق', color: 'bg-purple-100 text-purple-700', icon: Truck },
  collecting: { label: 'جاري الجمع', color: 'bg-orange-100 text-orange-700', icon: Package },
  assigned: { label: 'تم التعيين', color: 'bg-indigo-100 text-indigo-700', icon: Truck },
  arrived: { label: 'وصل', color: 'bg-cyan-100 text-cyan-700', icon: MapPin },
  paid: { label: 'مدفوعة', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  overdue: { label: 'متأخرة', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  draft: { label: 'مسودة', color: 'bg-gray-100 text-gray-700', icon: FileText },
};

const PublicClientPortal: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<PortalSession | null>(null);
  const [activeTab, setActiveTab] = useState('shipments');
  const [shipments, setShipments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [collectionRequests, setCollectionRequests] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [requestForm, setRequestForm] = useState({
    waste_type: '', waste_description: '', estimated_weight_kg: '',
    pickup_address: '', preferred_date: '', preferred_time_slot: 'anytime', notes: '',
  });

  const primaryColor = session?.portal.primaryColor || '#1a365d';
  const secondaryColor = session?.portal.secondaryColor || '#16a34a';

  const handleLogin = async () => {
    if (!slug || !accessCode.trim()) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('portal-auth', {
        body: { slug, access_code: accessCode.trim() },
      });
      if (error) throw error;
      if (data.error) {
        toast.error(data.error === 'Invalid access code' ? 'كود الوصول غير صحيح' : 'حدث خطأ');
        return;
      }
      setSession(data);
      toast.success(`مرحباً ${data.client.name}`);
      // Load initial data
      loadData('shipments', data);
    } catch (err) {
      console.error(err);
      toast.error('فشل تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  const loadData = useCallback(async (type: string, sess?: PortalSession) => {
    const s = sess || session;
    if (!s) return;
    setDataLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('portal-data', {
        body: {
          clientId: s.client.id,
          organizationId: s.organizationId,
          dataType: type,
          portalId: s.portal.id,
          sessionToken: s.sessionToken,
        },
      });
      if (error) throw error;
      switch (type) {
        case 'shipments': setShipments(data.data || []); break;
        case 'invoices': setInvoices(data.data || []); break;
        case 'collection_requests': setCollectionRequests(data.data || []); break;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDataLoading(false);
    }
  }, [session]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'shipments' && shipments.length === 0) loadData('shipments');
    if (tab === 'invoices' && invoices.length === 0) loadData('invoices');
    if (tab === 'requests' && collectionRequests.length === 0) loadData('collection_requests');
  };

  const handleSubmitRequest = async () => {
    if (!session || !requestForm.waste_type || !requestForm.pickup_address) return;
    try {
      const { error } = await supabase.functions.invoke('portal-data', {
        body: {
          clientId: session.client.id,
          organizationId: session.organizationId,
          dataType: 'submit_collection_request',
          portalId: session.portal.id,
          sessionToken: session.sessionToken,
          requestData: {
            ...requestForm,
            customer_name: session.client.name,
            customer_email: session.client.email,
          },
        },
      });
      if (error) throw error;
      toast.success('تم إرسال طلب الجمع بنجاح');
      setShowNewRequest(false);
      setRequestForm({ waste_type: '', waste_description: '', estimated_weight_kg: '', pickup_address: '', preferred_date: '', preferred_time_slot: 'anytime', notes: '' });
      loadData('collection_requests');
    } catch (err) {
      toast.error('فشل إرسال الطلب');
    }
  };

  const handleLogout = () => {
    setSession(null);
    setAccessCode('');
    setShipments([]);
    setInvoices([]);
    setCollectionRequests([]);
  };

  // Login screen
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}10)` }} dir="rtl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Card className="shadow-xl border-0">
            <div className="h-2 rounded-t-lg" style={{ background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})` }} />
            <CardHeader className="text-center space-y-3 pb-2">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: `${primaryColor}15` }}>
                <Globe className="w-8 h-8" style={{ color: primaryColor }} />
              </div>
              <CardTitle className="text-xl">بوابة العملاء</CardTitle>
              <p className="text-sm text-muted-foreground">أدخل كود الوصول الخاص بك للمتابعة</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>كود الوصول</Label>
                <Input
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  placeholder="مثال: ABC123"
                  className="text-center text-lg font-mono tracking-widest"
                  dir="ltr"
                  maxLength={10}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <Button
                className="w-full gap-2"
                style={{ backgroundColor: primaryColor }}
                onClick={handleLogin}
                disabled={isLoading || !accessCode.trim()}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                دخول
              </Button>
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Shield className="w-3 h-3" />
                <span>اتصال مشفر وآمن</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Authenticated portal
  const renderStatus = (status: string) => {
    const cfg = STATUS_MAP[status] || { label: status, color: 'bg-gray-100 text-gray-700', icon: Clock };
    const Icon = cfg.icon;
    return <Badge className={`${cfg.color} gap-1`}><Icon className="w-3 h-3" />{cfg.label}</Badge>;
  };

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(180deg, ${primaryColor}08, white)` }} dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {session.organization?.logoUrl ? (
              <img src={session.organization.logoUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: primaryColor }}>
                {session.organization?.name?.charAt(0) || 'P'}
              </div>
            )}
            <div>
              <h1 className="font-bold text-sm">{session.portal.name}</h1>
              <p className="text-xs text-muted-foreground">{session.organization?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block">مرحباً، {session.client.name}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">خروج</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome */}
        {session.portal.welcomeMessage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card style={{ borderRightWidth: 4, borderRightColor: primaryColor }}>
              <CardContent className="p-4">
                <p className="text-sm">{session.portal.welcomeMessage}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${[session.permissions.trackShipments, session.permissions.viewInvoices, session.permissions.requestServices].filter(Boolean).length}, 1fr)` }}>
            {session.permissions.trackShipments && (
              <TabsTrigger value="shipments" className="gap-1.5"><Package className="w-4 h-4" />الشحنات</TabsTrigger>
            )}
            {session.permissions.viewInvoices && (
              <TabsTrigger value="invoices" className="gap-1.5"><Receipt className="w-4 h-4" />الفواتير</TabsTrigger>
            )}
            {session.permissions.requestServices && (
              <TabsTrigger value="requests" className="gap-1.5"><Truck className="w-4 h-4" />طلبات الجمع</TabsTrigger>
            )}
          </TabsList>

          {/* Shipments */}
          <TabsContent value="shipments" className="space-y-3">
            {dataLoading ? (
              <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" /></div>
            ) : shipments.length === 0 ? (
              <Card><CardContent className="p-12 text-center text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد شحنات</p>
              </CardContent></Card>
            ) : (
              shipments.map((s: any) => (
                <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-mono text-sm font-bold">{s.tracking_number || s.id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString('ar-EG')}</p>
                        </div>
                        {renderStatus(s.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-muted-foreground" />{s.waste_type}</div>
                        <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-muted-foreground" /><span className="truncate">{s.pickup_address || '—'}</span></div>
                        {s.quantity && <div className="text-xs text-muted-foreground">الكمية: {s.quantity} {s.unit}</div>}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* Invoices */}
          <TabsContent value="invoices" className="space-y-3">
            {dataLoading ? (
              <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" /></div>
            ) : invoices.length === 0 ? (
              <Card><CardContent className="p-12 text-center text-muted-foreground">
                <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد فواتير</p>
              </CardContent></Card>
            ) : (
              invoices.map((inv: any) => (
                <motion.div key={inv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-mono text-sm font-bold">{inv.invoice_number}</p>
                          <p className="text-xs text-muted-foreground">{new Date(inv.issue_date || inv.created_at).toLocaleDateString('ar-EG')}</p>
                        </div>
                        {renderStatus(inv.status)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold" style={{ color: primaryColor }}>
                          {Number(inv.total_amount).toLocaleString('ar-EG')} {inv.currency || 'ج.م'}
                        </span>
                        {inv.due_date && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            استحقاق: {new Date(inv.due_date).toLocaleDateString('ar-EG')}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* Collection Requests */}
          <TabsContent value="requests" className="space-y-3">
            <div className="flex justify-end">
              <Button className="gap-2" style={{ backgroundColor: primaryColor }} onClick={() => setShowNewRequest(!showNewRequest)}>
                <Plus className="w-4 h-4" />{showNewRequest ? 'إلغاء' : 'طلب جمع جديد'}
              </Button>
            </div>

            <AnimatePresence>
              {showNewRequest && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <Card className="border-2" style={{ borderColor: `${primaryColor}30` }}>
                    <CardHeader><CardTitle className="text-base">طلب جمع مخلفات جديد</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>نوع المخلفات *</Label>
                          <Select value={requestForm.waste_type} onValueChange={v => setRequestForm(p => ({ ...p, waste_type: v }))}>
                            <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                            <SelectContent>
                              {['بلاستيك', 'حديد', 'ورق وكرتون', 'زجاج', 'ألمنيوم', 'نحاس', 'إطارات', 'إلكترونيات', 'مخلفات خطرة', 'أخرى'].map(t => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>الوزن التقديري (كجم)</Label>
                          <Input type="number" value={requestForm.estimated_weight_kg} onChange={e => setRequestForm(p => ({ ...p, estimated_weight_kg: e.target.value }))} />
                        </div>
                      </div>
                      <div><Label>عنوان الاستلام *</Label><Input value={requestForm.pickup_address} onChange={e => setRequestForm(p => ({ ...p, pickup_address: e.target.value }))} /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>التاريخ المفضل</Label><Input type="date" value={requestForm.preferred_date} onChange={e => setRequestForm(p => ({ ...p, preferred_date: e.target.value }))} /></div>
                        <div>
                          <Label>الفترة</Label>
                          <Select value={requestForm.preferred_time_slot} onValueChange={v => setRequestForm(p => ({ ...p, preferred_time_slot: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="morning">صباحاً (8-12)</SelectItem>
                              <SelectItem value="afternoon">ظهراً (12-5)</SelectItem>
                              <SelectItem value="evening">مساءً (5-9)</SelectItem>
                              <SelectItem value="anytime">أي وقت</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div><Label>ملاحظات</Label><Textarea value={requestForm.notes} onChange={e => setRequestForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
                      <Button className="w-full" style={{ backgroundColor: primaryColor }} onClick={handleSubmitRequest} disabled={!requestForm.waste_type || !requestForm.pickup_address}>
                        إرسال الطلب
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {dataLoading ? (
              <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" /></div>
            ) : collectionRequests.length === 0 && !showNewRequest ? (
              <Card><CardContent className="p-12 text-center text-muted-foreground">
                <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد طلبات جمع سابقة</p>
              </CardContent></Card>
            ) : (
              collectionRequests.map((req: any) => (
                <motion.div key={req.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">{req.waste_type}</p>
                          <p className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleDateString('ar-EG')}</p>
                        </div>
                        {renderStatus(req.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{req.pickup_address}</div>
                        {req.estimated_weight_kg && <span className="text-xs">• {req.estimated_weight_kg} كجم</span>}
                      </div>
                      {req.rating && (
                        <div className="flex items-center gap-0.5 mt-2">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={`w-3.5 h-3.5 ${s <= req.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/20'}`} />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-4 text-center text-xs text-muted-foreground">
        <p>بوابة {session.organization?.name || session.portal.name}</p>
        {session.organization?.phone && <p>تواصل: {session.organization.phone}</p>}
      </footer>
    </div>
  );
};

export default PublicClientPortal;
