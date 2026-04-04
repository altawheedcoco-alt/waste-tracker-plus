import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, Loader2, Recycle, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { toast } from 'sonner';
import { wasteTypeLabels } from '@/lib/wasteClassification';

interface WasteClassification {
  waste_type: string;
  description: string;
  recommendations: string;
}

const wasteTypeColors: Record<string, string> = {
  plastic: 'bg-blue-500',
  paper: 'bg-amber-500',
  metal: 'bg-muted-foreground',
  glass: 'bg-cyan-500',
  electronic: 'bg-purple-500',
  organic: 'bg-green-500',
  chemical: 'bg-red-500',
  medical: 'bg-pink-500',
  construction: 'bg-orange-500',
  other: 'bg-slate-500',
};

interface WasteClassifierProps {
  onClassified?: (classification: WasteClassification) => void;
}

const WasteClassifier = ({ onClassified }: WasteClassifierProps) => {
  const [image, setImage] = useState<string | null>(null);
  const [classification, setClassification] = useState<WasteClassification | null>(null);
  const { isLoading, classifyWaste } = useAIAssistant();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setImage(base64);
      
      const result = await classifyWaste(base64);
      if (result) {
        setClassification(result);
        onClassified?.(result);
        toast.success('تم تصنيف النفاية بنجاح');
      } else {
        toast.error('فشل في تصنيف النفاية');
      }
    };
    reader.readAsDataURL(file);
  };

  const wasteLabel = classification ? (wasteTypeLabels[classification.waste_type] || 'أخرى') : null;
  const wasteColor = classification ? (wasteTypeColors[classification.waste_type] || wasteTypeColors.other) : null;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-right">
        <CardTitle className="flex items-center gap-2 justify-end">
          <Recycle className="w-5 h-5 text-primary" />
          تصنيف النفايات بالذكاء الاصطناعي
        </CardTitle>
        <CardDescription>
          قم برفع صورة للنفاية وسيتم تحديد نوعها وتوصيات التخلص منها
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
                alt="Waste" 
                className="max-h-48 mx-auto rounded-lg object-cover"
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
                <Camera className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="font-medium">اضغط لرفع صورة النفاية</p>
                <p className="text-sm text-muted-foreground">PNG, JPG أو JPEG</p>
              </div>
            </div>
          )}
        </div>

        {/* Classification Result */}
        {classification && wasteLabel && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Type Badge */}
            <div className="flex items-center justify-center gap-3">
              <Badge className={`${wasteColor} text-white text-lg px-4 py-2`}>
                {wasteLabel}
              </Badge>
            </div>

            {/* Description */}
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary mt-1 shrink-0" />
                <div className="text-right">
                  <h4 className="font-medium mb-1">الوصف</h4>
                  <p className="text-muted-foreground">{classification.description}</p>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-1 shrink-0" />
                <div className="text-right">
                  <h4 className="font-medium mb-1 text-amber-800 dark:text-amber-200">
                    توصيات التخلص الآمن
                  </h4>
                  <p className="text-amber-700 dark:text-amber-300">
                    {classification.recommendations}
                  </p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => {
                setImage(null);
                setClassification(null);
              }}
              variant="outline"
              className="w-full"
            >
              <Camera className="w-4 h-4 mr-2" />
              تصنيف صورة جديدة
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default WasteClassifier;
