import { Award, Calendar, Shield, CheckCircle, XCircle, Hash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { QRCodeSVG } from 'qrcode.react';

interface SharedCertificateViewProps {
  data: any;
}

const levelColors: Record<string, string> = {
  gold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  silver: 'bg-gray-100 text-gray-700 border-gray-300',
  bronze: 'bg-orange-100 text-orange-800 border-orange-300',
  platinum: 'bg-purple-100 text-purple-800 border-purple-300',
};

const SharedCertificateView = ({ data }: SharedCertificateViewProps) => {
  const isValid = data.is_valid && (!data.expires_at || new Date(data.expires_at) > new Date());

  return (
    <div className="space-y-6" dir="rtl">
      {/* Certificate Card */}
      <div className="bg-card rounded-xl border-2 border-primary/20 p-8 space-y-6 text-center relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-4 left-4 w-32 h-32 border-4 border-primary rounded-full" />
          <div className="absolute bottom-4 right-4 w-24 h-24 border-4 border-primary rounded-full" />
        </div>

        {/* Status */}
        <div className="relative">
          {isValid ? (
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              شهادة سارية المفعول
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-medium">
              <XCircle className="w-4 h-4" />
              شهادة منتهية / ملغاة
            </div>
          )}
        </div>

        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center relative">
          <Award className="w-10 h-10 text-primary" />
        </div>

        {/* Title */}
        <div className="space-y-2 relative">
          <h2 className="text-2xl font-bold">شهادة الامتثال البيئي</h2>
          <Badge className={`text-sm ${levelColors[data.certificate_level] || 'bg-muted'}`}>
            {data.certificate_level?.toUpperCase()}
          </Badge>
        </div>

        {/* Certificate Number */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Hash className="w-4 h-4" />
          <span className="font-mono" dir="ltr">{data.certificate_number}</span>
        </div>

        {/* Score */}
        {data.overall_score != null && (
          <div className="relative">
            <div className="text-5xl font-bold text-primary">{data.overall_score}%</div>
            <p className="text-sm text-muted-foreground mt-1">الدرجة الإجمالية</p>
          </div>
        )}

        {/* Score Details */}
        {(data.operations_score != null || data.training_score != null) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t relative">
            {[
              { label: 'العمليات', value: data.operations_score },
              { label: 'التدريب', value: data.training_score },
              { label: 'التوثيق', value: data.documentation_score },
              { label: 'التراخيص', value: data.licenses_score },
            ].filter(s => s.value != null).map((score, i) => (
              <div key={i} className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-lg font-bold">{score.value}%</div>
                <div className="text-xs text-muted-foreground">{score.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t text-sm relative">
          <div className="flex items-center gap-2 justify-center">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">تاريخ الإصدار</p>
              <p className="font-medium">{data.issued_at ? new Date(data.issued_at).toLocaleDateString('ar-EG') : '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">تاريخ الانتهاء</p>
              <p className="font-medium">{data.expires_at ? new Date(data.expires_at).toLocaleDateString('ar-EG') : '—'}</p>
            </div>
          </div>
        </div>

        {/* ISO Standards */}
        {data.iso_standards && data.iso_standards.length > 0 && (
          <div className="flex items-center gap-2 justify-center flex-wrap pt-4 border-t relative">
            <Shield className="w-4 h-4 text-muted-foreground" />
            {data.iso_standards.map((iso: string, i: number) => (
              <Badge key={i} variant="outline" className="text-xs">{iso}</Badge>
            ))}
          </div>
        )}

        {/* QR Code */}
        {data.verification_code && (
          <div className="flex justify-center pt-4 border-t relative">
            <div className="p-3 bg-white rounded-lg">
              <QRCodeSVG
                value={`${window.location.origin}/verify/certificate/${data.verification_code}`}
                size={100}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedCertificateView;
