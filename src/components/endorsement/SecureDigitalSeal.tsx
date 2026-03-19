import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { generateDigitalSealSVG, generateSealNumber, generateDocumentSealProof, type DigitalSealData } from '@/lib/secureDigitalSeal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Shield, Copy, CheckCircle2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface SecureDigitalSealProps {
  entityId: string;
  entityType: 'member' | 'organization';
  entityName: string;
  title?: string;
  orgName?: string;
  documentRef?: string;
  size?: number;
  /** Show seal number and label below */
  showLabel?: boolean;
  /** Compact: just the seal without extras */
  compact?: boolean;
  /** Enable clicking on seal to navigate to profile */
  linkToProfile?: boolean;
  className?: string;
}

const SecureDigitalSeal = ({
  entityId,
  entityType,
  entityName,
  title,
  orgName,
  documentRef,
  size = 160,
  showLabel = true,
  compact = false,
  linkToProfile = false,
  className = '',
}: SecureDigitalSealProps) => {
  const profileUrl = entityType === 'member'
    ? `/dashboard/profile/${entityId}`
    : `/dashboard/organization/${entityId}`;
  const [copied, setCopied] = useState(false);

  const sealNumber = useMemo(
    () => generateSealNumber(entityId, entityType, entityName),
    [entityId, entityType, entityName]
  );

  const svgString = useMemo(() => {
    const data: DigitalSealData = {
      entityId,
      entityType,
      entityName,
      title,
      orgName,
      documentRef,
      size,
    };
    return generateDigitalSealSVG(data);
  }, [entityId, entityType, entityName, title, orgName, documentRef, size]);

  const docProof = useMemo(() => {
    if (!documentRef) return null;
    return generateDocumentSealProof(sealNumber, documentRef, new Date().toISOString());
  }, [sealNumber, documentRef]);

  const handleCopySealNumber = () => {
    navigator.clipboard.writeText(sealNumber);
    setCopied(true);
    toast.success('تم نسخ رقم الختم');
    setTimeout(() => setCopied(false), 2000);
  };

  const SealImage = (
    <div
      className={`inline-block ${linkToProfile ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );

  const WrappedSeal = linkToProfile ? (
    <Link to={profileUrl} title={`عرض ملف ${entityName}`}>
      {SealImage}
    </Link>
  ) : SealImage;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={className}>
              {WrappedSeal}
            </div>
          </TooltipTrigger>
          <TooltipContent dir="rtl" className="text-center">
            <p className="font-semibold text-xs">{entityName}</p>
            <p className="font-mono text-[10px] text-primary">{sealNumber}</p>
            <p className="text-[10px] text-muted-foreground">ختم رقمي مؤمّن</p>
            {linkToProfile && (
              <p className="text-[10px] text-primary flex items-center gap-1 justify-center mt-1">
                <ExternalLink className="w-2.5 h-2.5" /> عرض الملف الشخصي
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={`text-center space-y-2 ${className}`} dir="rtl">
      {/* Seal SVG */}
      {WrappedSeal}

      {showLabel && (
        <div className="space-y-1.5">
          {/* Seal Number */}
          <div
            className="inline-flex items-center gap-1.5 cursor-pointer rounded-full px-3 py-1 bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
            onClick={handleCopySealNumber}
          >
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span className="font-mono text-xs font-bold text-primary">{sealNumber}</span>
            {copied ? (
              <CheckCircle2 className="w-3 h-3 text-green-600" />
            ) : (
              <Copy className="w-3 h-3 text-muted-foreground" />
            )}
          </div>

          {/* Info */}
          <div className="flex items-center justify-center gap-1.5">
            <Badge variant="outline" className="text-[10px] h-4 gap-0.5">
              <Shield className="w-2.5 h-2.5" />
              {entityType === 'member' ? 'ختم عضو' : 'ختم جهة'}
            </Badge>
            {docProof && (
              <Badge variant="secondary" className="text-[10px] h-4 font-mono">
                DOC: {docProof}
              </Badge>
            )}
          </div>

          <p className="text-[9px] text-muted-foreground">
            ختم رقمي مشفّر • فريد وغير قابل للتكرار
          </p>

          {linkToProfile && (
            <Link to={profileUrl} className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline">
              <ExternalLink className="w-2.5 h-2.5" />
              عرض الملف الشخصي
            </Link>
          )}

          <Link to={`/verify-seal?code=${encodeURIComponent(sealNumber)}`} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary hover:underline">
            <Shield className="w-2.5 h-2.5" />
            تحقق من الختم
          </Link>
        </div>
      )}
    </div>
  );
};

export default SecureDigitalSeal;
