import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Award, QrCode, ShieldCheck, Package, Factory, Leaf,
  FileText, Download, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CertificateData {
  productName: string;
  productType: string;
  safetyGrade: string;
  batchNumber: string;
  inputMaterial: string;
  inputSource: string;
  outputQuantityKg: string;
  processingMethod: string;
  qualityNotes: string;
}

const safetyGrades = [
  { value: 'food_grade', label: '🍽️ صالح للأغذية (Food Grade)', color: 'text-emerald-600' },
  { value: 'cosmetic_grade', label: '💄 صالح لمستحضرات التجميل', color: 'text-pink-600' },
  { value: 'industrial', label: '🏭 استخدام صناعي فقط', color: 'text-blue-600' },
  { value: 'construction', label: '🏗️ مواد بناء فقط', color: 'text-amber-600' },
  { value: 'agricultural', label: '🌱 استخدام زراعي', color: 'text-green-600' },
];

const RecycledProductCertificate = () => {
  const { organization } = useAuth();
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(false);
  const [form, setForm] = useState<CertificateData>({
    productName: '', productType: '', safetyGrade: '', batchNumber: '',
    inputMaterial: '', inputSource: '', outputQuantityKg: '',
    processingMethod: '', qualityNotes: '',
  });

  const certId = `RC-${Date.now().toString(36).toUpperCase()}`;
  const certDate = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

  const handleGenerate = () => {
    if (!form.productName || !form.safetyGrade || !form.batchNumber) {
      toast({ title: 'أكمل البيانات المطلوبة', variant: 'destructive' });
      return;
    }
    setShowPreview(true);
    toast({ title: '✅ تم إنشاء الشهادة', description: `رقم: ${certId}` });
  };

  const update = (key: keyof CertificateData, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const gradeInfo = safetyGrades.find(g => g.value === form.safetyGrade);

  return (
    <div className="space-y-4">
      {!showPreview ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="w-5 h-5 text-emerald-500" />
              إصدار شهادة منتج مُعاد تدويره
              <Badge variant="outline" className="text-[10px] mr-auto">رقمية + QR</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="اسم المنتج النهائي *" value={form.productName} onChange={(e) => update('productName', e.target.value)} className="text-right" />
            <Input placeholder="نوع المنتج (حبيبات، ألواح، خيوط...)" value={form.productType} onChange={(e) => update('productType', e.target.value)} className="text-right" />
            
            <Select value={form.safetyGrade} onValueChange={(v) => update('safetyGrade', v)}>
              <SelectTrigger className="text-right">
                <SelectValue placeholder="درجة السلامة *" />
              </SelectTrigger>
              <SelectContent>
                {safetyGrades.map(g => (
                  <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input placeholder="رقم التشغيلة (Batch) *" value={form.batchNumber} onChange={(e) => update('batchNumber', e.target.value)} className="text-right" />
            <Input placeholder="المادة الخام المُدخلة (بلاستيك PET، ورق...)" value={form.inputMaterial} onChange={(e) => update('inputMaterial', e.target.value)} className="text-right" />
            <Input placeholder="مصدر المادة (اسم المولد أو الناقل)" value={form.inputSource} onChange={(e) => update('inputSource', e.target.value)} className="text-right" />
            <Input placeholder="الكمية المنتجة (كجم)" type="number" value={form.outputQuantityKg} onChange={(e) => update('outputQuantityKg', e.target.value)} className="text-right" />
            <Input placeholder="طريقة المعالجة (غسيل، تقطيع، صهر...)" value={form.processingMethod} onChange={(e) => update('processingMethod', e.target.value)} className="text-right" />
            <Textarea placeholder="ملاحظات الجودة" value={form.qualityNotes} onChange={(e) => update('qualityNotes', e.target.value)} className="text-right h-16" />

            <Button onClick={handleGenerate} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Award className="w-4 h-4" />
              إصدار الشهادة
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-emerald-500/30">
          <CardContent className="pt-6 pb-6">
            {/* Certificate Preview */}
            <div className="border-2 border-emerald-500/20 rounded-2xl p-5 bg-gradient-to-b from-emerald-50/50 to-background dark:from-emerald-950/20 space-y-4" dir="rtl">
              {/* Header */}
              <div className="text-center border-b pb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Leaf className="w-6 h-6 text-emerald-500" />
                  <h2 className="text-lg font-bold">شهادة منتج مُعاد تدويره</h2>
                  <Leaf className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-xs text-muted-foreground">Recycled Product Certificate</p>
                <Badge className="mt-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">{certId}</Badge>
              </div>

              {/* Issuer */}
              <div className="text-center">
                <p className="text-sm font-bold">{organization?.name || 'جهة التدوير'}</p>
                <p className="text-[10px] text-muted-foreground">{certDate}</p>
              </div>

              {/* Product Info */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">المنتج</p>
                  <p className="font-bold">{form.productName}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">النوع</p>
                  <p className="font-bold">{form.productType || '-'}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">رقم التشغيلة</p>
                  <p className="font-bold">{form.batchNumber}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">الكمية</p>
                  <p className="font-bold">{form.outputQuantityKg} كجم</p>
                </div>
              </div>

              {/* Safety Grade */}
              <div className={`p-3 rounded-xl border-2 ${form.safetyGrade === 'food_grade' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
                <div className="flex items-center gap-2 justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <span className={`font-bold ${gradeInfo?.color}`}>{gradeInfo?.label}</span>
                </div>
                {form.safetyGrade !== 'food_grade' && (
                  <p className="text-center text-[10px] text-amber-600 mt-1 flex items-center justify-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    غير صالح للاستخدام مع المواد الغذائية
                  </p>
                )}
              </div>

              {/* Traceability */}
              <div className="text-xs space-y-1">
                <p><strong>المادة الخام:</strong> {form.inputMaterial || '-'}</p>
                <p><strong>المصدر:</strong> {form.inputSource || '-'}</p>
                <p><strong>المعالجة:</strong> {form.processingMethod || '-'}</p>
                {form.qualityNotes && <p><strong>ملاحظات:</strong> {form.qualityNotes}</p>}
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                <QRCodeSVG
                  value={JSON.stringify({
                    cert: certId,
                    product: form.productName,
                    grade: form.safetyGrade,
                    batch: form.batchNumber,
                    org: organization?.name,
                    date: new Date().toISOString(),
                  })}
                  size={120}
                  level="H"
                />
              </div>
              <p className="text-center text-[10px] text-muted-foreground">امسح الكود للتحقق من أصل المنتج</p>
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowPreview(false)}>تعديل</Button>
              <Button className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => toast({ title: '📄 تم حفظ الشهادة' })}>
                <Download className="w-4 h-4" />
                حفظ
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecycledProductCertificate;
