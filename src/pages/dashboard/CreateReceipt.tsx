import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileCheck,
  Package,
  Scale,
  MapPin,
  Loader2,
  CheckCircle2,
  FileText,
  Truck,
  Building2,
  Calendar,
  ClipboardList,
  Stamp,
  FileSignature,
  Sparkles,
} from 'lucide-react';

interface Shipment {
  id: string;
  shipment_number: string;
  waste_type: string;
  quantity: number;
  unit: string;
  pickup_address: string;
  delivery_address: string;
  generator_id: string;
  generator: { name: string } | null;
  driver_id: string | null;
  status: string;
  created_at: string;
}

interface ReceiptTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  fields: string[];
}

const receiptTemplates: ReceiptTemplate[] = [
  {
    id: 'standard',
    name: 'شهادة استلام قياسية',
    description: 'نموذج استلام أساسي مع البيانات الرئيسية',
    icon: <FileCheck className="w-6 h-6" />,
    color: 'from-blue-500 to-blue-600',
    fields: ['shipment', 'weights', 'location', 'notes'],
  },
  {
    id: 'detailed',
    name: 'شهادة استلام تفصيلية',
    description: 'يتضمن جميع التفاصيل مع توقيعات وأختام',
    icon: <ClipboardList className="w-6 h-6" />,
    color: 'from-green-500 to-emerald-600',
    fields: ['shipment', 'weights', 'location', 'inspection', 'signatures', 'notes'],
  },
  {
    id: 'express',
    name: 'استلام سريع',
    description: 'نموذج مختصر للاستلام السريع في الميدان',
    icon: <Truck className="w-6 h-6" />,
    color: 'from-orange-500 to-amber-600',
    fields: ['shipment', 'weights', 'notes'],
  },
  {
    id: 'official',
    name: 'شهادة رسمية معتمدة',
    description: 'نموذج رسمي مع رقم تسلسلي وباركود',
    icon: <Stamp className="w-6 h-6" />,
    color: 'from-purple-500 to-violet-600',
    fields: ['shipment', 'weights', 'location', 'inspection', 'signatures', 'barcode', 'notes'],
  },
];

const CreateReceipt = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile, organization } = useAuth();
  
  const [step, setStep] = useState<'template' | 'shipment' | 'form'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<ReceiptTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loadingShipments, setLoadingShipments] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  
  const [formData, setFormData] = useState({
    wasteType: '',
    declaredWeight: '',
    actualWeight: '',
    unit: 'kg',
    pickupLocation: '',
    deliveryLocation: '',
    notes: '',
    inspectionNotes: '',
    inspectionStatus: 'good',
    receiverName: '',
    receiverSignature: false,
    driverSignature: false,
  });

  // Check for pre-selected shipment from URL
  useEffect(() => {
    const shipmentId = searchParams.get('shipment');
    if (shipmentId && organization?.id) {
      loadShipmentById(shipmentId);
    }
  }, [searchParams, organization?.id]);

  useEffect(() => {
    if (step === 'shipment' && organization?.id) {
      loadShipments();
    }
  }, [step, organization?.id]);

  const loadShipmentById = async (shipmentId: string) => {
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          id,
          shipment_number,
          waste_type,
          quantity,
          unit,
          pickup_address,
          delivery_address,
          generator_id,
          driver_id,
          status,
          created_at,
          generator:organizations!shipments_generator_id_fkey(name)
        `)
        .eq('id', shipmentId)
        .single();

      if (error) throw error;
      if (data) {
        setSelectedShipment(data as unknown as Shipment);
        prefillForm(data as unknown as Shipment);
        setStep('form');
        // Auto-select standard template if not selected
        if (!selectedTemplate) {
          setSelectedTemplate(receiptTemplates[0]);
        }
      }
    } catch (error) {
      console.error('Error loading shipment:', error);
      toast.error('فشل في تحميل بيانات الشحنة');
    }
  };

  const loadShipments = async () => {
    setLoadingShipments(true);
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          id,
          shipment_number,
          waste_type,
          quantity,
          unit,
          pickup_address,
          delivery_address,
          generator_id,
          driver_id,
          status,
          created_at,
          generator:organizations!shipments_generator_id_fkey(name)
        `)
        .eq('transporter_id', organization?.id)
        .in('status', ['new', 'approved', 'in_transit', 'delivered', 'confirmed'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShipments(data as unknown as Shipment[]);
    } catch (error) {
      console.error('Error loading shipments:', error);
      toast.error('فشل في تحميل الشحنات');
    } finally {
      setLoadingShipments(false);
    }
  };

  const prefillForm = (shipment: Shipment) => {
    setFormData({
      wasteType: shipment.waste_type || '',
      declaredWeight: shipment.quantity?.toString() || '',
      actualWeight: shipment.quantity?.toString() || '',
      unit: shipment.unit || 'kg',
      pickupLocation: shipment.pickup_address || '',
      deliveryLocation: shipment.delivery_address || '',
      notes: '',
      inspectionNotes: '',
      inspectionStatus: 'good',
      receiverName: '',
      receiverSignature: false,
      driverSignature: false,
    });
  };

  const handleSelectTemplate = (template: ReceiptTemplate) => {
    setSelectedTemplate(template);
    setStep('shipment');
  };

  const handleSelectShipment = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    prefillForm(shipment);
    setStep('form');
  };

  const handleSubmit = async () => {
    if (!selectedShipment || !organization?.id) {
      toast.error('بيانات غير مكتملة');
      return;
    }

    setLoading(true);
    try {
      // Build insert data - receipt_number and created_by will be auto-set by triggers
      const insertData = {
        shipment_id: selectedShipment.id,
        transporter_id: organization.id,
        generator_id: selectedShipment.generator_id || null,
        driver_id: selectedShipment.driver_id || null,
        waste_type: formData.wasteType || null,
        declared_weight: parseFloat(formData.declaredWeight) || null,
        actual_weight: parseFloat(formData.actualWeight) || null,
        unit: formData.unit,
        pickup_location: formData.pickupLocation || null,
        notes: formData.notes || null,
        receipt_number: '', // Will be auto-generated by trigger
      };

      const { data, error } = await supabase
        .from('shipment_receipts')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      toast.success('تم إنشاء شهادة الاستلام بنجاح');
      navigate('/dashboard/transporter-receipts');
    } catch (error: any) {
      console.error('Error creating receipt:', error);
      toast.error(error.message || 'فشل في إنشاء الشهادة');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      new: { label: 'جديدة', className: 'bg-blue-100 text-blue-700' },
      approved: { label: 'معتمدة', className: 'bg-green-100 text-green-700' },
      in_transit: { label: 'قيد النقل', className: 'bg-orange-100 text-orange-700' },
      delivered: { label: 'تم التسليم', className: 'bg-purple-100 text-purple-700' },
      confirmed: { label: 'مؤكدة', className: 'bg-emerald-100 text-emerald-700' },
    };
    return config[status] || { label: status, className: 'bg-muted text-foreground' };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <BackButton />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileCheck className="h-6 w-6 text-primary" />
              إنشاء شهادة استلام جديدة
            </h1>
            <p className="text-muted-foreground">
              اختر قالب الشهادة والشحنة لإنشاء شهادة استلام رسمية
            </p>
          </div>
          
          {/* Progress Steps */}
          <div className="hidden sm:flex items-center gap-2">
            {['template', 'shipment', 'form'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step === s 
                    ? 'bg-primary text-primary-foreground' 
                    : (step === 'form' && s !== 'form') || (step === 'shipment' && s === 'template')
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                }`}>
                  {i + 1}
                </div>
                {i < 2 && (
                  <div className={`w-12 h-1 rounded ${
                    (step === 'shipment' && i === 0) || (step === 'form' && i <= 1)
                      ? 'bg-primary'
                      : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Template Selection */}
        {step === 'template' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  اختر قالب الشهادة
                </CardTitle>
                <CardDescription>
                  اختر النموذج المناسب لنوع الاستلام الذي تقوم به
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {receiptTemplates.map((template, index) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card 
                        className={`cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-2 ${
                          selectedTemplate?.id === template.id 
                            ? 'border-primary ring-2 ring-primary/20' 
                            : 'border-transparent hover:border-primary/30'
                        }`}
                        onClick={() => handleSelectTemplate(template)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center text-white`}>
                              {template.icon}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{template.name}</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {template.description}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-3">
                                {template.fields.map(field => (
                                  <Badge key={field} variant="secondary" className="text-xs">
                                    {field === 'shipment' ? 'الشحنة' :
                                     field === 'weights' ? 'الأوزان' :
                                     field === 'location' ? 'الموقع' :
                                     field === 'inspection' ? 'الفحص' :
                                     field === 'signatures' ? 'التوقيعات' :
                                     field === 'barcode' ? 'الباركود' :
                                     field === 'notes' ? 'ملاحظات' : field}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Shipment Selection */}
        {step === 'shipment' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-primary" />
                      اختر الشحنة
                    </CardTitle>
                    <CardDescription>
                      اختر الشحنة التي تريد إنشاء شهادة استلام لها
                    </CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => setStep('template')}>
                    تغيير القالب
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingShipments ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : shipments.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">لا توجد شحنات</h3>
                    <p className="text-muted-foreground">
                      لا توجد شحنات متاحة لإنشاء شهادة استلام
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {shipments.map((shipment, index) => {
                      const statusConfig = getStatusBadge(shipment.status);
                      return (
                        <motion.div
                          key={shipment.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card 
                            className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
                            onClick={() => handleSelectShipment(shipment)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Package className="w-6 h-6 text-primary" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-bold">{shipment.shipment_number}</span>
                                      <Badge className={statusConfig.className}>
                                        {statusConfig.label}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                      <span className="flex items-center gap-1">
                                        <Building2 className="w-3 h-3" />
                                        {shipment.generator?.name || 'غير محدد'}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Scale className="w-3 h-3" />
                                        {shipment.quantity} {shipment.unit}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <Button variant="ghost" size="icon">
                                  <CheckCircle2 className="w-5 h-5" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Form */}
        {step === 'form' && selectedShipment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Selected Template & Shipment Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {selectedTemplate && (
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedTemplate.color} flex items-center justify-center text-white`}>
                        {selectedTemplate.icon}
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">القالب المختار</p>
                      <p className="font-semibold">{selectedTemplate?.name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">الشحنة</p>
                      <p className="font-semibold font-mono">{selectedShipment.shipment_number}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Form */}
            <Card>
              <CardHeader>
                <CardTitle>تفاصيل الشهادة</CardTitle>
                <CardDescription>
                  تم ملء البيانات تلقائياً من الشحنة - يمكنك تعديلها حسب الحاجة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Waste Type */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    نوع المخلفات
                    <Badge variant="outline" className="text-xs">تلقائي</Badge>
                  </Label>
                  <Input
                    value={formData.wasteType}
                    readOnly
                    className="bg-muted/50"
                  />
                </div>

                {/* Weights */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Scale className="w-4 h-4" />
                      الوزن المصرح به
                    </Label>
                    <Input
                      type="number"
                      value={formData.declaredWeight}
                      onChange={(e) => setFormData(prev => ({ ...prev, declaredWeight: e.target.value }))}
                      className="border-green-200 bg-green-50/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الوزن الفعلي</Label>
                    <Input
                      type="number"
                      value={formData.actualWeight}
                      onChange={(e) => setFormData(prev => ({ ...prev, actualWeight: e.target.value }))}
                      className="border-blue-200 bg-blue-50/50"
                    />
                  </div>
                </div>

                {/* Unit */}
                <div className="space-y-2">
                  <Label>الوحدة</Label>
                  <Select value={formData.unit} onValueChange={(v) => setFormData(prev => ({ ...prev, unit: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">كيلوجرام</SelectItem>
                      <SelectItem value="ton">طن</SelectItem>
                      <SelectItem value="m3">متر مكعب</SelectItem>
                      <SelectItem value="unit">وحدة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Locations */}
                {selectedTemplate?.fields.includes('location') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-green-600" />
                        موقع الاستلام
                      </Label>
                      <Input
                        value={formData.pickupLocation}
                        onChange={(e) => setFormData(prev => ({ ...prev, pickupLocation: e.target.value }))}
                        className="border-green-200 bg-green-50/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        موقع التسليم
                      </Label>
                      <Input
                        value={formData.deliveryLocation}
                        onChange={(e) => setFormData(prev => ({ ...prev, deliveryLocation: e.target.value }))}
                        className="border-blue-200 bg-blue-50/50"
                      />
                    </div>
                  </div>
                )}

                {/* Inspection (for detailed templates) */}
                {selectedTemplate?.fields.includes('inspection') && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <Label className="flex items-center gap-2 text-lg">
                        <ClipboardList className="w-5 h-5 text-primary" />
                        معلومات الفحص
                      </Label>
                      <div className="space-y-2">
                        <Label>حالة الفحص</Label>
                        <Select 
                          value={formData.inspectionStatus} 
                          onValueChange={(v) => setFormData(prev => ({ ...prev, inspectionStatus: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="good">سليم - مطابق للمواصفات</SelectItem>
                            <SelectItem value="minor_issues">مشاكل بسيطة</SelectItem>
                            <SelectItem value="major_issues">مشاكل جوهرية</SelectItem>
                            <SelectItem value="rejected">مرفوض</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>ملاحظات الفحص</Label>
                        <Textarea
                          value={formData.inspectionNotes}
                          onChange={(e) => setFormData(prev => ({ ...prev, inspectionNotes: e.target.value }))}
                          placeholder="أدخل ملاحظات الفحص..."
                          rows={2}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <Label>ملاحظات إضافية</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="أي ملاحظات إضافية..."
                    rows={3}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        جاري الإنشاء...
                      </>
                    ) : (
                      <>
                        <FileCheck className="w-4 h-4 ml-2" />
                        إنشاء الشهادة
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setStep('shipment')}>
                    تغيير الشحنة
                  </Button>
                  <Button variant="ghost" onClick={() => navigate('/dashboard/transporter-receipts')}>
                    إلغاء
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CreateReceipt;
