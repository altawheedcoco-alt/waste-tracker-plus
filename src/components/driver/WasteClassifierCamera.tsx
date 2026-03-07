import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Camera, Loader2, AlertTriangle, CheckCircle2, ShieldAlert,
  Leaf, Skull, Flame, Droplets, Radiation, Sparkles, RotateCcw,
  FileText, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WasteClassifierCameraProps {
  driverId: string;
  shipmentId?: string;
  onClassified?: (result: ClassificationResult) => void;
}

interface ClassificationResult {
  is_hazardous: boolean;
  waste_category: string;
  waste_subcategory: string;
  basel_code: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  handling_instructions: string[];
  ppe_required: string[];
  transport_requirements: string[];
  confidence: number;
  egyptian_law_ref: string;
}

const riskConfig = {
  low: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: Leaf, label: 'منخفض' },
  medium: { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: AlertTriangle, label: 'متوسط' },
  high: { color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: Flame, label: 'مرتفع' },
  critical: { color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30', icon: Skull, label: 'حرج' },
};

const WasteClassifierCamera = ({ driverId, shipmentId, onClassified }: WasteClassifierCameraProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ClassificationResult | null>(null);

  const compressImage = useCallback(async (file: File, maxWidth = 800, quality = 0.6): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > maxWidth) { h = (maxWidth / w) * h; w = maxWidth; }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const handleCapture = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    setResult(null);

    try {
      const compressed = await compressImage(file);
      setPreview(compressed);

      const { data: aiResult, error: fnError } = await supabase.functions.invoke('classify-waste-photo', {
        body: { image: compressed, shipmentId },
      });

      if (fnError) throw fnError;

      if (aiResult) {
        setResult(aiResult);
        onClassified?.(aiResult);
        toast({
          title: aiResult.is_hazardous ? '⚠️ مخلفات خطرة!' : '✅ مخلفات غير خطرة',
          description: aiResult.waste_category,
          variant: aiResult.is_hazardous ? 'destructive' : 'default',
        });
      }
    } catch (error) {
      console.error('Classification error:', error);
      toast({ title: 'خطأ في التصنيف', variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  }, [shipmentId, onClassified, toast, compressImage]);

  const risk = result ? riskConfig[result.risk_level] : null;
  const RiskIcon = risk?.icon || Info;

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleCapture(file);
        }}
      />

      {/* Camera Card */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Radiation className="w-5 h-5 text-primary" />
            تصنيف المخلفات بالذكاء الاصطناعي
            <Badge variant="outline" className="text-[10px] mr-auto gap-1">
              <Sparkles className="w-3 h-3" />
              قانون 202/2020
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {preview ? (
              <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="relative rounded-xl overflow-hidden aspect-video bg-muted">
                  <img src={preview} alt="Waste" className="w-full h-full object-cover" />
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-2" />
                        <p className="text-sm font-semibold">جاري التصنيف...</p>
                        <p className="text-xs text-muted-foreground">تحليل النوع ومستوى الخطورة</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Classification Result */}
                {result && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    {/* Risk Level Banner */}
                    <div className={`p-4 rounded-xl border-2 ${risk?.border} ${risk?.bg}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-12 h-12 rounded-full ${risk?.bg} flex items-center justify-center`}>
                          <RiskIcon className={`w-6 h-6 ${risk?.color}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-lg font-bold ${risk?.color}`}>
                              {result.is_hazardous ? '⚠️ مخلفات خطرة' : '♻️ مخلفات غير خطرة'}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{result.waste_category}</p>
                          <p className="text-xs text-muted-foreground">{result.waste_subcategory}</p>
                        </div>
                        <Badge className={`${risk?.color} ${risk?.bg} border ${risk?.border}`}>
                          {risk?.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                        <FileText className="w-3 h-3" />
                        <span>كود بازل: {result.basel_code}</span>
                        <span>•</span>
                        <span>ثقة: {result.confidence}%</span>
                        <span>•</span>
                        <span>{result.egyptian_law_ref}</span>
                      </div>
                    </div>

                    {/* Handling Instructions */}
                    {result.handling_instructions.length > 0 && (
                      <Card>
                        <CardContent className="pt-4 pb-4">
                          <p className="text-sm font-bold mb-2 flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-amber-500" />
                            تعليمات المناولة
                          </p>
                          <ul className="space-y-1.5">
                            {result.handling_instructions.map((inst, i) => (
                              <li key={i} className="text-xs flex items-start gap-2">
                                <span className="text-amber-500 mt-0.5">•</span>
                                {inst}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {/* PPE Required */}
                    {result.ppe_required.length > 0 && (
                      <Card>
                        <CardContent className="pt-4 pb-4">
                          <p className="text-sm font-bold mb-2 flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-primary" />
                            معدات الحماية المطلوبة
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {result.ppe_required.map((ppe, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                🛡️ {ppe}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Transport Requirements */}
                    {result.transport_requirements.length > 0 && (
                      <Card>
                        <CardContent className="pt-4 pb-4">
                          <p className="text-sm font-bold mb-2 flex items-center gap-2">
                            <Droplets className="w-4 h-4 text-blue-500" />
                            متطلبات النقل
                          </p>
                          <ul className="space-y-1.5">
                            {result.transport_requirements.map((req, i) => (
                              <li key={i} className="text-xs flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                {req}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                )}

                <Button variant="outline" className="w-full gap-2" onClick={() => { setPreview(null); setResult(null); fileInputRef.current?.click(); }}>
                  <RotateCcw className="w-4 h-4" />
                  تصنيف مخلفات أخرى
                </Button>
              </motion.div>
            ) : (
              <motion.div key="capture" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-video rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center gap-3 hover:bg-primary/10 transition-colors"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold">صوّر المخلفات للتصنيف التلقائي</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      الذكاء الاصطناعي يحدد النوع والخطورة ومتطلبات النقل
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      وفقاً لقانون 202/2020 واتفاقية بازل
                    </p>
                  </div>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
};

export default WasteClassifierCamera;
