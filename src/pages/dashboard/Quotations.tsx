import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useQuotations, type QuotationItem, type Quotation } from '@/hooks/useQuotations';
import { getTemplatesByEntity, getTemplateById, ENTITY_LABELS, DIRECTION_LABELS, DOCUMENT_TYPE_LABELS, type QuotationTemplate, type QuotationDirection, type DocumentType } from '@/lib/quotationTemplates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileText, Send, Printer, Trash2, Check, X, Clock, ArrowUpRight, ArrowDownLeft, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useReactToPrint } from 'react-to-print';
import QuotationPrintView from '@/components/quotations/QuotationPrintView';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'مسودة', variant: 'secondary' },
  sent: { label: 'مُرسل', variant: 'default' },
  viewed: { label: 'تمت المشاهدة', variant: 'outline' },
  accepted: { label: 'مقبول', variant: 'default' },
  rejected: { label: 'مرفوض', variant: 'destructive' },
  expired: { label: 'منتهي', variant: 'secondary' },
  cancelled: { label: 'ملغي', variant: 'destructive' },
};

const Quotations = () => {
  const navigate = useNavigate();
  const { organization } = useAuth();
  const orgType = (organization as any)?.type || 'generator';
  const { quotations, receivedQuotations, isLoading, createQuotation, updateStatus, deleteQuotation, getQuotationItems } = useQuotations(organization?.id);

  const [showCreate, setShowCreate] = useState(false);
  const [createDirection, setCreateDirection] = useState<QuotationDirection>('outgoing');
  const [selectedTemplate, setSelectedTemplate] = useState<QuotationTemplate | null>(null);
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [clientType, setClientType] = useState<'registered' | 'unregistered'>('unregistered');
  const [formData, setFormData] = useState<Partial<Quotation>>({});
  const [viewQuotation, setViewQuotation] = useState<Quotation | null>(null);
  const [viewItems, setViewItems] = useState<QuotationItem[]>([]);
  const [mainTab, setMainTab] = useState('outgoing');

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: printRef });

  const handleOpenCreate = (direction: QuotationDirection) => {
    setCreateDirection(direction);
    setSelectedTemplate(null);
    setItems([]);
    setFormData({});
    setShowCreate(true);
  };

  const templates = getTemplatesByEntity(orgType, createDirection);

  const handleSelectTemplate = (template: QuotationTemplate) => {
    setSelectedTemplate(template);
    setItems(template.defaultItems.map((item, idx) => ({
      item_order: idx + 1,
      description: item.description,
      unit: item.unit,
      quantity: 1,
      unit_price: item.defaultPrice || 0,
      total_price: item.defaultPrice || 0,
    })));
    setFormData({
      title: template.nameAr,
      description: template.headerNote,
      template_id: template.id,
      terms_and_conditions: template.defaultTerms,
      payment_terms: template.defaultPaymentTerms,
      delivery_terms: template.defaultDeliveryTerms,
      tax_rate: 14,
      discount_amount: 0,
    });
  };

  const updateItem = (index: number, field: keyof QuotationItem, value: any) => {
    setItems(prev => {
      const updated = [...prev];
      (updated[index] as any)[field] = value;
      if (field === 'quantity' || field === 'unit_price') {
        updated[index].total_price = updated[index].quantity * updated[index].unit_price;
      }
      return updated;
    });
  };

  const addItem = () => {
    setItems(prev => [...prev, { item_order: prev.length + 1, description: '', unit: 'وحدة', quantity: 1, unit_price: 0, total_price: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
    const taxRate = formData.tax_rate || 14;
    const taxAmount = subtotal * (taxRate / 100);
    const discount = formData.discount_amount || 0;
    const total = subtotal + taxAmount - discount;
    return { subtotal, taxAmount, total };
  };

  const handleCreate = async (status: 'draft' | 'sent' = 'draft') => {
    if (!organization?.id || items.length === 0) return;
    const { subtotal, taxAmount, total } = calculateTotals();

    await createQuotation.mutateAsync({
      quotation: {
        ...formData,
        organization_id: organization.id,
        entity_type: orgType,
        client_type: clientType,
        subtotal,
        tax_amount: taxAmount,
        total_amount: total,
        currency: 'EGP',
        status,
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        direction: createDirection,
        document_type: selectedTemplate?.documentType || 'price_quote',
      } as any,
      items,
    });

    setShowCreate(false);
    setSelectedTemplate(null);
    setItems([]);
    setFormData({});
  };

  const handleView = async (q: Quotation) => {
    setViewQuotation(q);
    const fetchedItems = await getQuotationItems(q.id!);
    setViewItems(fetchedItems as QuotationItem[]);
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  // Filter quotations by direction
  const outgoingQuotations = quotations.filter((q: any) => !q.direction || q.direction === 'outgoing');
  const incomingQuotations = quotations.filter((q: any) => q.direction === 'incoming');

  const renderQuotationList = (list: Quotation[], direction: QuotationDirection) => {
    if (isLoading) return <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>;
    if (list.length === 0) return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground mb-1">
            {direction === 'outgoing' ? 'لا توجد عروض صادرة بعد' : 'لا توجد عروض واردة بعد'}
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            {direction === 'outgoing' ? 'أنشئ عرض سعر لعملائك لتحصيل مقابل خدماتك' : 'أنشئ طلب عرض سعر لشراء خدمات أو مواد من الموردين'}
          </p>
          <Button variant="outline" onClick={() => handleOpenCreate(direction)}>
            <Plus className="w-4 h-4 ml-1" />
            {direction === 'outgoing' ? 'إنشاء عرض صادر' : 'إنشاء طلب وارد'}
          </Button>
        </CardContent>
      </Card>
    );

    return (
      <div className="grid gap-3">
        {list.map(q => (
          <Card key={q.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleView(q)}>
            <CardContent className="py-3 sm:py-4">
              <div className="flex items-start sm:items-center justify-between gap-2 flex-col sm:flex-row">
                <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-semibold text-foreground text-sm truncate">{q.title}</p>
                      {(q as any).document_type && (q as any).document_type !== 'price_quote' && (
                        <Badge variant="outline" className="text-[9px] sm:text-[10px]">
                          {DOCUMENT_TYPE_LABELS[(q as any).document_type as DocumentType] || (q as any).document_type}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      {q.quotation_number} • {q.client_name || 'عميل مسجل'} • {format(new Date(q.created_at!), 'dd MMM yyyy', { locale: ar })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0 self-end sm:self-center">
                  <span className="font-bold text-foreground text-sm">{q.total_amount?.toLocaleString()} ج.م</span>
                  <Badge variant={STATUS_MAP[q.status]?.variant || 'secondary'} className="text-[10px]">
                    {STATUS_MAP[q.status]?.label || q.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const directionLabel = createDirection === 'outgoing' ? 'عرض صادر (هناخد)' : 'طلب وارد (هندفع)';

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4" dir="rtl">
      <div className="space-y-2">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0 h-8 w-8 rounded-lg"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">عروض الأسعار</h1>
            <p className="text-[11px] sm:text-sm text-muted-foreground truncate">إنشاء وإدارة عروض الأسعار - {ENTITY_LABELS[orgType] || orgType}</p>
          </div>
        </div>
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide">
          <Button onClick={() => handleOpenCreate('outgoing')} className="gap-1 text-xs sm:text-sm h-8 sm:h-9 px-2.5 sm:px-4 shrink-0">
            <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            عرض صادر
          </Button>
          <Button variant="outline" onClick={() => handleOpenCreate('incoming')} className="gap-1 text-xs sm:text-sm h-8 sm:h-9 px-2.5 sm:px-4 shrink-0">
            <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            طلب وارد
          </Button>
        </div>
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
          <TabsList className="w-max sm:w-full justify-start">
            <TabsTrigger value="outgoing" className="gap-1 text-[11px] sm:text-sm px-2 sm:px-3">
              <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              صادر ({outgoingQuotations.length})
            </TabsTrigger>
            <TabsTrigger value="incoming" className="gap-1 text-[11px] sm:text-sm px-2 sm:px-3">
              <ArrowDownLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              وارد ({incomingQuotations.length})
            </TabsTrigger>
            <TabsTrigger value="received" className="gap-1 text-[11px] sm:text-sm px-2 sm:px-3">
              📨 مستلمة ({receivedQuotations.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="outgoing" className="mt-4">
          {renderQuotationList(outgoingQuotations, 'outgoing')}
        </TabsContent>

        <TabsContent value="incoming" className="mt-4">
          {renderQuotationList(incomingQuotations, 'incoming')}
        </TabsContent>

        <TabsContent value="received" className="mt-4">
          {receivedQuotations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">لا توجد عروض مستلمة من جهات أخرى</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {receivedQuotations.map(q => (
                <Card key={q.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleView(q)}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{q.title}</p>
                        <p className="text-xs text-muted-foreground">{q.quotation_number}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{q.total_amount?.toLocaleString()} ج.م</span>
                        <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); updateStatus.mutate({ id: q.id!, status: 'accepted' }); }}>
                          <Check className="w-3 h-3 ml-1" /> قبول
                        </Button>
                        <Button size="sm" variant="destructive" onClick={e => { e.stopPropagation(); updateStatus.mutate({ id: q.id!, status: 'rejected' }); }}>
                          <X className="w-3 h-3 ml-1" /> رفض
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Quotation Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {createDirection === 'outgoing' ? <ArrowUpRight className="w-5 h-5 text-primary" /> : <ArrowDownLeft className="w-5 h-5 text-orange-500" />}
              {directionLabel}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              {createDirection === 'outgoing' 
                ? 'عروض تقدمها للعملاء مقابل خدماتك أو منتجاتك' 
                : 'طلبات عروض أسعار من الموردين لشراء خدمات أو مواد'}
            </p>
          </DialogHeader>

          {!selectedTemplate ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">اختر نوع ومسمى العرض المناسب:</p>
              {templates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>لا توجد قوالب متاحة لهذا النوع من الجهات</p>
                  <p className="text-xs mt-1">نوع الجهة: {ENTITY_LABELS[orgType] || orgType}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {templates.map(t => (
                    <Card key={t.id} className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all" onClick={() => handleSelectTemplate(t)}>
                      <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl mt-0.5">{t.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-foreground text-sm">{t.nameAr}</p>
                            </div>
                            <Badge variant="outline" className="text-[10px] mb-1">
                              {DOCUMENT_TYPE_LABELS[t.documentType]}
                            </Badge>
                            <p className="text-xs text-muted-foreground">{t.descriptionAr}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Document Type Badge */}
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">{DOCUMENT_TYPE_LABELS[selectedTemplate.documentType]}</Badge>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{selectedTemplate.nameEn}</span>
              </div>

              {/* Client/Supplier Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">
                    {createDirection === 'outgoing' ? 'بيانات العميل' : 'بيانات المورّد'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-3">
                    <Button variant={clientType === 'unregistered' ? 'default' : 'outline'} size="sm" onClick={() => setClientType('unregistered')}>
                      {createDirection === 'outgoing' ? 'عميل خارجي' : 'مورّد خارجي'}
                    </Button>
                    <Button variant={clientType === 'registered' ? 'default' : 'outline'} size="sm" onClick={() => setClientType('registered')}>
                      جهة مسجلة بالمنصة
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>{createDirection === 'outgoing' ? 'اسم العميل / الجهة' : 'اسم المورّد / الجهة'}</Label>
                      <Input value={formData.client_name || ''} onChange={e => setFormData(p => ({ ...p, client_name: e.target.value }))} />
                    </div>
                    <div>
                      <Label>رقم الهاتف</Label>
                      <Input value={formData.client_phone || ''} onChange={e => setFormData(p => ({ ...p, client_phone: e.target.value }))} />
                    </div>
                    <div>
                      <Label>البريد الإلكتروني</Label>
                      <Input value={formData.client_email || ''} onChange={e => setFormData(p => ({ ...p, client_email: e.target.value }))} />
                    </div>
                    <div>
                      <Label>العنوان</Label>
                      <Input value={formData.client_address || ''} onChange={e => setFormData(p => ({ ...p, client_address: e.target.value }))} />
                    </div>
                    <div>
                      <Label>الرقم الضريبي</Label>
                      <Input value={formData.client_tax_number || ''} onChange={e => setFormData(p => ({ ...p, client_tax_number: e.target.value }))} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Items */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">بنود العرض</CardTitle>
                    <Button size="sm" variant="outline" onClick={addItem}>
                      <Plus className="w-3 h-3 ml-1" /> إضافة بند
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">#</TableHead>
                        <TableHead className="text-right">الوصف</TableHead>
                        <TableHead className="text-right">الوحدة</TableHead>
                        <TableHead className="text-right">الكمية</TableHead>
                        <TableHead className="text-right">سعر الوحدة</TableHead>
                        <TableHead className="text-right">الإجمالي</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>
                            <Input className="min-w-[200px]" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} />
                          </TableCell>
                          <TableCell>
                            <Input className="w-20" value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)} />
                          </TableCell>
                          <TableCell>
                            <Input type="number" className="w-20" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} />
                          </TableCell>
                          <TableCell>
                            <Input type="number" className="w-24" value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', Number(e.target.value))} />
                          </TableCell>
                          <TableCell className="font-bold">{item.total_price.toLocaleString()}</TableCell>
                          <TableCell>
                            <Button size="icon" variant="ghost" onClick={() => removeItem(idx)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Totals */}
                  <div className="mt-4 border-t pt-4 space-y-2 max-w-xs mr-auto">
                    <div className="flex justify-between text-sm">
                      <span>الإجمالي الفرعي</span>
                      <span>{subtotal.toLocaleString()} ج.م</span>
                    </div>
                    <div className="flex justify-between text-sm items-center gap-2">
                      <span>ضريبة القيمة المضافة</span>
                      <div className="flex items-center gap-1">
                        <Input type="number" className="w-16 h-7 text-xs" value={formData.tax_rate || 14} onChange={e => setFormData(p => ({ ...p, tax_rate: Number(e.target.value) }))} />
                        <span className="text-xs">%</span>
                      </div>
                      <span>{taxAmount.toLocaleString()} ج.م</span>
                    </div>
                    <div className="flex justify-between text-sm items-center gap-2">
                      <span>خصم</span>
                      <Input type="number" className="w-24 h-7 text-xs" value={formData.discount_amount || 0} onChange={e => setFormData(p => ({ ...p, discount_amount: Number(e.target.value) }))} />
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>الإجمالي النهائي</span>
                      <span className="text-primary">{total.toLocaleString()} ج.م</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Terms */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">الشروط والأحكام</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>الشروط العامة</Label>
                    <Textarea rows={3} value={formData.terms_and_conditions || ''} onChange={e => setFormData(p => ({ ...p, terms_and_conditions: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>شروط الدفع</Label>
                      <Textarea rows={2} value={formData.payment_terms || ''} onChange={e => setFormData(p => ({ ...p, payment_terms: e.target.value }))} />
                    </div>
                    <div>
                      <Label>شروط التسليم</Label>
                      <Textarea rows={2} value={formData.delivery_terms || ''} onChange={e => setFormData(p => ({ ...p, delivery_terms: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <Label>ملاحظات إضافية</Label>
                    <Textarea rows={2} value={formData.notes || ''} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} />
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => { setSelectedTemplate(null); setItems([]); }}>رجوع للقوالب</Button>
                <Button variant="secondary" onClick={() => handleCreate('draft')} disabled={createQuotation.isPending}>
                  <Clock className="w-4 h-4 ml-1" /> حفظ كمسودة
                </Button>
                <Button onClick={() => handleCreate('sent')} disabled={createQuotation.isPending}>
                  <Send className="w-4 h-4 ml-1" /> إرسال
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Quotation Dialog */}
      <Dialog open={!!viewQuotation} onOpenChange={() => setViewQuotation(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {viewQuotation?.title}
              <Badge variant={STATUS_MAP[viewQuotation?.status || '']?.variant || 'secondary'}>
                {STATUS_MAP[viewQuotation?.status || '']?.label}
              </Badge>
              {(viewQuotation as any)?.direction === 'incoming' && (
                <Badge variant="outline" className="text-orange-600 border-orange-300">وارد</Badge>
              )}
              {(viewQuotation as any)?.document_type && (viewQuotation as any)?.document_type !== 'price_quote' && (
                <Badge variant="outline" className="text-[10px]">
                  {DOCUMENT_TYPE_LABELS[(viewQuotation as any)?.document_type as DocumentType]}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {viewQuotation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">رقم العرض:</span> <strong>{viewQuotation.quotation_number}</strong></div>
                <div><span className="text-muted-foreground">التاريخ:</span> <strong>{format(new Date(viewQuotation.created_at!), 'dd/MM/yyyy')}</strong></div>
                <div><span className="text-muted-foreground">{(viewQuotation as any)?.direction === 'incoming' ? 'المورّد:' : 'العميل:'}</span> <strong>{viewQuotation.client_name || 'جهة مسجلة'}</strong></div>
                <div><span className="text-muted-foreground">الهاتف:</span> <strong>{viewQuotation.client_phone || '-'}</strong></div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">#</TableHead>
                    <TableHead className="text-right">الوصف</TableHead>
                    <TableHead className="text-right">الوحدة</TableHead>
                    <TableHead className="text-right">الكمية</TableHead>
                    <TableHead className="text-right">سعر الوحدة</TableHead>
                    <TableHead className="text-right">الإجمالي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewItems.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{Number(item.unit_price).toLocaleString()}</TableCell>
                      <TableCell className="font-bold">{Number(item.total_price).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="border-t pt-3 space-y-1 text-sm max-w-xs mr-auto">
                <div className="flex justify-between"><span>الإجمالي الفرعي</span><span>{Number(viewQuotation.subtotal).toLocaleString()} ج.م</span></div>
                <div className="flex justify-between"><span>الضريبة ({viewQuotation.tax_rate}%)</span><span>{Number(viewQuotation.tax_amount).toLocaleString()} ج.م</span></div>
                {Number(viewQuotation.discount_amount) > 0 && (
                  <div className="flex justify-between text-destructive"><span>خصم</span><span>-{Number(viewQuotation.discount_amount).toLocaleString()} ج.م</span></div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>الإجمالي</span><span className="text-primary">{Number(viewQuotation.total_amount).toLocaleString()} ج.م</span>
                </div>
              </div>

              {viewQuotation.terms_and_conditions && (
                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <strong>الشروط:</strong> {viewQuotation.terms_and_conditions}
                </div>
              )}

              <div className="flex gap-2 justify-end border-t pt-3">
                {viewQuotation.status === 'draft' && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => { updateStatus.mutate({ id: viewQuotation.id!, status: 'sent' }); setViewQuotation(null); }}>
                      <Send className="w-3 h-3 ml-1" /> إرسال
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => { deleteQuotation.mutate(viewQuotation.id!); setViewQuotation(null); }}>
                      <Trash2 className="w-3 h-3 ml-1" /> حذف
                    </Button>
                  </>
                )}
                <Button variant="outline" size="sm" onClick={() => handlePrint()}>
                  <Printer className="w-3 h-3 ml-1" /> طباعة
                </Button>
              </div>

              {/* Hidden print view */}
              <div className="hidden">
                <div ref={printRef}>
                  <QuotationPrintView quotation={viewQuotation} items={viewItems} organizationName={(organization as any)?.name_ar || ''} />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Quotations;
