import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Calendar as CalendarIcon, 
  Loader2, 
  CheckCircle2,
  Building2,
  User,
  Phone,
  AlertCircle,
  Send,
  Camera,
  Image as ImageIcon,
  ArrowLeft,
  Recycle,
  Package,
  Lock,
  Info,
  Truck,
  MapPin,
  Factory,
  Scale,
  FileText,
  Wand2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';

const shipmentSchema = z.object({
  weight: z.string().min(1, 'يرجى إدخال الوزن'),
  shipmentDate: z.date(),
  submitterName: z.string().min(1, 'يرجى إدخال اسمك'),
  submitterPhone: z.string().optional(),
  pickupAddress: z.string().optional(),
  deliveryAddress: z.string().optional(),
  vehiclePlate: z.string().optional(),
  notes: z.string().optional(),
});

type ShipmentFormData = z.infer<typeof shipmentSchema>;

interface ShipmentLink {
  id: string;
  organization_id: string;
  token: string;
  title: string | null;
  description: string | null;
  is_active: boolean;
  expires_at: string | null;
  preset_generator_id: string | null;
  preset_generator_external_id: string | null;
  preset_recycler_id: string | null;
  preset_recycler_external_id: string | null;
  preset_waste_type: string | null;
  preset_waste_category: string | null;
  preset_notes: string | null;
  allow_weight_edit: boolean;
  allow_date_edit: boolean;
  allow_generator_edit: boolean;
  allow_recycler_edit: boolean;
  allow_location_edit: boolean;
  require_photo: boolean;
  usage_count: number;
  last_used_at: string | null;
  organization_name?: string;
  organization_logo?: string | null;
  generator_name?: string | null;
  recycler_name?: string | null;
}

const wasteTypes = [
  { value: 'wood', label: 'أخشاب' },
  { value: 'plastic', label: 'بلاستيك' },
  { value: 'paper', label: 'ورق وكرتون' },
  { value: 'metal', label: 'معادن' },
  { value: 'glass', label: 'زجاج' },
  { value: 'organic', label: 'عضوي' },
  { value: 'electronic', label: 'إلكتروني' },
  { value: 'hazardous', label: 'خطر' },
  { value: 'textile', label: 'منسوجات' },
  { value: 'rubber', label: 'مطاط' },
  { value: 'mixed', label: 'مختلط' },
  { value: 'other', label: 'أخرى' },
];

const QuickShipment = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [linkData, setLinkData] = useState<ShipmentLink | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [expired, setExpired] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdShipmentNumber, setCreatedShipmentNumber] = useState<string | null>(null);
  
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ShipmentFormData>({
    resolver: zodResolver(shipmentSchema),
    defaultValues: {
      weight: '',
      shipmentDate: new Date(),
      submitterName: '',
      submitterPhone: '',
      pickupAddress: '',
      deliveryAddress: '',
      vehiclePlate: '',
      notes: '',
    },
  });

  // Load shipment link data
  useEffect(() => {
    const loadLinkData = async () => {
      if (!token) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const { data: linkResult, error: linkError } = await supabase
          .from('organization_shipment_links')
          .select('*')
          .eq('token', token)
          .eq('is_active', true)
          .single();

        if (linkError || !linkResult) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        // Check if expired
        if (linkResult.expires_at && new Date(linkResult.expires_at) < new Date()) {
          setExpired(true);
          setLoading(false);
          return;
        }

        // Get organization data
        const { data: orgData } = await supabase
          .from('organizations')
          .select('name, logo_url')
          .eq('id', linkResult.organization_id)
          .single();

        // Get generator name
        let generatorName = null;
        if (linkResult.preset_generator_id) {
          const { data } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', linkResult.preset_generator_id)
            .single();
          generatorName = data?.name;
        } else if (linkResult.preset_generator_external_id) {
          const { data } = await supabase
            .from('external_partners')
            .select('name')
            .eq('id', linkResult.preset_generator_external_id)
            .single();
          generatorName = data?.name;
        }

        // Get recycler name
        let recyclerName = null;
        if (linkResult.preset_recycler_id) {
          const { data } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', linkResult.preset_recycler_id)
            .single();
          recyclerName = data?.name;
        } else if (linkResult.preset_recycler_external_id) {
          const { data } = await supabase
            .from('external_partners')
            .select('name')
            .eq('id', linkResult.preset_recycler_external_id)
            .single();
          recyclerName = data?.name;
        }

        const fullLinkData: ShipmentLink = {
          ...linkResult,
          organization_name: orgData?.name,
          organization_logo: orgData?.logo_url,
          generator_name: generatorName,
          recycler_name: recyclerName,
        };

        setLinkData(fullLinkData);

        // Set preset notes
        if (linkResult.preset_notes) {
          form.setValue('notes', linkResult.preset_notes);
        }
      } catch (error) {
        console.error('Error loading shipment link:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    loadLinkData();
  }, [token]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const generateShipmentNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `SHP-${year}-${random}`;
  };

  const onSubmit = async (data: ShipmentFormData) => {
    if (!linkData) return;

    // Validate photo requirement
    if (linkData.require_photo && !photoFile) {
      toast.error('يرجى رفع صورة');
      return;
    }

    setSubmitting(true);
    try {
      let photoUrl = null;

      // Upload photo if exists
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `public/${linkData.organization_id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('shipment-photos')
          .upload(fileName, photoFile);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('shipment-photos')
            .getPublicUrl(fileName);
          photoUrl = urlData.publicUrl;
        }
      }

      const shipmentNumber = generateShipmentNumber();

      // Build shipment record
      const shipmentRecord: any = {
        shipment_number: shipmentNumber,
        transporter_id: linkData.organization_id,
        weight: parseFloat(data.weight),
        status: 'pending',
        pickup_date: format(data.shipmentDate, 'yyyy-MM-dd'),
        pickup_address: data.pickupAddress || null,
        delivery_address: data.deliveryAddress || null,
        vehicle_plate: data.vehiclePlate || null,
        notes: data.notes || null,
        waste_type: linkData.preset_waste_type || 'mixed',
        shipment_link_id: linkData.id,
        is_public_submission: true,
        submitter_name: data.submitterName,
        submitter_phone: data.submitterPhone || null,
      };

      // Add generator reference
      if (linkData.preset_generator_id) {
        shipmentRecord.generator_id = linkData.preset_generator_id;
      }

      // Add recycler reference
      if (linkData.preset_recycler_id) {
        shipmentRecord.recycler_id = linkData.preset_recycler_id;
      }

      // Add photo if uploaded
      if (photoUrl) {
        shipmentRecord.photos = [photoUrl];
      }

      const { error } = await supabase
        .from('shipments')
        .insert(shipmentRecord);

      if (error) throw error;

      // Update link usage statistics
      await supabase
        .from('organization_shipment_links')
        .update({ 
          usage_count: (linkData.usage_count || 0) + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', linkData.id);

      setCreatedShipmentNumber(shipmentNumber);
      setSubmitted(true);
      toast.success('🎉 تم تسجيل الشحنة بنجاح!');
    } catch (error) {
      console.error('Error submitting shipment:', error);
      toast.error('حدث خطأ أثناء تسجيل الشحنة');
    } finally {
      setSubmitting(false);
    }
  };

  const getWasteTypeLabel = (value: string | null) => {
    if (!value) return null;
    return wasteTypes.find(w => w.value === value)?.label || value;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/5 via-background to-destructive/5 p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-6">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-xl font-bold mb-2">الرابط غير موجود</h1>
            <p className="text-muted-foreground mb-6">
              عذراً، هذا الرابط غير صالح أو تم حذفه
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="h-4 w-4 ml-2" />
              العودة للصفحة الرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Expired state
  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-500/5 via-background to-amber-500/5 p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-6">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-amber-600" />
            </div>
            <h1 className="text-xl font-bold mb-2">انتهت صلاحية الرابط</h1>
            <p className="text-muted-foreground mb-6">
              عذراً، انتهت صلاحية هذا الرابط. يرجى التواصل مع شركة النقل للحصول على رابط جديد.
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="h-4 w-4 ml-2" />
              العودة للصفحة الرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-500/10 via-background to-primary/10 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full"
        >
          <Card className="text-center border-emerald-200 bg-gradient-to-b from-emerald-50/50 to-background">
            <CardContent className="pt-8 pb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-lg"
              >
                <CheckCircle2 className="h-10 w-10 text-white" />
              </motion.div>
              <h1 className="text-2xl font-bold mb-2 text-emerald-700">تم التسجيل بنجاح!</h1>
              
              {createdShipmentNumber && (
                <div className="bg-muted rounded-lg p-3 mb-4">
                  <p className="text-sm text-muted-foreground mb-1">رقم الشحنة</p>
                  <p className="text-lg font-mono font-bold">{createdShipmentNumber}</p>
                </div>
              )}

              <p className="text-muted-foreground mb-4">
                تم استلام بيانات الشحنة وسيتم مراجعتها من قبل{' '}
                <span className="font-semibold text-foreground">
                  {linkData?.organization_name}
                </span>
              </p>
              
              {/* Show preset info */}
              {(linkData?.generator_name || linkData?.recycler_name || linkData?.preset_waste_type) && (
                <div className="bg-muted/50 rounded-lg p-3 mb-4 text-sm">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {linkData?.generator_name && (
                      <Badge variant="secondary" className="gap-1">
                        <Factory className="h-3 w-3" />
                        {linkData.generator_name}
                      </Badge>
                    )}
                    {linkData?.recycler_name && (
                      <Badge variant="secondary" className="gap-1">
                        <Recycle className="h-3 w-3" />
                        {linkData.recycler_name}
                      </Badge>
                    )}
                    {linkData?.preset_waste_type && (
                      <Badge variant="secondary" className="gap-1">
                        <Package className="h-3 w-3" />
                        {getWasteTypeLabel(linkData.preset_waste_type)}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <Button 
                onClick={() => {
                  setSubmitted(false);
                  setCreatedShipmentNumber(null);
                  form.reset();
                  if (linkData?.preset_notes) {
                    form.setValue('notes', linkData.preset_notes);
                  }
                  setPhotoFile(null);
                  setPhotoPreview(null);
                }} 
                variant="outline"
              >
                تسجيل شحنة أخرى
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 py-6 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-6"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            {linkData?.organization_logo ? (
              <img 
                src={linkData.organization_logo} 
                alt={linkData.organization_name}
                className="h-14 w-14 rounded-xl object-contain border shadow-sm"
              />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Truck className="h-7 w-7 text-primary" />
              </div>
            )}
            <img src={logo} alt="iRecycle" className="h-10 w-10" />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            {linkData?.title || 'تسجيل شحنة سريع'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {linkData?.organization_name}
          </p>
          {linkData?.description && (
            <p className="text-sm text-muted-foreground mt-2 bg-muted/50 rounded-lg p-3">
              {linkData.description}
            </p>
          )}
        </motion.div>

        {/* Preset Info Banner */}
        {(linkData?.generator_name || linkData?.recycler_name || linkData?.preset_waste_type) && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="mb-4"
          >
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Info className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-2">بيانات محددة مسبقاً</p>
                    <div className="flex flex-wrap gap-2">
                      {linkData?.generator_name && (
                        <Badge variant="secondary" className="gap-1">
                          <Factory className="h-3 w-3" />
                          {linkData.generator_name}
                        </Badge>
                      )}
                      {linkData?.recycler_name && (
                        <Badge variant="secondary" className="gap-1">
                          <Recycle className="h-3 w-3" />
                          {linkData.recycler_name}
                        </Badge>
                      )}
                      {linkData?.preset_waste_type && (
                        <Badge variant="secondary" className="gap-1">
                          <Package className="h-3 w-3" />
                          {getWasteTypeLabel(linkData.preset_waste_type)}
                        </Badge>
                      )}
                      {linkData?.preset_waste_category && (
                        <Badge variant="outline" className="text-xs">
                          {linkData.preset_waste_category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Form Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-xl border-2">
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  {/* Photo Upload */}
                  <div className={cn(
                    "p-4 rounded-xl border-2 border-dashed",
                    linkData?.require_photo 
                      ? "border-amber-400 bg-amber-50/50" 
                      : "border-primary/30 bg-primary/5"
                  )}>
                    <div className="flex items-center gap-2 mb-3">
                      <Camera className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-sm">
                        صورة الشحنة {linkData?.require_photo ? '*' : '(اختياري)'}
                      </span>
                      {linkData?.require_photo && (
                        <Badge variant="outline" className="text-xs text-amber-700 border-amber-400 gap-1">
                          <Lock className="h-3 w-3" />
                          مطلوب
                        </Badge>
                      )}
                    </div>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {!photoPreview ? (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => cameraInputRef.current?.click()}
                          className="flex-1 gap-2"
                        >
                          <Camera className="h-4 w-4" />
                          الكاميرا
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 gap-2"
                        >
                          <ImageIcon className="h-4 w-4" />
                          اختيار صورة
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="relative rounded-lg overflow-hidden">
                          <img
                            src={photoPreview}
                            alt="معاينة الصورة"
                            className="w-full h-40 object-cover"
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-2 left-2"
                          >
                            تغيير
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Weight */}
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Scale className="h-4 w-4" />
                          الوزن (طن) *
                          {!linkData?.allow_weight_edit && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Lock className="h-3 w-3" />
                              ثابت
                            </Badge>
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            className="text-lg font-semibold"
                            dir="ltr"
                            disabled={!linkData?.allow_weight_edit}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Date */}
                  <FormField
                    control={form.control}
                    name="shipmentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          تاريخ الشحنة *
                          {!linkData?.allow_date_edit && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Lock className="h-3 w-3" />
                              ثابت
                            </Badge>
                          )}
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                disabled={!linkData?.allow_date_edit}
                                className={cn(
                                  "w-full justify-start text-right font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: ar })
                                ) : (
                                  "اختر التاريخ"
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Pickup Address */}
                  {linkData?.allow_location_edit && (
                    <FormField
                      control={form.control}
                      name="pickupAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            عنوان الاستلام
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="عنوان نقطة الاستلام" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Delivery Address */}
                  {linkData?.allow_location_edit && (
                    <FormField
                      control={form.control}
                      name="deliveryAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            عنوان التسليم
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="عنوان نقطة التسليم" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Vehicle Plate */}
                  <FormField
                    control={form.control}
                    name="vehiclePlate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          رقم لوحة المركبة
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="مثال: أ ب ج 1234" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-muted-foreground mb-3">بيانات المسجل</p>
                    
                    {/* Submitter Name */}
                    <FormField
                      control={form.control}
                      name="submitterName"
                      render={({ field }) => (
                        <FormItem className="mb-3">
                          <FormLabel className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            الاسم *
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="اسمك الكامل" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Submitter Phone */}
                    <FormField
                      control={form.control}
                      name="submitterPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            رقم الهاتف
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="01xxxxxxxxx" {...field} dir="ltr" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          ملاحظات إضافية
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="أي ملاحظات تريد إضافتها..."
                            {...field}
                            rows={2}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-12 text-lg gap-2"
                    size="lg"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        جاري التسجيل...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        تسجيل الشحنة
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-6"
        >
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Recycle className="h-4 w-4 text-primary" />
            <span>مدعوم بواسطة iRecycle</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default QuickShipment;
