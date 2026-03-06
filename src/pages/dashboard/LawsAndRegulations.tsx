import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, Scale, Download, ExternalLink, BookOpen, Shield, 
  AlertTriangle, Leaf, Building2, Truck, Factory, Recycle,
  ChevronDown, ChevronUp, Search
} from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

interface LawSection {
  id: string;
  title: string;
  articles: { number: string; text: string }[];
}

const LawsAndRegulations = () => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const laws = [
    {
      id: 'law202',
      icon: FileText,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      title: 'قانون تنظيم إدارة المخلفات رقم 202 لسنة 2020',
      subtitle: 'القانون الأساسي المنظم لإدارة المخلفات في جمهورية مصر العربية',
      pdfPath: '/docs/law-202-2020.pdf',
      issuedBy: 'رئاسة الجمهورية',
      issuedDate: '2020',
      sections: [
        {
          id: 'law202-ch1',
          title: 'الباب الأول: التعريفات والأحكام العامة',
          articles: [
            { number: 'المادة 1', text: 'يُقصد في تطبيق أحكام هذا القانون بالكلمات والعبارات التالية المعنى المبيّن قرين كل منها...' },
            { number: 'المادة 2', text: 'تسري أحكام هذا القانون على جميع أنواع المخلفات البلدية والصناعية والزراعية والطبية ومخلفات الهدم والبناء والمخلفات الخطرة.' },
            { number: 'المادة 3', text: 'يُنشأ جهاز تنظيم إدارة المخلفات (WMRA) تكون له الشخصية الاعتبارية ويتبع الوزير المختص.' },
          ],
        },
        {
          id: 'law202-ch2',
          title: 'الباب الثاني: المخلفات البلدية',
          articles: [
            { number: 'المادة 10', text: 'تلتزم الجهات المولّدة للمخلفات البلدية بالفصل من المنبع والتسليم للجهات المرخصة.' },
            { number: 'المادة 14', text: 'يحظر إلقاء المخلفات أو معالجتها أو التخلص منها بطرق غير آمنة بيئياً.' },
          ],
        },
        {
          id: 'law202-ch3',
          title: 'الباب الثالث: المخلفات الصناعية والزراعية',
          articles: [
            { number: 'المادة 24', text: 'تلتزم المنشآت الصناعية والزراعية بإدارة مخلفاتها وفقاً لنظام إدارة بيئي معتمد.' },
            { number: 'المادة 27', text: 'يجب الحصول على ترخيص من الجهاز قبل مزاولة أي نشاط لجمع أو نقل أو معالجة المخلفات الصناعية.' },
          ],
        },
        {
          id: 'law202-ch4',
          title: 'الباب الرابع: مخلفات الهدم والبناء',
          articles: [
            { number: 'المادة 35', text: 'يلتزم المقاول بالتخلص الآمن من مخلفات الهدم والبناء في الأماكن المخصصة لذلك.' },
          ],
        },
        {
          id: 'law202-ch5',
          title: 'الباب الخامس: المخلفات الخطرة والطبية',
          articles: [
            { number: 'المادة 40', text: 'يحظر خلط المخلفات الخطرة بغيرها من المخلفات، ويجب فصلها وتصنيفها من المنبع.' },
            { number: 'المادة 44', text: 'يلتزم مولّد المخلفات الخطرة بالاحتفاظ بسجل يتضمن بيانات كمياتها وأنواعها وطرق التخلص منها.' },
          ],
        },
        {
          id: 'law202-ch6',
          title: 'الباب السادس: العقوبات والجزاءات',
          articles: [
            { number: 'المادة 60', text: 'يُعاقب بغرامة لا تقل عن مليون جنيه ولا تزيد عن عشرين مليون جنيه كل من خالف أحكام المواد المتعلقة بالمخلفات الخطرة.' },
            { number: 'المادة 65', text: 'يُعاقب بغرامة لا تقل عن خمسين ألف جنيه ولا تزيد عن مائتي ألف جنيه كل من ألقى مخلفات في غير الأماكن المخصصة.' },
          ],
        },
      ] as LawSection[],
    },
    {
      id: 'exec-reg',
      icon: Scale,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      borderColor: 'border-blue-200 dark:border-blue-800',
      title: 'اللائحة التنفيذية لقانون تنظيم إدارة المخلفات',
      subtitle: 'الصادرة بقرار رئيس مجلس الوزراء - تفصيل الإجراءات والاشتراطات الفنية',
      pdfPath: '/docs/executive-regulations-202-2020.pdf',
      issuedBy: 'مجلس الوزراء',
      issuedDate: '2020',
      sections: [
        {
          id: 'exec-ch1',
          title: 'الفصل الأول: التراخيص والتصاريح',
          articles: [
            { number: 'المادة 1', text: 'يتقدم طالب الترخيص بطلب مرفق به المستندات المحددة إلى جهاز تنظيم إدارة المخلفات.' },
            { number: 'المادة 5', text: 'يجب أن يتضمن طلب الترخيص: خطة تشغيلية، هيكل تنظيمي، بيانات المعدات، ونظام تتبع.' },
          ],
        },
        {
          id: 'exec-ch2',
          title: 'الفصل الثاني: اشتراطات النقل',
          articles: [
            { number: 'المادة 15', text: 'يلتزم الناقل بتجهيز مركبات النقل بنظام تتبع GPS وتسجيل كافة الرحلات إلكترونياً.' },
            { number: 'المادة 18', text: 'يجب أن تكون مركبات نقل المخلفات مطابقة للمواصفات الفنية المعتمدة من الجهاز.' },
            { number: 'المادة 22', text: 'يلتزم الناقل بتقديم خطة عمل سنوية تتضمن المسارات والجداول الزمنية والمعدات.' },
          ],
        },
        {
          id: 'exec-ch3',
          title: 'الفصل الثالث: اشتراطات المعالجة والتخلص',
          articles: [
            { number: 'المادة 30', text: 'يلتزم مشغل منشأة المعالجة أو التخلص بتقديم تقارير دورية عن كميات المخلفات الواردة والمعالجة.' },
            { number: 'المادة 35', text: 'يجب توفير خطة طوارئ بيئية معتمدة لكل منشأة معالجة أو تخلص.' },
          ],
        },
        {
          id: 'exec-ch4',
          title: 'الفصل الرابع: السجلات والتقارير',
          articles: [
            { number: 'المادة 40', text: 'يلتزم كل مرخص له بالاحتفاظ بسجلات إلكترونية لجميع عمليات إدارة المخلفات لمدة لا تقل عن 5 سنوات.' },
            { number: 'المادة 45', text: 'يجب تقديم تقرير سنوي شامل للجهاز يتضمن إحصائيات الأداء ومؤشرات الامتثال.' },
          ],
        },
      ] as LawSection[],
    },
  ];

  const relatedLaws = [
    {
      icon: Leaf,
      title: 'قانون البيئة رقم 4 لسنة 1994',
      desc: 'القانون الإطاري لحماية البيئة - تعديلات 2009',
      relevance: 'أساسي',
    },
    {
      icon: Truck,
      title: 'قانون النقل البري - هيئة LTRA',
      desc: 'تنظيم نقل البضائع والمخلفات على الطرق',
      relevance: 'مكمل',
    },
    {
      icon: Factory,
      title: 'قانون التنمية الصناعية - هيئة IDA',
      desc: 'ترخيص المنشآت الصناعية والبيئية',
      relevance: 'مكمل',
    },
    {
      icon: Shield,
      title: 'اتفاقية بازل',
      desc: 'التحكم في نقل النفايات الخطرة عبر الحدود',
      relevance: 'دولي',
    },
  ];

  const obligations = [
    { icon: Building2, role: 'المولّد', items: ['التسجيل في النظام الوطني', 'الفصل من المنبع', 'التسليم لجهة مرخصة', 'الاحتفاظ بسجلات'] },
    { icon: Truck, role: 'الناقل', items: ['ترخيص WMRA', 'نظام تتبع GPS', 'خطة تشغيلية سنوية', 'هيكل تنظيمي معتمد'] },
    { icon: Recycle, role: 'المدوّر', items: ['ترخيص المنشأة', 'تقارير دورية', 'شهادات إعادة التدوير', 'معايير بيئية'] },
    { icon: Factory, role: 'جهة التخلص', items: ['ترخيص التشغيل', 'خطة طوارئ بيئية', 'رصد بيئي مستمر', 'تقارير سنوية'] },
  ];

  const filteredLaws = searchTerm
    ? laws.map(law => ({
        ...law,
        sections: law.sections.filter(s =>
          s.title.includes(searchTerm) ||
          s.articles.some(a => a.text.includes(searchTerm) || a.number.includes(searchTerm))
        ),
      })).filter(law => law.title.includes(searchTerm) || law.sections.length > 0)
    : laws;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Scale className="w-7 h-7 text-primary" />
            القوانين واللوائح التنظيمية
          </h1>
          <p className="text-muted-foreground mt-1">
            المرجعية القانونية لإدارة المخلفات في جمهورية مصر العربية
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث في القوانين..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      <Tabs defaultValue="laws" dir="rtl">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="laws">القوانين الأساسية</TabsTrigger>
          <TabsTrigger value="obligations">الالتزامات حسب الجهة</TabsTrigger>
          <TabsTrigger value="related">تشريعات ذات صلة</TabsTrigger>
        </TabsList>

        {/* Tab 1: القوانين */}
        <TabsContent value="laws" className="space-y-6 mt-4">
          {filteredLaws.map((law) => (
            <Card key={law.id} className={`${law.borderColor} border`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl ${law.bgColor}`}>
                      <law.icon className={`w-6 h-6 ${law.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg leading-relaxed">{law.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{law.subtitle}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary">{law.issuedBy}</Badge>
                        <Badge variant="outline">{law.issuedDate}</Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 shrink-0"
                    onClick={() => window.open(law.pdfPath, '_blank')}
                  >
                    <Download className="w-4 h-4" />
                    تحميل PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {law.sections.map((section) => {
                  const isExpanded = expandedSections.has(section.id);
                  return (
                    <div key={section.id} className="border rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-right"
                      >
                        <span className="font-medium text-sm">{section.title}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </button>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="border-t p-3 space-y-3">
                              {section.articles.map((article, idx) => (
                                <div key={idx} className="flex gap-3">
                                  <Badge variant="outline" className="shrink-0 h-fit mt-0.5 text-xs">
                                    {article.number}
                                  </Badge>
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {article.text}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Tab 2: الالتزامات */}
        <TabsContent value="obligations" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {obligations.map((ob, idx) => (
              <Card key={idx}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ob.icon className="w-5 h-5 text-primary" />
                    {ob.role}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {ob.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="mt-4 border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-destructive">تحذير قانوني</p>
                <p className="text-sm text-muted-foreground mt-1">
                  أي إخلال بالالتزامات الواردة في قانون 202 لسنة 2020 يعرّض المخالف للمساءلة المدنية والجنائية، 
                  بما في ذلك غرامات تصل إلى 20 مليون جنيه وإلغاء الترخيص.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: تشريعات ذات صلة */}
        <TabsContent value="related" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedLaws.map((law, idx) => (
              <Card key={idx} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <law.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm">{law.title}</h3>
                      <Badge variant={law.relevance === 'أساسي' ? 'default' : law.relevance === 'دولي' ? 'secondary' : 'outline'} className="text-xs">
                        {law.relevance}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{law.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="mt-4">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-primary" />
                <span className="text-sm">الموقع الرسمي لجهاز تنظيم إدارة المخلفات WMRA</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => window.open('https://wims.wmra.gov.eg', '_blank')}>
                زيارة الموقع
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LawsAndRegulations;
