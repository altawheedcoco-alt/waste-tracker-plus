import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Loader2, Lock, Truck, Banknote, BookOpen, BarChart3,
  ArrowUpDown, Package, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown,
} from 'lucide-react';
import { toast } from 'sonner';

interface LinkInfo {
  id: string;
  link_name: string;
  description: string;
  assigned_to_name: string;
  organization_id: string;
  organization_name: string;
  scoped_organization_ids: string[];
  scoped_org_names: Record<string, string>;
  can_view_shipments: boolean;
  can_create_shipments: boolean;
  can_view_deposits: boolean;
  can_create_deposits: boolean;
  can_view_ledger: boolean;
  can_view_invoices: boolean;
  waste_types_filter: string[] | null;
}

export default function ScopedAccessPortal() {
  const { code } = useParams<{ code: string }>();
  const [loading, setLoading] = useState(true);
  const [requiresPin, setRequiresPin] = useState(false);
  const [pin, setPin] = useState('');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [linkInfo, setLinkInfo] = useState<LinkInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [shipments, setShipments] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(false);

  const validateLink = useCallback(async (pinValue?: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('scoped-access-data', {
        body: { action: 'validate', linkCode: code, pin: pinValue },
      });
      if (fnErr) throw fnErr;
      if (data?.error) {
        if (data.requiresPin) {
          setRequiresPin(true);
          setLoading(false);
          return;
        }
        setError(data.error);
        setLoading(false);
        return;
      }
      setSessionToken(data.sessionToken);
      setLinkInfo(data.link);
      setRequiresPin(false);
    } catch (e: any) {
      setError(e.message || 'فشل في التحقق من الرابط');
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => { validateLink(); }, [validateLink]);

  const fetchData = useCallback(async (dataType: string) => {
    if (!sessionToken) return null;
    const { data, error: fnErr } = await supabase.functions.invoke('scoped-access-data', {
      body: { action: 'fetch-data', sessionToken, dataType },
    });
    if (fnErr || data?.error) return null;
    return data?.data;
  }, [sessionToken]);

  useEffect(() => {
    if (!sessionToken || !linkInfo) return;
    const loadAll = async () => {
      setDataLoading(true);
      try {
        const promises: Promise<any>[] = [fetchData('summary')];
        if (linkInfo.can_view_shipments) promises.push(fetchData('shipments'));
        if (linkInfo.can_view_deposits) promises.push(fetchData('deposits'));
        if (linkInfo.can_view_ledger) promises.push(fetchData('ledger'));
        
        const results = await Promise.all(promises);
        let idx = 0;
        setSummary(results[idx++]);
        if (linkInfo.can_view_shipments) setShipments(results[idx++] || []);
        if (linkInfo.can_view_deposits) setDeposits(results[idx++] || []);
        if (linkInfo.can_view_ledger) setLedger(results[idx++] || []);
      } finally {
        setDataLoading(false);
      }
    };
    loadAll();
  }, [sessionToken, linkInfo, fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-12 space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">{error}</h2>
            <p className="text-sm text-muted-foreground">تأكد من صحة الرابط أو تواصل مع الجهة المرسلة</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requiresPin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-sm w-full">
          <CardHeader className="text-center">
            <Lock className="h-10 w-10 text-primary mx-auto mb-2" />
            <CardTitle>رمز الوصول مطلوب</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="أدخل رمز PIN"
              value={pin}
              onChange={e => setPin(e.target.value)}
              className="text-center text-lg"
              dir="ltr"
            />
            <Button className="w-full" onClick={() => validateLink(pin)} disabled={!pin}>
              دخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!linkInfo) return null;

  const allOrgNames = [
    linkInfo.organization_name,
    ...Object.values(linkInfo.scoped_org_names),
  ].filter(Boolean);

  const availableTabs: { value: string; label: string; icon: any }[] = [];
  availableTabs.push({ value: 'overview', label: 'نظرة عامة', icon: BarChart3 });
  if (linkInfo.can_view_shipments) availableTabs.push({ value: 'shipments', label: 'الشحنات', icon: Truck });
  if (linkInfo.can_view_deposits) availableTabs.push({ value: 'deposits', label: 'الإيداعات', icon: Banknote });
  if (linkInfo.can_view_ledger) availableTabs.push({ value: 'ledger', label: 'كشف الحساب', icon: BookOpen });

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{linkInfo.link_name}</h1>
              <p className="text-sm text-muted-foreground">
                مرحباً {linkInfo.assigned_to_name} — {linkInfo.organization_name}
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              {allOrgNames.map((name, i) => (
                <Badge key={i} variant="outline" className="text-xs">{name}</Badge>
              ))}
            </div>
          </div>
          {linkInfo.description && (
            <p className="text-xs text-muted-foreground mt-2">{linkInfo.description}</p>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {dataLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="overview" dir="rtl">
            <TabsList className="flex-wrap">
              {availableTabs.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview">
              {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <SummaryCard icon={Package} label="عدد الشحنات" value={summary.shipmentsCount} />
                  <SummaryCard icon={Truck} label="إجمالي الكميات (طن)" value={summary.totalQuantity?.toFixed(1)} />
                  <SummaryCard icon={TrendingUp} label="قيمة الشحنات" value={`${(summary.totalShipmentValue || 0).toLocaleString()} ج.م`} />
                  <SummaryCard icon={Banknote} label="إجمالي الإيداعات" value={`${(summary.totalDeposits || 0).toLocaleString()} ج.م`} />
                </div>
              )}
              {summary && (
                <Card className="mt-4">
                  <CardContent className="py-6 text-center">
                    <p className="text-sm text-muted-foreground mb-1">الرصيد الحالي</p>
                    <p className={`text-3xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                      {summary.balance >= 0 ? '+' : ''}{summary.balance?.toLocaleString()} ج.م
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {summary.balance >= 0 ? 'رصيد دائن (لصالح الجهة)' : 'رصيد مدين (مستحق على الجهة)'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Shipments */}
            {linkInfo.can_view_shipments && (
              <TabsContent value="shipments">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      الشحنات ({shipments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {shipments.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">لا توجد شحنات</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-muted-foreground">
                              <th className="py-2 px-2 text-right">رقم التتبع</th>
                              <th className="py-2 px-2 text-right">الحالة</th>
                              <th className="py-2 px-2 text-right">نوع المخلف</th>
                              <th className="py-2 px-2 text-right">الكمية</th>
                              <th className="py-2 px-2 text-right">السعر</th>
                              <th className="py-2 px-2 text-right">المولد</th>
                              <th className="py-2 px-2 text-right">الناقل</th>
                              <th className="py-2 px-2 text-right">المدور</th>
                              <th className="py-2 px-2 text-right">التاريخ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {shipments.map((s: any) => (
                              <tr key={s.id} className="border-b hover:bg-muted/30">
                                <td className="py-2 px-2 font-mono text-xs">{s.tracking_number}</td>
                                <td className="py-2 px-2">
                                  <Badge variant={s.status === 'delivered' ? 'default' : 'secondary'} className="text-[10px]">
                                    {s.status}
                                  </Badge>
                                </td>
                                <td className="py-2 px-2">{s.waste_type}</td>
                                <td className="py-2 px-2">{s.quantity} {s.unit}</td>
                                <td className="py-2 px-2">{(s.total_price || 0).toLocaleString()}</td>
                                <td className="py-2 px-2 text-xs">{s.generator_name}</td>
                                <td className="py-2 px-2 text-xs">{s.transporter_name}</td>
                                <td className="py-2 px-2 text-xs">{s.recycler_name}</td>
                                <td className="py-2 px-2 text-xs">{new Date(s.created_at).toLocaleDateString('ar-EG')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Deposits */}
            {linkInfo.can_view_deposits && (
              <TabsContent value="deposits">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Banknote className="h-5 w-5" />
                      الإيداعات ({deposits.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {deposits.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">لا توجد إيداعات</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-muted-foreground">
                              <th className="py-2 px-2 text-right">المبلغ</th>
                              <th className="py-2 px-2 text-right">الحالة</th>
                              <th className="py-2 px-2 text-right">طريقة الدفع</th>
                              <th className="py-2 px-2 text-right">المرجع</th>
                              <th className="py-2 px-2 text-right">التاريخ</th>
                              <th className="py-2 px-2 text-right">ملاحظات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {deposits.map((d: any) => (
                              <tr key={d.id} className="border-b hover:bg-muted/30">
                                <td className="py-2 px-2 font-semibold">{(d.amount || 0).toLocaleString()} ج.م</td>
                                <td className="py-2 px-2">
                                  <Badge variant={d.status === 'confirmed' ? 'default' : 'secondary'} className="text-[10px]">
                                    {d.status}
                                  </Badge>
                                </td>
                                <td className="py-2 px-2">{d.payment_method || '-'}</td>
                                <td className="py-2 px-2 font-mono text-xs">{d.reference_number || '-'}</td>
                                <td className="py-2 px-2 text-xs">{new Date(d.created_at).toLocaleDateString('ar-EG')}</td>
                                <td className="py-2 px-2 text-xs">{d.notes || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Ledger */}
            {linkInfo.can_view_ledger && (
              <TabsContent value="ledger">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      كشف الحساب ({ledger.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {ledger.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">لا توجد قيود</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-muted-foreground">
                              <th className="py-2 px-2 text-right">التاريخ</th>
                              <th className="py-2 px-2 text-right">النوع</th>
                              <th className="py-2 px-2 text-right">الفئة</th>
                              <th className="py-2 px-2 text-right">المبلغ</th>
                              <th className="py-2 px-2 text-right">من</th>
                              <th className="py-2 px-2 text-right">إلى</th>
                              <th className="py-2 px-2 text-right">الوصف</th>
                              <th className="py-2 px-2 text-right">الرصيد بعد</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ledger.map((e: any) => (
                              <tr key={e.id} className="border-b hover:bg-muted/30">
                                <td className="py-2 px-2 text-xs">{new Date(e.entry_date).toLocaleDateString('ar-EG')}</td>
                                <td className="py-2 px-2">
                                  <Badge variant={e.entry_type === 'credit' ? 'default' : 'destructive'} className="text-[10px]">
                                    {e.entry_type === 'credit' ? 'دائن' : 'مدين'}
                                  </Badge>
                                </td>
                                <td className="py-2 px-2 text-xs">{e.entry_category}</td>
                                <td className="py-2 px-2 font-semibold">{(e.amount || 0).toLocaleString()}</td>
                                <td className="py-2 px-2 text-xs">{e.organization_name}</td>
                                <td className="py-2 px-2 text-xs">{e.partner_name}</td>
                                <td className="py-2 px-2 text-xs truncate max-w-[150px]">{e.description || '-'}</td>
                                <td className="py-2 px-2 text-xs">{e.balance_after != null ? e.balance_after.toLocaleString() : '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <Card>
      <CardContent className="py-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
