import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Loader2, Scale, Check, ArrowLeft, Sparkles, Building, Truck, User, FileText, MapPin, Clock, Package, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface WeightData {
  gross_weight: string;
  tare_weight: string;
  net_weight: string;
  unit: string;
  date: string;
  time: string;
  company_name: string;
  vehicle_number: string;
  ticket_number?: string;
  operation_type?: string;
  material_type?: string;
  customer_name?: string;
  driver_name?: string;
  trailer_number?: string;
  governorate?: string;
  first_weight?: string;
  second_weight?: string;
  first_date?: string;
  first_time?: string;
  second_date?: string;
  second_time?: string;
  weigher_name?: string;
  notes?: string;
  additional_data?: Record<string, string>;
}

interface SmartWeightUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SmartWeightUpload = ({ open, onOpenChange }: SmartWeightUploadProps) => {
  const [image, setImage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<WeightData | null>(null);
  const { isLoading, extractWeightData } = useAIAssistant();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setImage(base64);
      
      toast.loading('جاري تحليل صورة الوزنة بالذكاء الاصطناعي...', { id: 'extracting' });
      const data = await extractWeightData(base64);
      toast.dismiss('extracting');
      
      if (data) {
        setExtractedData(data);
        toast.success('تم استخراج البيانات بنجاح!');
      } else {
        toast.error('فشل في استخراج البيانات، يرجى المحاولة مرة أخرى');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProceedToShipment = () => {
    if (!extractedData) return;
    
    const params = new URLSearchParams();
    
    // Weight data
    const netWeight = extractedData.net_weight || extractedData.first_weight || extractedData.gross_weight;
    if (netWeight) params.set('net_weight', netWeight.replace(/[^\d.]/g, ''));
    if (extractedData.unit) params.set('unit', extractedData.unit === 'ton' ? 'طن' : 'كجم');
    
    // Vehicle and driver
    if (extractedData.vehicle_number) params.set('vehicle_plate', extractedData.vehicle_number);
    if (extractedData.driver_name) params.set('driver_name', extractedData.driver_name);
    if (extractedData.trailer_number) params.set('trailer_number', extractedData.trailer_number);
    
    // Material/waste info
    if (extractedData.material_type) params.set('material_type', extractedData.material_type);
    
    // Company info - could be generator or customer
    if (extractedData.company_name) params.set('company_name', extractedData.company_name);
    if (extractedData.customer_name) params.set('customer_name', extractedData.customer_name);
    
    // Location info
    if (extractedData.governorate) params.set('governorate', extractedData.governorate);
    
    // Ticket/reference info
    if (extractedData.ticket_number) params.set('ticket_number', extractedData.ticket_number);
    
    // Operation type
    if (extractedData.operation_type) params.set('operation_type', extractedData.operation_type);
    
    // Date/time
    const weightDate = extractedData.first_date || extractedData.date;
    if (weightDate) params.set('weight_date', weightDate);
    
    // Notes
    if (extractedData.notes) params.set('notes', extractedData.notes);
    
    onOpenChange(false);
    navigate(`/dashboard/shipments/new?${params.toString()}`);
    
    setImage(null);
    setExtractedData(null);
  };

  const handleReset = () => {
    setImage(null);
    setExtractedData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    handleReset();
  };

  // بناء قائمة الحقول المستخرجة
  const getDataFields = () => {
    if (!extractedData) return [];
    
    const fields = [
      // معلومات الشركة
      { icon: Building, label: 'اسم الشركة', value: extractedData.company_name, group: 'company' },
      { icon: FileText, label: 'رقم التذكرة', value: extractedData.ticket_number, group: 'company' },
      { icon: Package, label: 'نوع العملية', value: extractedData.operation_type, group: 'company' },
      
      // معلومات المادة
      { icon: Package, label: 'نوع المادة', value: extractedData.material_type, group: 'material', highlight: true },
      { icon: User, label: 'اسم العميل', value: extractedData.customer_name, group: 'material' },
      
      // معلومات السائق والمركبة
      { icon: User, label: 'اسم السائق', value: extractedData.driver_name, group: 'driver' },
      { icon: Truck, label: 'رقم المركبة', value: extractedData.vehicle_number, group: 'driver' },
      { icon: Truck, label: 'رقم المقطورة', value: extractedData.trailer_number, group: 'driver' },
      { icon: MapPin, label: 'المحافظة', value: extractedData.governorate, group: 'driver' },
      
      // الأوزان
      { icon: Scale, label: 'الوزن الأول', value: formatWeight(extractedData.first_weight || extractedData.gross_weight, extractedData.unit), group: 'weight' },
      { icon: Scale, label: 'الوزن الثاني', value: formatWeight(extractedData.second_weight || extractedData.tare_weight, extractedData.unit), group: 'weight' },
      { icon: Scale, label: 'الوزن الصافي', value: formatWeight(extractedData.net_weight, extractedData.unit), group: 'weight', highlight: true },
      
      // التاريخ والوقت
      { icon: Calendar, label: 'تاريخ الوزن الأول', value: extractedData.first_date || extractedData.date, group: 'time' },
      { icon: Clock, label: 'وقت الوزن الأول', value: extractedData.first_time || extractedData.time, group: 'time' },
      { icon: Calendar, label: 'تاريخ الوزن الثاني', value: extractedData.second_date, group: 'time' },
      { icon: Clock, label: 'وقت الوزن الثاني', value: extractedData.second_time, group: 'time' },
      
      // معلومات إضافية
      { icon: User, label: 'القائم بالوزن', value: extractedData.weigher_name, group: 'extra' },
    ];
    
    return fields.filter(field => field.value && field.value.trim() !== '' && field.value !== '-');
  };

  const formatWeight = (weight: string | undefined, unit: string | undefined) => {
    if (!weight || weight.trim() === '') return null;
    return `${weight} ${unit || 'kg'}`;
  };

  const dataFields = getDataFields();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-end">
            <span>رفع صورة الوزنة الذكي</span>
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
          </DialogTitle>
          <DialogDescription className="text-right">
            ارفع صورة إيصال الميزان وسيتم استخراج جميع البيانات تلقائياً لإنشاء الشحنة
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Upload Area */}
          <div 
            onClick={() => !isLoading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
              isLoading 
                ? 'border-primary/50 bg-primary/5 cursor-wait' 
                : 'border-border hover:border-primary cursor-pointer'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
              disabled={isLoading}
            />
            
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="w-7 h-7 text-primary animate-spin" />
                  </div>
                  <div>
                    <p className="font-medium text-primary">جاري التحليل بالذكاء الاصطناعي...</p>
                    <p className="text-sm text-muted-foreground mt-1">يتم استخراج جميع بيانات إيصال الميزان</p>
                  </div>
                </motion.div>
              ) : image && extractedData ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-3"
                >
                  <img 
                    src={image} 
                    alt="Scale receipt" 
                    className="max-h-28 mx-auto rounded-lg shadow-md"
                  />
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">تم استخراج {dataFields.length} حقل بنجاح</span>
                  </div>
                </motion.div>
              ) : image ? (
                <motion.div
                  key="image"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <img 
                    src={image} 
                    alt="Scale receipt" 
                    className="max-h-32 mx-auto rounded-lg"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">اضغط لرفع صورة إيصال الميزان</p>
                    <p className="text-sm text-muted-foreground">أو التقط صورة بالكاميرا</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Extracted Data Display */}
          {extractedData && dataFields.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {dataFields.map((field, index) => (
                  <motion.div
                    key={field.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`p-2.5 rounded-lg border ${
                      field.highlight 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
                      <field.icon className="w-3 h-3" />
                      <span className="text-[10px]">{field.label}</span>
                    </div>
                    <p className={`font-semibold text-sm truncate ${field.highlight ? 'text-primary' : ''}`}>
                      {field.value}
                    </p>
                  </motion.div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1"
                >
                  <Camera className="w-4 h-4 ml-2" />
                  رفع صورة جديدة
                </Button>
                <Button 
                  onClick={handleProceedToShipment}
                  className="flex-1"
                  variant="eco"
                >
                  <ArrowLeft className="w-4 h-4 ml-2" />
                  إنشاء الشحنة
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SmartWeightUpload;
