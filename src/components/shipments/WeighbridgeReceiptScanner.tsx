import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Loader2, Scale, Check, X, ImageIcon } from 'lucide-react';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { toast } from 'sonner';

interface ExtractedWeightData {
  net_weight?: string;
  gross_weight?: string;
  tare_weight?: string;
  unit?: string;
  date?: string;
  time?: string;
  vehicle_number?: string;
  driver_name?: string;
  company_name?: string;
  material_type?: string;
  ticket_number?: string;
  notes?: string;
}

interface WeighbridgeReceiptScannerProps {
  /** Index of the waste item this scanner belongs to */
  wasteItemIndex: number;
  /** Called when data is extracted and user confirms auto-fill */
  onDataExtracted: (index: number, data: ExtractedWeightData) => void;
  /** Compact mode for inline display */
  compact?: boolean;
}

const WeighbridgeReceiptScanner = ({ wasteItemIndex, onDataExtracted, compact = true }: WeighbridgeReceiptScannerProps) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedWeightData | null>(null);
  const [showResults, setShowResults] = useState(false);
  const { isLoading, extractWeightData } = useAIAssistant();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن لا يتجاوز 10 ميجابايت');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setImagePreview(base64);

      toast.info('جاري تحليل صورة إيصال الميزان بالذكاء الاصطناعي...');
      const data = await extractWeightData(base64);
      if (data) {
        const mapped: ExtractedWeightData = {
          net_weight: data.net_weight || undefined,
          gross_weight: data.gross_weight || undefined,
          tare_weight: data.tare_weight || undefined,
          unit: data.unit || undefined,
          date: data.date || undefined,
          time: data.time || undefined,
          vehicle_number: data.vehicle_number || undefined,
          driver_name: data.driver_name || undefined,
          company_name: data.company_name || undefined,
          material_type: data.material_type || undefined,
          ticket_number: data.ticket_number || undefined,
          notes: data.notes || undefined,
        };
        setExtractedData(mapped);
        setShowResults(true);
        toast.success('تم استخراج البيانات من إيصال الميزان بنجاح');
      } else {
        toast.error('فشل في استخراج البيانات من الصورة');
      }
    };
    reader.readAsDataURL(file);
  }, [extractWeightData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (e.target) e.target.value = '';
  };

  const confirmAutoFill = () => {
    if (extractedData) {
      onDataExtracted(wasteItemIndex, extractedData);
      toast.success(`تم تعبئة بيانات الوزنة تلقائياً للمخلف ${wasteItemIndex + 1}`);
      setShowResults(false);
    }
  };

  const reset = () => {
    setImagePreview(null);
    setExtractedData(null);
    setShowResults(false);
  };

  const dataLabels: { key: keyof ExtractedWeightData; label: string }[] = [
    { key: 'net_weight', label: 'الوزن الصافي' },
    { key: 'gross_weight', label: 'الوزن الإجمالي' },
    { key: 'tare_weight', label: 'وزن الفارغ' },
    { key: 'unit', label: 'الوحدة' },
    { key: 'material_type', label: 'نوع المادة' },
    { key: 'vehicle_number', label: 'رقم المركبة' },
    { key: 'driver_name', label: 'اسم السائق' },
    { key: 'date', label: 'التاريخ' },
    { key: 'ticket_number', label: 'رقم التذكرة' },
  ];

  // Show extracted results overlay
  if (showResults && extractedData) {
    return (
      <div className="border border-primary/30 rounded-lg p-3 bg-primary/5 space-y-3">
        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={reset}>
            <X className="w-3.5 h-3.5" />
          </Button>
          <div className="flex items-center gap-1.5 text-primary text-xs font-medium">
            <Scale className="w-3.5 h-3.5" />
            بيانات مستخرجة من الوزنة
          </div>
        </div>

        {imagePreview && (
          <img src={imagePreview} alt="إيصال الميزان" className="w-full h-24 object-cover rounded-md" />
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          {dataLabels.map(({ key, label }) => {
            const val = extractedData[key];
            if (!val) return null;
            return (
              <div key={key} className="bg-background rounded p-1.5 border">
                <span className="text-muted-foreground block">{label}</span>
                <span className="font-bold text-foreground">{val}</span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2">
          <Button type="button" size="sm" className="flex-1 gap-1 text-xs" onClick={confirmAutoFill}>
            <Check className="w-3.5 h-3.5" />
            تعبئة تلقائية
          </Button>
          <Button type="button" size="sm" variant="outline" className="gap-1 text-xs" onClick={reset}>
            إعادة المسح
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="border border-dashed border-primary/30 rounded-lg p-4 flex items-center justify-center gap-2 text-primary text-xs">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>جاري تحليل صورة إيصال الميزان...</span>
      </div>
    );
  }

  // Default: upload buttons
  return (
    <div className="space-y-1">
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      <div className="flex gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 gap-1 text-xs border-dashed border-primary/40 text-primary hover:bg-primary/5 h-8"
          onClick={() => cameraInputRef.current?.click()}
        >
          <Camera className="w-3.5 h-3.5" />
          صورة الوزنة
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1 text-xs border-dashed border-primary/40 text-primary hover:bg-primary/5 h-8"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-3.5 h-3.5" />
          رفع
        </Button>
      </div>
    </div>
  );
};

export default WeighbridgeReceiptScanner;
