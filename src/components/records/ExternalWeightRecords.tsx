import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Plus, CalendarIcon, Link2, Link2Off, Trash2, Edit, Scale, Building2, Filter, Check, ChevronsUpDown, Factory, Truck, Printer, Download, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { wasteTypeLabels } from "@/lib/wasteClassification";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import ExternalRecordsPrint from "./ExternalRecordsPrint";

interface ExternalRecord {
  id: string;
  company_name: string;
  company_id: string | null;
  generator_company_id: string | null;
  generator_company_name: string | null;
  partner_company_id: string | null;
  partner_company_name: string | null;
  partner_type: string | null;
  quantity: number;
  unit: string;
  waste_type: string;
  waste_description: string | null;
  record_date: string;
  is_linked_to_system: boolean;
  linked_at: string | null;
  notes: string | null;
  created_at: string;
}

interface Organization {
  id: string;
  name: string;
  organization_type: string;
}

interface Props {
  organizationType: 'recycler' | 'transporter';
}

const units = ['كجم', 'طن', 'متر مكعب', 'وحدة'];

export default function ExternalWeightRecords({ organizationType }: Props) {
  const { profile, organization } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ExternalRecord | null>(null);
  const [filterLinked, setFilterLinked] = useState<'all' | 'linked' | 'unlinked'>('all');
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [partnerOpen, setPartnerOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    company_name: '',
    generator_company_id: '',
    generator_company_name: '',
    partner_company_id: '',
    partner_company_name: '',
    quantity: '',
    unit: 'كجم',
    waste_type: '',
    waste_description: '',
    record_date: new Date(),
    notes: ''
  });

  // Fetch organizations for dropdowns
  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations-for-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, organization_type')
        .eq('is_verified', true)
        .order('name');
      
      if (error) throw error;
      return data as Organization[];
    }
  });

  const generators = organizations.filter(o => o.organization_type === 'generator');
  const transporters = organizations.filter(o => o.organization_type === 'transporter');
  const recyclers = organizations.filter(o => o.organization_type === 'recycler');

  // Partner list depends on organization type
  const partnerList = organizationType === 'recycler' ? transporters : recyclers;
  const partnerLabel = organizationType === 'recycler' ? 'الجهة الناقلة' : 'جهة التدوير';
  const partnerIcon = organizationType === 'recycler' ? Truck : Factory;

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['external-weight-records', profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('external_weight_records')
        .select('*')
        .eq('organization_id', profile?.organization_id)
        .order('record_date', { ascending: false });
      
      if (error) throw error;
      return data as ExternalRecord[];
    },
    enabled: !!profile?.organization_id
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('external_weight_records')
        .insert({
          organization_id: profile?.organization_id,
          company_name: data.generator_company_name || data.company_name,
          generator_company_id: data.generator_company_id || null,
          generator_company_name: data.generator_company_name || null,
          partner_company_id: data.partner_company_id || null,
          partner_company_name: data.partner_company_name || null,
          partner_type: organizationType === 'recycler' ? 'transporter' : 'recycler',
          quantity: parseFloat(data.quantity),
          unit: data.unit,
          waste_type: data.waste_type,
          waste_description: data.waste_description || null,
          record_date: format(data.record_date, 'yyyy-MM-dd'),
          notes: data.notes || null,
          created_by: profile?.id
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-weight-records'] });
      toast.success('تم إضافة السجل بنجاح');
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => toast.error('حدث خطأ أثناء إضافة السجل')
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('external_weight_records')
        .update({
          company_name: data.generator_company_name || data.company_name,
          generator_company_id: data.generator_company_id || null,
          generator_company_name: data.generator_company_name || null,
          partner_company_id: data.partner_company_id || null,
          partner_company_name: data.partner_company_name || null,
          quantity: parseFloat(data.quantity),
          unit: data.unit,
          waste_type: data.waste_type,
          waste_description: data.waste_description || null,
          record_date: format(data.record_date, 'yyyy-MM-dd'),
          notes: data.notes || null
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-weight-records'] });
      toast.success('تم تحديث السجل بنجاح');
      resetForm();
      setIsDialogOpen(false);
      setEditingRecord(null);
    },
    onError: () => toast.error('حدث خطأ أثناء تحديث السجل')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('external_weight_records')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-weight-records'] });
      toast.success('تم حذف السجل');
    },
    onError: () => toast.error('حدث خطأ أثناء حذف السجل')
  });

  const toggleLinkMutation = useMutation({
    mutationFn: async ({ id, link }: { id: string; link: boolean }) => {
      const { error } = await supabase
        .from('external_weight_records')
        .update({
          is_linked_to_system: link,
          linked_at: link ? new Date().toISOString() : null,
          linked_by: link ? profile?.id : null
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { link }) => {
      queryClient.invalidateQueries({ queryKey: ['external-weight-records'] });
      toast.success(link ? 'تم ربط السجل بالنظام' : 'تم إلغاء ربط السجل');
    },
    onError: () => toast.error('حدث خطأ')
  });

  const resetForm = () => {
    setFormData({
      company_name: '',
      generator_company_id: '',
      generator_company_name: '',
      partner_company_id: '',
      partner_company_name: '',
      quantity: '',
      unit: 'كجم',
      waste_type: '',
      waste_description: '',
      record_date: new Date(),
      notes: ''
    });
  };

  const handleEdit = (record: ExternalRecord) => {
    setEditingRecord(record);
    setFormData({
      company_name: record.company_name,
      generator_company_id: record.generator_company_id || '',
      generator_company_name: record.generator_company_name || '',
      partner_company_id: record.partner_company_id || '',
      partner_company_name: record.partner_company_name || '',
      quantity: record.quantity.toString(),
      unit: record.unit,
      waste_type: record.waste_type,
      waste_description: record.waste_description || '',
      record_date: new Date(record.record_date),
      notes: record.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRecord) {
      updateMutation.mutate({ id: editingRecord.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredRecords = records.filter(r => {
    if (filterLinked === 'linked') return r.is_linked_to_system;
    if (filterLinked === 'unlinked') return !r.is_linked_to_system;
    return true;
  });

  const stats = {
    total: records.length,
    linked: records.filter(r => r.is_linked_to_system).length,
    unlinked: records.filter(r => !r.is_linked_to_system).length,
    totalQuantity: records.reduce((sum, r) => sum + (r.unit === 'طن' ? r.quantity * 1000 : r.quantity), 0),
    linkedQuantity: records.filter(r => r.is_linked_to_system).reduce((sum, r) => sum + (r.unit === 'طن' ? r.quantity * 1000 : r.quantity), 0)
  };

  const roleLabel = organizationType === 'recycler' ? 'المستلمة' : 'المنقولة';

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !printRef.current) return;
    
    const content = printRef.current.innerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <title>سجل الكميات الخارجية</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Tahoma, sans-serif; }
            body { padding: 20px; direction: rtl; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: right; font-size: 11px; }
            th { background-color: #f5f5f5; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .text-lg { font-size: 16px; }
            .text-xl { font-size: 18px; }
            .text-xs { font-size: 10px; }
            .border { border: 1px solid #ddd; }
            .rounded { border-radius: 4px; }
            .p-2 { padding: 8px; }
            .p-3 { padding: 12px; }
            .mb-1 { margin-bottom: 4px; }
            .mb-3 { margin-bottom: 12px; }
            .mb-4 { margin-bottom: 16px; }
            .mt-4 { margin-top: 16px; }
            .mt-6 { margin-top: 24px; }
            .pt-4 { padding-top: 16px; }
            .pb-4 { padding-bottom: 16px; }
            .px-1\\.5 { padding-left: 6px; padding-right: 6px; }
            .py-0\\.5 { padding-top: 2px; padding-bottom: 2px; }
            .grid { display: grid; }
            .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
            .gap-2 { gap: 8px; }
            .flex { display: flex; }
            .items-center { align-items: center; }
            .justify-between { justify-content: space-between; }
            .border-b-2 { border-bottom: 2px solid #333; }
            .border-t { border-top: 1px solid #ddd; }
            .bg-green-50 { background-color: #f0fdf4; }
            .bg-green-100 { background-color: #dcfce7; }
            .bg-orange-50 { background-color: #fff7ed; }
            .bg-orange-100 { background-color: #ffedd5; }
            .bg-blue-50 { background-color: #eff6ff; }
            .bg-gray-50 { background-color: #f9fafb; }
            .bg-gray-100 { background-color: #f3f4f6; }
            .text-green-700 { color: #15803d; }
            .text-green-800 { color: #166534; }
            .text-orange-600 { color: #ea580c; }
            .text-orange-800 { color: #9a3412; }
            .text-blue-700 { color: #1d4ed8; }
            .text-blue-800 { color: #1e40af; }
            .text-gray-500 { color: #6b7280; }
            .text-gray-600 { color: #4b5563; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    
    setIsExporting(true);
    toast.loading('جاري إنشاء ملف PDF...');
    
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      const fileName = `سجل_الكميات_الخارجية_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(fileName);
      
      toast.dismiss();
      toast.success('تم تحميل الملف بنجاح');
    } catch (error) {
      toast.dismiss();
      toast.error('حدث خطأ أثناء إنشاء PDF');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenPDF = async () => {
    if (!printRef.current) return;
    
    setIsExporting(true);
    toast.loading('جاري إنشاء المعاينة...');
    
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      toast.dismiss();
      toast.success('تم فتح المعاينة');
    } catch (error) {
      toast.dismiss();
      toast.error('حدث خطأ');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">إجمالي الكميات</p>
                <p className="text-lg font-bold">{(stats.totalQuantity / 1000).toFixed(2)} طن</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">مرتبطة بالنظام</p>
                <p className="text-lg font-bold">{stats.linked} سجل</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Link2Off className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-xs text-muted-foreground">غير مرتبطة</p>
                <p className="text-lg font-bold">{stats.unlinked} سجل</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">الكمية المرتبطة</p>
                <p className="text-lg font-bold">{(stats.linkedQuantity / 1000).toFixed(2)} طن</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            سجل الكميات {roleLabel} الخارجية
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isExporting || filteredRecords.length === 0}>
                  <FileText className="h-4 w-4 ml-2" />
                  تصدير
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background z-50">
                <DropdownMenuItem onClick={handlePrint}>
                  <Printer className="h-4 w-4 ml-2" />
                  طباعة
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleOpenPDF}>
                  <FileText className="h-4 w-4 ml-2" />
                  معاينة PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadPDF}>
                  <Download className="h-4 w-4 ml-2" />
                  تحميل PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Select value={filterLinked} onValueChange={(v: any) => setFilterLinked(v)}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="linked">مرتبطة</SelectItem>
                <SelectItem value="unlinked">غير مرتبطة</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingRecord(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة سجل
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingRecord ? 'تعديل السجل' : 'إضافة سجل جديد'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Generator Company */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Factory className="h-4 w-4" />
                      الجهة المولدة
                    </Label>
                    <Popover open={generatorOpen} onOpenChange={setGeneratorOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={generatorOpen}
                          className="w-full justify-between"
                        >
                          {formData.generator_company_name || "اختر أو أدخل اسم الجهة المولدة"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 z-50" align="start">
                        <Command>
                          <CommandInput 
                            placeholder="ابحث أو أدخل اسم جديد..." 
                            onValueChange={(val) => {
                              if (!generators.find(g => g.name === val)) {
                                setFormData({ ...formData, generator_company_id: '', generator_company_name: val });
                              }
                            }}
                          />
                          <CommandList>
                            <CommandEmpty>
                              <Button
                                variant="ghost"
                                className="w-full justify-start"
                                onClick={() => {
                                  setGeneratorOpen(false);
                                }}
                              >
                                استخدم الاسم المكتوب
                              </Button>
                            </CommandEmpty>
                            <CommandGroup heading="الجهات المولدة المسجلة">
                              {generators.map((org) => (
                                <CommandItem
                                  key={org.id}
                                  value={org.name}
                                  onSelect={() => {
                                    setFormData({ 
                                      ...formData, 
                                      generator_company_id: org.id, 
                                      generator_company_name: org.name 
                                    });
                                    setGeneratorOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.generator_company_id === org.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {org.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {!formData.generator_company_id && (
                      <Input
                        value={formData.generator_company_name}
                        onChange={(e) => setFormData({ ...formData, generator_company_name: e.target.value, generator_company_id: '' })}
                        placeholder="أو أدخل اسم الجهة يدوياً"
                        className="mt-2"
                      />
                    )}
                  </div>

                  {/* Partner Company (Transporter for Recycler, Recycler for Transporter) */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      {organizationType === 'recycler' ? <Truck className="h-4 w-4" /> : <Factory className="h-4 w-4" />}
                      {partnerLabel}
                    </Label>
                    <Popover open={partnerOpen} onOpenChange={setPartnerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={partnerOpen}
                          className="w-full justify-between"
                        >
                          {formData.partner_company_name || `اختر أو أدخل اسم ${partnerLabel}`}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 z-50" align="start">
                        <Command>
                          <CommandInput 
                            placeholder="ابحث أو أدخل اسم جديد..." 
                            onValueChange={(val) => {
                              if (!partnerList.find(p => p.name === val)) {
                                setFormData({ ...formData, partner_company_id: '', partner_company_name: val });
                              }
                            }}
                          />
                          <CommandList>
                            <CommandEmpty>
                              <Button
                                variant="ghost"
                                className="w-full justify-start"
                                onClick={() => {
                                  setPartnerOpen(false);
                                }}
                              >
                                استخدم الاسم المكتوب
                              </Button>
                            </CommandEmpty>
                            <CommandGroup heading={`${partnerLabel} المسجلة`}>
                              {partnerList.map((org) => (
                                <CommandItem
                                  key={org.id}
                                  value={org.name}
                                  onSelect={() => {
                                    setFormData({ 
                                      ...formData, 
                                      partner_company_id: org.id, 
                                      partner_company_name: org.name 
                                    });
                                    setPartnerOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.partner_company_id === org.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {org.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {!formData.partner_company_id && (
                      <Input
                        value={formData.partner_company_name}
                        onChange={(e) => setFormData({ ...formData, partner_company_name: e.target.value, partner_company_id: '' })}
                        placeholder={`أو أدخل اسم ${partnerLabel} يدوياً`}
                        className="mt-2"
                      />
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>الكمية</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الوحدة</Label>
                      <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map(u => (
                            <SelectItem key={u} value={u}>{u}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>نوع المخلف</Label>
                    <Select value={formData.waste_type} onValueChange={(v) => setFormData({ ...formData, waste_type: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع المخلف" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(wasteTypeLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>وصف المخلف (اختياري)</Label>
                    <Input
                      value={formData.waste_description}
                      onChange={(e) => setFormData({ ...formData, waste_description: e.target.value })}
                      placeholder="وصف إضافي للمخلف"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>تاريخ التسجيل</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-right">
                          <CalendarIcon className="ml-2 h-4 w-4" />
                          {format(formData.record_date, 'PPP', { locale: ar })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.record_date}
                          onSelect={(date) => date && setFormData({ ...formData, record_date: date })}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>ملاحظات (اختياري)</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="أي ملاحظات إضافية..."
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1" disabled={createMutation.isPending || updateMutation.isPending}>
                      {editingRecord ? 'تحديث' : 'إضافة'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      إلغاء
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد سجلات {filterLinked !== 'all' ? (filterLinked === 'linked' ? 'مرتبطة' : 'غير مرتبطة') : ''}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الجهة المولدة</TableHead>
                    <TableHead>{partnerLabel}</TableHead>
                    <TableHead>نوع المخلف</TableHead>
                    <TableHead>الكمية</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>ربط بالنظام</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Factory className="h-4 w-4 text-muted-foreground" />
                          <span>{record.generator_company_name || record.company_name}</span>
                          {record.generator_company_id && (
                            <Badge variant="secondary" className="text-xs">مسجل</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {organizationType === 'recycler' ? (
                            <Truck className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Factory className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span>{record.partner_company_name || '-'}</span>
                          {record.partner_company_id && (
                            <Badge variant="secondary" className="text-xs">مسجل</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {wasteTypeLabels[record.waste_type as keyof typeof wasteTypeLabels] || record.waste_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.quantity} {record.unit}</TableCell>
                      <TableCell>{format(new Date(record.record_date), 'yyyy/MM/dd')}</TableCell>
                      <TableCell>
                        {record.is_linked_to_system ? (
                          <Badge className="bg-green-100 text-green-800">
                            <Link2 className="h-3 w-3 ml-1" />
                            مرتبط
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Link2Off className="h-3 w-3 ml-1" />
                            غير مرتبط
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={record.is_linked_to_system}
                          onCheckedChange={(checked) => toggleLinkMutation.mutate({ id: record.id, link: checked })}
                          disabled={toggleLinkMutation.isPending}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(record)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => {
                              if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
                                deleteMutation.mutate(record.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <div className="shrink-0">
              <Link2 className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-sm">
              <p className="font-medium text-blue-800 dark:text-blue-200">ما معنى الربط بالنظام؟</p>
              <p className="text-blue-700 dark:text-blue-300 mt-1">
                السجلات <strong>غير المرتبطة</strong> تبقى منفصلة ولا تؤثر على إحصائيات وتقارير النظام الأساسية.
                عند تفعيل <strong>الربط بالنظام</strong>، ستُحتسب هذه الكميات ضمن التحليلات والتقارير الرسمية.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hidden Print Component */}
      <div className="hidden">
        <ExternalRecordsPrint
          ref={printRef}
          records={filteredRecords}
          organizationType={organizationType}
          organizationName={organization?.name || ''}
          filterType={filterLinked}
        />
      </div>
    </div>
  );
}
