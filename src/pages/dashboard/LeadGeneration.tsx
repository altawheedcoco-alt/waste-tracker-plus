import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, Search, Download, Database, Building2, Phone, Mail, MapPin, Loader2, AlertTriangle, Link2, FileSpreadsheet } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface ExtractedContact {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  source: string;
}

const LeadGeneration = () => {
  const { t } = useLanguage();
  const [url, setUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [contacts, setContacts] = useState<ExtractedContact[]>([]);
  const [searchHistory, setSearchHistory] = useState<Array<{ url: string; count: number; date: string }>>([]);

  const extractContacts = async () => {
    if (!url.trim()) {
      toast.error('يرجى إدخال رابط صالح');
      return;
    }

    setIsExtracting(true);
    try {
      // Simulate extraction for now - in production this would use Firecrawl
      await new Promise(r => setTimeout(r, 2000));
      
      const mockContacts: ExtractedContact[] = [
        { name: 'جهة تواصل', email: 'info@example.com', phone: '+20 2 1234 5678', address: 'القاهرة، مصر', source: url },
      ];
      
      setContacts(prev => [...mockContacts, ...prev]);
      setSearchHistory(prev => [{ url, count: mockContacts.length, date: new Date().toLocaleDateString('ar-EG') }, ...prev]);
      toast.success(`تم استخراج ${mockContacts.length} جهة اتصال`);
    } catch (err) {
      toast.error('فشل في استخراج البيانات من هذا الرابط');
    } finally {
      setIsExtracting(false);
    }
  };

  const exportToCSV = () => {
    if (!contacts.length) {
      toast.error('لا توجد بيانات للتصدير');
      return;
    }
    const bom = '\uFEFF';
    const headers = ['الاسم', 'البريد الإلكتروني', 'التليفون', 'العنوان', 'الموقع', 'المصدر'];
    const rows = contacts.map(c => [c.name || '', c.email || '', c.phone || '', c.address || '', c.website || '', c.source]);
    const csv = bom + [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success('تم تصدير البيانات');
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 p-3 md:p-6">
        <BackButton />
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold">استخراج بيانات العملاء المحتملين</h1>
              <p className="text-muted-foreground text-xs sm:text-sm">استخراج بيانات التواصل من المواقع والأدلة التجارية</p>
            </div>
          </div>
        </motion.div>

        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              هذه الأداة تستخرج بيانات التواصل من المواقع <strong>العامة فقط</strong> (صفحات الشركات، الأدلة التجارية). 
              لا يتم استخراج بيانات من وسائل التواصل الاجتماعي أو الصفحات المحمية.
            </p>
          </CardContent>
        </Card>

        <Tabs defaultValue="extract" dir="rtl">
          <TabsList className="w-full">
            <TabsTrigger value="extract" className="flex-1 gap-1.5 text-xs sm:text-sm">
              <Search className="w-3.5 h-3.5" /> استخراج
            </TabsTrigger>
            <TabsTrigger value="results" className="flex-1 gap-1.5 text-xs sm:text-sm">
              <Database className="w-3.5 h-3.5" /> النتائج ({contacts.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 gap-1.5 text-xs sm:text-sm">
              <Link2 className="w-3.5 h-3.5" /> السجل
            </TabsTrigger>
          </TabsList>

          <TabsContent value="extract" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">أدخل رابط الموقع</CardTitle>
                <CardDescription className="text-xs">
                  أدخل رابط موقع شركة أو دليل تجاري لاستخراج بيانات التواصل
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    dir="ltr"
                    className="flex-1"
                    onKeyDown={e => e.key === 'Enter' && extractContacts()}
                  />
                  <Button onClick={extractContacts} disabled={isExtracting} className="shrink-0">
                    {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <span className="hidden sm:inline mr-1">استخراج</span>
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'وزارة البيئة', url: 'https://www.eeaa.gov.eg' },
                    { label: 'جهاز المخلفات WMRA', url: 'https://www.wmra.gov.eg' },
                    { label: 'WIMS', url: 'https://wims.wmra.gov.eg' },
                    { label: 'ScrapMonster', url: 'https://www.scrapmonster.com/companies/country/egypt' },
                  ].map(s => (
                    <Button key={s.url} variant="outline" size="sm" className="text-[10px] h-8" onClick={() => setUrl(s.url)}>
                      {s.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Building2, label: 'شركات مستخرجة', value: contacts.length, color: 'text-primary' },
                { icon: Mail, label: 'إيميلات', value: contacts.filter(c => c.email).length, color: 'text-blue-500' },
                { icon: Phone, label: 'أرقام تليفون', value: contacts.filter(c => c.phone).length, color: 'text-green-500' },
                { icon: MapPin, label: 'عناوين', value: contacts.filter(c => c.address).length, color: 'text-amber-500' },
              ].map(stat => (
                <Card key={stat.label}>
                  <CardContent className="p-3 text-center">
                    <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
                    <p className="text-lg font-bold">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="results" className="mt-4">
            <Card>
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <CardTitle className="text-base">النتائج المستخرجة</CardTitle>
                <Button variant="outline" size="sm" onClick={exportToCSV} disabled={!contacts.length}>
                  <Download className="w-3.5 h-3.5 ml-1" /> تصدير CSV
                </Button>
              </CardHeader>
              <CardContent>
                {contacts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">لم يتم استخراج أي بيانات بعد</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {contacts.map((c, i) => (
                      <div key={i} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            {c.name && <p className="font-medium text-sm">{c.name}</p>}
                            {c.email && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="w-3 h-3" /> {c.email}
                              </div>
                            )}
                            {c.phone && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="w-3 h-3" /> {c.phone}
                              </div>
                            )}
                            {c.address && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="w-3 h-3" /> {c.address}
                              </div>
                            )}
                          </div>
                          <Badge variant="secondary" className="text-[9px]">
                            {new URL(c.source).hostname}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">سجل الاستخراج</CardTitle>
              </CardHeader>
              <CardContent>
                {searchHistory.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-6">لا يوجد سجل بعد</p>
                ) : (
                  <div className="space-y-2">
                    {searchHistory.map((h, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded border text-xs">
                        <span className="truncate flex-1" dir="ltr">{h.url}</span>
                        <Badge variant="outline" className="mr-2">{h.count} نتيجة</Badge>
                        <span className="text-muted-foreground">{h.date}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default LeadGeneration;
