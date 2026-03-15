import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Award, 
  Leaf, 
  Download, 
  Printer, 
  CheckCircle2, 
  Star,
  Shield,
  Loader2
} from "lucide-react";
// jsPDF & html2canvas loaded dynamically
import { usePDFExport } from '@/hooks/usePDFExport';

interface Organization {
  id: string;
  name: string;
  organization_type: string;
}

interface SustainabilityMetrics {
  overallScore: number;
  recyclingRate: number;
  wasteReduction: number;
  energyEfficiency: number;
  carbonReduction: number;
  compliance: number;
  innovation: number;
}

interface SustainabilityCertificateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization | null;
  metrics: SustainabilityMetrics;
  level: {
    level: string;
    color: string;
    bg: string;
  };
}

const SustainabilityCertificate = ({
  open,
  onOpenChange,
  organization,
  metrics,
  level
}: SustainabilityCertificateProps) => {
  const { toast } = useToast();
  const certificateRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const { printContent } = usePDFExport({ filename: 'شهادة-الاستدامة' });

  const certificateNumber = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const issueDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const getOrgTypeLabel = (type: string) => {
    switch (type) {
      case "generator": return "الجهة المولدة";
      case "transporter": return "الجهة الناقلة";
      case "recycler": return "الجهة المدورة";
      default: return "جهة";
    }
  };

  const getStarRating = (score: number) => {
    if (score >= 90) return 5;
    if (score >= 75) return 4;
    if (score >= 60) return 3;
    if (score >= 40) return 2;
    return 1;
  };

  const stars = getStarRating(metrics.overallScore);

  const exportToPdf = async () => {
    if (!certificateRef.current) return;
    
    setExporting(true);
    toast({ title: "جاري إنشاء الشهادة...", description: "يرجى الانتظار" });

    try {
      const { PDFService } = await import('@/services/documentService');
      await PDFService.download(certificateRef.current, {
        filename: `شهادة-الاستدامة-${organization?.name || "الجهة"}-${certificateNumber}`,
        orientation: 'landscape',
        format: 'a4',
        scale: 3,
      });
      
      toast({ title: "تم التصدير بنجاح", description: "تم حفظ شهادة PDF" });
    } catch (error) {
      toast({ title: "خطأ في التصدير", description: "حدث خطأ أثناء إنشاء الشهادة", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    if (certificateRef.current) {
      printContent(certificateRef.current);
    }
  };

  if (!organization) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-green-600" />
            شهادة الاستدامة البيئية
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button onClick={exportToPdf} disabled={exporting} className="gradient-eco">
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : (
              <Download className="h-4 w-4 ml-2" />
            )}
            تحميل PDF
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 ml-2" />
            طباعة
          </Button>
        </div>

        {/* Certificate */}
        <div 
          ref={certificateRef} 
          className="bg-white p-8 rounded-lg border-8 border-double border-green-600 relative overflow-hidden print:border-green-700"
          style={{ minHeight: "500px" }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="cert-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                  <circle cx="30" cy="30" r="20" fill="none" stroke="#22c55e" strokeWidth="0.5" />
                  <path d="M30 10 L30 50 M10 30 L50 30" stroke="#22c55e" strokeWidth="0.3" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#cert-pattern)" />
            </svg>
          </div>

          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: 0.08, zIndex: 9999 }}>
            <span className="text-[120px] font-bold text-green-800 rotate-[-30deg] select-none">
              iRecycle
            </span>
          </div>

          {/* Corner Decorations */}
          <div className="absolute top-4 left-4 w-16 h-16 border-l-4 border-t-4 border-green-600 rounded-tl-lg" />
          <div className="absolute top-4 right-4 w-16 h-16 border-r-4 border-t-4 border-green-600 rounded-tr-lg" />
          <div className="absolute bottom-4 left-4 w-16 h-16 border-l-4 border-b-4 border-green-600 rounded-bl-lg" />
          <div className="absolute bottom-4 right-4 w-16 h-16 border-r-4 border-b-4 border-green-600 rounded-br-lg" />

          {/* Content */}
          <div className="relative z-10 text-center space-y-6">
            {/* Header */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <Leaf className="h-12 w-12 text-green-600" />
              <div>
                <h1 className="text-3xl font-bold text-green-800">منصة iRecycle</h1>
                <p className="text-green-600 text-sm">لإدارة النفايات وإعادة التدوير</p>
              </div>
              <Leaf className="h-12 w-12 text-green-600 scale-x-[-1]" />
            </div>

            {/* Title */}
            <div className="py-4">
              <h2 className="text-4xl font-bold text-green-700 mb-2">شهادة الاستدامة البيئية</h2>
              <p className="text-lg text-gray-600">Environmental Sustainability Certificate</p>
            </div>

            {/* Award Badge */}
            <div className="flex justify-center">
              <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full ${level.bg} border-2 border-current`}>
                <Award className={`h-8 w-8 ${level.color}`} />
                <span className={`text-2xl font-bold ${level.color}`}>{level.level}</span>
              </div>
            </div>

            {/* Stars */}
            <div className="flex justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-8 w-8 ${i < stars ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} 
                />
              ))}
            </div>

            {/* Organization Info */}
            <div className="py-6">
              <p className="text-lg text-gray-600 mb-2">تشهد منصة iRecycle بأن</p>
              <h3 className="text-3xl font-bold text-gray-800 mb-2">{organization.name}</h3>
              <p className="text-gray-600">({getOrgTypeLabel(organization.organization_type)})</p>
            </div>

            {/* Score */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mx-auto max-w-md border border-green-200">
              <p className="text-gray-600 mb-2">حققت درجة استدامة بيئية</p>
              <div className="text-6xl font-bold text-green-600 mb-2">{metrics.overallScore}%</div>
              <p className="text-sm text-gray-500">من المعايير البيئية المعتمدة</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto text-sm">
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-gray-600">إعادة التدوير</p>
                <p className="text-xl font-bold text-green-600">{metrics.recyclingRate}%</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-gray-600">تقليل الانبعاثات</p>
                <p className="text-xl font-bold text-blue-600">{metrics.carbonReduction}%</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <p className="text-gray-600">الامتثال البيئي</p>
                <p className="text-xl font-bold text-purple-600">{metrics.compliance}%</p>
              </div>
            </div>

            {/* Certificate Details */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200 mt-6">
              <div className="text-right">
                <p className="text-sm text-gray-500">رقم الشهادة</p>
                <p className="font-mono font-bold text-gray-700">{certificateNumber}</p>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-10 w-10 text-green-600" />
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <div className="text-left">
                <p className="text-sm text-gray-500">تاريخ الإصدار</p>
                <p className="font-bold text-gray-700">{issueDate}</p>
              </div>
            </div>

            {/* Validity */}
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-sm text-gray-500">
                هذه الشهادة صالحة حتى: <span className="font-bold text-gray-700">{validUntil}</span>
              </p>
            </div>

            {/* Security Hash */}
            <div className="text-center pt-4">
              <p className="text-xs text-gray-400 font-mono">
                SEC-{certificateNumber.split("-")[1]}-{Math.random().toString(36).substring(2, 10).toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SustainabilityCertificate;
