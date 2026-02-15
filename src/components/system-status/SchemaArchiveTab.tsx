import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Database, Table2, Code2, Shield, Zap, RefreshCw, Download, Clock, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

interface SchemaSnapshot {
  id: string;
  snapshot_type: string;
  snapshot_data: any;
  description: string;
  created_at: string;
  created_by: string;
}

export const SchemaArchiveTab = () => {
  const [search, setSearch] = useState('');
  const [capturing, setCapturing] = useState(false);

  const { data: snapshots, isLoading, refetch } = useQuery({
    queryKey: ['schema-snapshots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_schema_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as SchemaSnapshot[];
    },
  });

  const captureSnapshot = async () => {
    setCapturing(true);
    try {
      const { error } = await supabase.rpc('capture_schema_snapshot', {
        p_description: `Manual snapshot - ${new Date().toLocaleDateString('ar-SA')}`
      });
      if (error) throw error;
      toast.success('✅ تم حفظ لقطة كاملة من هيكل قاعدة البيانات');
      refetch();
    } catch (e: any) {
      toast.error('فشل في التقاط اللقطة: ' + e.message);
    } finally {
      setCapturing(false);
    }
  };

  const latestSnapshot = snapshots?.[0]?.snapshot_data;

  const tables = latestSnapshot?.tables || [];
  const functions = latestSnapshot?.functions || [];
  const indexes = latestSnapshot?.indexes || [];
  const policies = latestSnapshot?.policies || [];
  const triggers = latestSnapshot?.triggers || [];

  const filteredTables = tables.filter((t: any) =>
    !search || t.name?.toLowerCase().includes(search.toLowerCase())
  );

  const exportSnapshot = () => {
    if (!latestSnapshot) return;
    const blob = new Blob([JSON.stringify(latestSnapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schema-snapshot-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('تم تحميل الملف');
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                أرشيف هيكل قاعدة البيانات
              </CardTitle>
              <CardDescription>
                جميع الجداول والدوال والفهارس والسياسات محفوظة داخل النظام - تبقى حتى بعد الريمكس
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportSnapshot} disabled={!latestSnapshot}>
                <Download className="w-4 h-4 ml-2" />
                تصدير JSON
              </Button>
              <Button size="sm" onClick={captureSnapshot} disabled={capturing}>
                <RefreshCw className={`w-4 h-4 ml-2 ${capturing ? 'animate-spin' : ''}`} />
                التقاط لقطة جديدة
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4 mb-4">
            <StatCard icon={Table2} label="جداول" count={tables.length} color="text-blue-500" />
            <StatCard icon={Code2} label="دوال" count={functions.length} color="text-green-500" />
            <StatCard icon={Zap} label="فهارس" count={indexes.length} color="text-yellow-500" />
            <StatCard icon={Shield} label="سياسات أمان" count={policies.length} color="text-red-500" />
            <StatCard icon={RefreshCw} label="محفزات" count={triggers.length} color="text-purple-500" />
          </div>
          <div className="relative">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن جدول..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Snapshot History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4" />
            سجل اللقطات ({snapshots?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {snapshots?.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-primary" />
                  <span>{s.description}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{s.snapshot_data?.tables?.length || 0} جدول</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(s.created_at).toLocaleString('ar-SA')}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && <p className="text-center text-muted-foreground">جارٍ التحميل...</p>}
          </div>
        </CardContent>
      </Card>

      {/* Tables Detail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table2 className="w-5 h-5 text-blue-500" />
            الجداول ({filteredTables.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Accordion type="multiple">
              {filteredTables.map((table: any, idx: number) => (
                <AccordionItem key={idx} value={`table-${idx}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Table2 className="w-4 h-4 text-blue-500" />
                      <span className="font-mono text-sm">{table.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {table.columns?.length || 0} عمود
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-right p-2">العمود</th>
                            <th className="text-right p-2">النوع</th>
                            <th className="text-right p-2">قابل للفراغ</th>
                            <th className="text-right p-2">القيمة الافتراضية</th>
                          </tr>
                        </thead>
                        <tbody>
                          {table.columns?.map((col: any, i: number) => (
                            <tr key={i} className="border-b border-muted">
                              <td className="p-2 font-mono text-xs">{col.name}</td>
                              <td className="p-2">
                                <Badge variant="outline" className="text-xs">{col.type}</Badge>
                              </td>
                              <td className="p-2">
                                {col.nullable === 'YES' ? '✅' : '❌'}
                              </td>
                              <td className="p-2 text-xs text-muted-foreground max-w-[200px] truncate">
                                {col.default || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Functions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-green-500" />
            الدوال ({functions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {functions.map((fn: any, idx: number) => (
                <Accordion key={idx} type="single" collapsible>
                  <AccordionItem value={`fn-${idx}`}>
                    <AccordionTrigger className="hover:no-underline py-2">
                      <div className="flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-green-500" />
                        <span className="font-mono text-xs">{fn.name}({fn.args || ''})</span>
                        <Badge variant="outline" className="text-xs">{fn.language}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto max-h-[200px] font-mono whitespace-pre-wrap" dir="ltr">
                        {fn.source}
                      </pre>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Policies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-500" />
            سياسات الأمان RLS ({policies.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {policies.map((pol: any, idx: number) => (
                <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-3 h-3 text-red-500" />
                    <span className="font-mono text-xs font-bold">{pol.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {pol.table}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {pol.command === 'r' ? 'SELECT' : pol.command === 'a' ? 'INSERT' : pol.command === 'w' ? 'UPDATE' : pol.command === 'd' ? 'DELETE' : pol.command === '*' ? 'ALL' : pol.command}
                    </Badge>
                  </div>
                  {pol.qual && (
                    <pre className="text-xs text-muted-foreground font-mono mt-1" dir="ltr">USING: {pol.qual}</pre>
                  )}
                  {pol.with_check && (
                    <pre className="text-xs text-muted-foreground font-mono" dir="ltr">WITH CHECK: {pol.with_check}</pre>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, count, color }: { icon: any; label: string; count: number; color: string }) => (
  <div className="text-center p-3 bg-muted/50 rounded-lg">
    <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
    <p className="text-2xl font-bold">{count}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);
