import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, Loader2, Scale, Calendar, Building, Truck, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { toast } from 'sonner';

interface WeightData {
  gross_weight: string;
  tare_weight: string;
  net_weight: string;
  unit: string;
  date: string;
  time: string;
  company_name: string;
  vehicle_number: string;
  additional_data?: Record<string, string>;
}

interface WeightExtractorProps {
  onDataExtracted?: (data: WeightData) => void;
}

const WeightExtractor = ({ onDataExtracted }: WeightExtractorProps) => {
  const [image, setImage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<WeightData | null>(null);
  const { isLoading, extractWeightData } = useAIAssistant();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setImage(base64);
      
      // Extract data
      const data = await extractWeightData(base64);
      if (data) {
        setExtractedData(data);
        onDataExtracted?.(data);
        toast.success('تم استخراج البيانات بنجاح');
      } else {
        toast.error('فشل في استخراج البيانات');
      }
    };
    reader.readAsDataURL(file);
  };

  const dataFields = extractedData ? [
    { icon: Scale, label: 'الوزن الإجمالي', value: `${extractedData.gross_weight} ${extractedData.unit}` },
    { icon: Scale, label: 'وزن الفارغ', value: `${extractedData.tare_weight} ${extractedData.unit}` },
    { icon: Scale, label: 'الوزن الصافي', value: `${extractedData.net_weight} ${extractedData.unit}`, highlight: true },
    { icon: Calendar, label: 'التاريخ', value: extractedData.date },
    { icon: Calendar, label: 'الوقت', value: extractedData.time },
    { icon: Building, label: 'اسم الشركة', value: extractedData.company_name },
    { icon: Truck, label: 'رقم المركبة', value: extractedData.vehicle_number },
  ] : [];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-right">
        <CardTitle className="flex items-center gap-2 justify-end">
          <Scale className="w-5 h-5 text-primary" />
          استخراج بيانات الميزان
        </CardTitle>
        <CardDescription>
          قم برفع صورة إيصال الميزان وسيتم استخراج جميع البيانات تلقائياً
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Area */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          
          {image ? (
            <div className="space-y-4">
              <img 
                src={image} 
                alt="Scale receipt" 
                className="max-h-48 mx-auto rounded-lg"
              />
              {isLoading && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري تحليل الصورة...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="font-medium">اضغط لرفع صورة إيصال الميزان</p>
                <p className="text-sm text-muted-foreground">PNG, JPG أو JPEG</p>
              </div>
            </div>
          )}
        </div>

        {/* Extracted Data */}
        {extractedData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 text-primary">
              <Check className="w-5 h-5" />
              <span className="font-medium">تم استخراج البيانات</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dataFields.map((field, index) => (
                <motion.div
                  key={field.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-xl border ${
                    field.highlight 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <field.icon className="w-4 h-4" />
                    <span className="text-sm">{field.label}</span>
                  </div>
                  <p className={`font-bold text-lg ${field.highlight ? 'text-primary' : ''}`}>
                    {field.value || '-'}
                  </p>
                </motion.div>
              ))}
            </div>

            <Button 
              onClick={() => {
                setImage(null);
                setExtractedData(null);
              }}
              variant="outline"
              className="w-full"
            >
              <Camera className="w-4 h-4 mr-2" />
              رفع صورة جديدة
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeightExtractor;
