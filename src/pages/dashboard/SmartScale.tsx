import { useState, useCallback } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Scale, Upload, CheckCircle, AlertTriangle, Camera, History, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import BackButton from '@/components/navigation/BackButton';
import { toast } from 'sonner';

interface VerificationResult {
  ocrWeight: number | null;
  manualWeight: number;
  deviation: number;
  status: 'match' | 'warning' | 'alert';
  imageUrl?: string;
  timestamp: string;
}

const SmartScale = () => {
  const { profile } = useAuth();
  const [manualWeight, setManualWeight] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [history, setHistory] = useState<VerificationResult[]>([]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleVerify = useCallback(async () => {
    if (!selectedFile || !manualWeight) {
      toast.error('يرجى إدخال الوزن ورفع صورة الميزان');
      return;
    }

    setIsProcessing(true);
    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      // Call AI document classifier with scale_reading mode
      const { data, error } = await supabase.functions.invoke('ai-document-classifier', {
        body: {
          imageBase64: base64,
          fileName: selectedFile.name,
          mimeType: selectedFile.type,
          mode: 'scale_reading',
        },
      });

      if (error) throw error;

      const ocrWeight = data?.result?.extracted_data?.weight_kg || data?.result?.extracted_data?.net_weight || null;
      const manual = parseFloat(manualWeight);
      const deviation = ocrWeight ? Math.abs(((manual - ocrWeight) / ocrWeight) * 100) : 0;
      const status = !ocrWeight ? 'warning' : deviation <= 5 ? 'match' : 'alert';

      const verification: VerificationResult = {
        ocrWeight: ocrWeight ? parseFloat(ocrWeight) : null,
        manualWeight: manual,
        deviation: Math.round(deviation * 10) / 10,
        status,
        imageUrl: preview || undefined,
        timestamp: new Date().toISOString(),
      };

      setResult(verification);
      setHistory(prev => [verification, ...prev]);

      if (status === 'match') {
        toast.success('✅ الأوزان متطابقة — لا يوجد انحراف');
      } else if (status === 'alert') {
        toast.warning(`⚠️ انحراف ${deviation.toFixed(1)}% — يرجى المراجعة`);
      } else {
        toast.info('لم يتمكن النظام من قراءة الوزن من الصورة');
      }
    } catch (err) {
      console.error('Scale verification error:', err);
      toast.error('حدث خطأ أثناء تحليل صورة الميزان');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, manualWeight, preview]);

  const resetForm = () => {
    setSelectedFile(null);
    setPreview(null);
    setManualWeight('');
    setResult(null);
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto" dir="rtl">
        <div className="flex items-center gap-3">
          <BackButton />
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-primary-foreground">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">الميزان الذكي</h1>
              <p className="text-sm text-muted-foreground">تحقق من الأوزان بالذكاء الاصطناعي</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary" />
                إدخال بيانات الوزن
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="manual-weight" className="text-sm">الوزن المُدخل يدوياً (كجم)</Label>
                <Input
                  id="manual-weight"
                  type="number"
                  placeholder="أدخل الوزن بالكيلوجرام"
                  value={manualWeight}
                  onChange={e => setManualWeight(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm">صورة الميزان</Label>
                <div className="mt-1">
                  {preview ? (
                    <div className="relative">
                      <img src={preview} alt="Scale" className="w-full h-48 object-cover rounded-lg border" />
                      <Button size="sm" variant="secondary" className="absolute top-2 left-2" onClick={() => { setSelectedFile(null); setPreview(null); }}>
                        تغيير
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">اضغط لرفع صورة الميزان</span>
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleVerify} disabled={isProcessing || !selectedFile || !manualWeight} className="flex-1 gap-2">
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scale className="w-4 h-4" />}
                  {isProcessing ? 'جاري التحليل...' : 'تحقق الآن'}
                </Button>
                <Button variant="outline" onClick={resetForm}>مسح</Button>
              </div>
            </CardContent>
          </Card>

          {/* Result Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {result?.status === 'match' ? <CheckCircle className="w-4 h-4 text-green-600" /> :
                 result?.status === 'alert' ? <AlertTriangle className="w-4 h-4 text-destructive" /> :
                 <Scale className="w-4 h-4 text-muted-foreground" />}
                نتيجة التحقق
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg border ${
                    result.status === 'match' ? 'bg-green-500/10 border-green-500/30' :
                    result.status === 'alert' ? 'bg-destructive/10 border-destructive/30' :
                    'bg-yellow-500/10 border-yellow-500/30'
                  }`}>
                    <div className="text-center">
                      <Badge variant={result.status === 'match' ? 'default' : result.status === 'alert' ? 'destructive' : 'secondary'} className="text-sm mb-2">
                        {result.status === 'match' ? '✅ متطابق' : result.status === 'alert' ? '⚠️ انحراف كبير' : '❓ غير قابل للقراءة'}
                      </Badge>
                      {result.ocrWeight !== null && (
                        <p className="text-2xl font-bold text-foreground mt-2">{result.deviation}%</p>
                      )}
                      <p className="text-xs text-muted-foreground">نسبة الانحراف</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الوزن اليدوي</span>
                      <span className="font-semibold text-foreground">{result.manualWeight} كجم</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الوزن المقروء (AI)</span>
                      <span className="font-semibold text-foreground">{result.ocrWeight !== null ? `${result.ocrWeight} كجم` : 'غير متاح'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الوقت</span>
                      <span className="text-foreground">{new Date(result.timestamp).toLocaleTimeString('ar-EG')}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Scale className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>ارفع صورة الميزان وأدخل الوزن اليدوي للتحقق</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* History */}
        {history.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                سجل التحققات ({history.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-accent/30 text-sm">
                    <div className="flex items-center gap-2">
                      {h.status === 'match' ? <CheckCircle className="w-4 h-4 text-green-600" /> :
                       h.status === 'alert' ? <AlertTriangle className="w-4 h-4 text-destructive" /> :
                       <Scale className="w-4 h-4 text-yellow-600" />}
                      <span className="text-foreground">يدوي: {h.manualWeight} كجم</span>
                      {h.ocrWeight !== null && <span className="text-muted-foreground">| AI: {h.ocrWeight} كجم</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      {h.ocrWeight !== null && (
                        <Badge variant={h.status === 'match' ? 'default' : 'destructive'} className="text-xs">
                          {h.deviation}%
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">{new Date(h.timestamp).toLocaleTimeString('ar-EG')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SmartScale;
