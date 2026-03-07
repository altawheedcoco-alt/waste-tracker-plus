/**
 * لوحة الماسح الذكي OCR — Smart OCR Scanner Panel
 */
import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ScanLine, Upload, FileText, Calendar, DollarSign, User,
  AlertTriangle, CheckCircle2, Loader2, Brain, Eye,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface ScanResult {
  classification?: string;
  summary?: string;
  entities?: { type: string; value: string; confidence: number }[];
  key_dates?: { label: string; date: string }[];
  amounts?: { label: string; amount: number; currency: string }[];
  risks?: string[];
  confidence_score?: number;
  raw_text?: string;
}

const OCRScannerPanel = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const runScan = async () => {
    if (!previewUrl) { toast.error(isAr ? 'يرجى رفع مستند أولاً' : 'Please upload a document first'); return; }
    setScanning(true);
    try {
      // Upload to storage first
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const filePath = `ocr-scans/${user.user.id}/${Date.now()}-${fileName}`;
      const res = await fetch(previewUrl);
      const blob = await res.blob();

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, blob, { contentType: blob.type, upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath);
      const publicUrl = urlData?.publicUrl;

      // Call OCR edge function
      const { data, error } = await supabase.functions.invoke('ocr-document-scanner', {
        body: { documentUrl: publicUrl, documentName: fileName, scanType: 'general' },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setResult(data.data);
      toast.success(isAr ? 'تم تحليل المستند بنجاح' : 'Document analyzed successfully');
    } catch (err: any) {
      console.error(err);
      toast.error(isAr ? 'فشل في تحليل المستند' : 'Failed to analyze document');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <ScanLine className="w-5 h-5 text-primary" />
          {isAr ? 'الماسح الذكي (OCR + AI)' : 'Smart Scanner (OCR + AI)'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isAr ? 'ارفع مستنداً لاستخراج البيانات وتصنيفه تلقائياً بالذكاء الاصطناعي' : 'Upload a document to extract data and classify it with AI'}
        </p>
      </div>

      {/* Upload Area */}
      <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => fileRef.current?.click()}>
        <CardContent className="p-6 text-center">
          {previewUrl ? (
            <div className="space-y-3">
              <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain" />
              <p className="text-sm text-muted-foreground">{fileName}</p>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">{isAr ? 'اسحب المستند هنا أو انقر للرفع' : 'Drag document here or click to upload'}</p>
              <p className="text-xs text-muted-foreground">{isAr ? 'صور، PDF، مستندات ممسوحة' : 'Images, PDF, scanned documents'}</p>
            </>
          )}
          <Input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} />
        </CardContent>
      </Card>

      <Button onClick={runScan} disabled={!previewUrl || scanning} className="w-full">
        {scanning ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Brain className="w-4 h-4 ml-1" />}
        {scanning ? (isAr ? 'جارٍ التحليل...' : 'Analyzing...') : (isAr ? 'تحليل المستند' : 'Analyze Document')}
      </Button>

      {/* Results */}
      {result && (
        <ScrollArea className="max-h-[500px]">
          <div className="space-y-4">
            {/* Classification */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  {isAr ? 'التصنيف' : 'Classification'}
                  {result.confidence_score && (
                    <Badge variant="outline" className="text-xs">
                      {Math.round(result.confidence_score * 100)}% {isAr ? 'ثقة' : 'confidence'}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className="text-sm">{result.classification || 'غير محدد'}</Badge>
                {result.summary && <p className="text-sm mt-2 text-muted-foreground">{result.summary}</p>}
              </CardContent>
            </Card>

            {/* Entities */}
            {result.entities && result.entities.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-500" />
                    {isAr ? 'الكيانات المستخرجة' : 'Extracted Entities'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.entities.map((e, i) => (
                      <div key={i} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                        <span className="text-muted-foreground">{e.type}</span>
                        <span className="font-medium">{e.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dates */}
            {result.key_dates && result.key_dates.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-500" />
                    {isAr ? 'التواريخ' : 'Key Dates'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.key_dates.map((d, i) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span>{d.label}</span><span className="font-mono">{d.date}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Amounts */}
            {result.amounts && result.amounts.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-yellow-500" />
                    {isAr ? 'المبالغ' : 'Amounts'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.amounts.map((a, i) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span>{a.label}</span>
                      <span className="font-bold">{a.amount?.toLocaleString()} {a.currency}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Risks */}
            {result.risks && result.risks.length > 0 && (
              <Card className="border-destructive/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-4 h-4" />
                    {isAr ? 'المخاطر المكتشفة' : 'Detected Risks'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.risks.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm py-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default OCRScannerPanel;
