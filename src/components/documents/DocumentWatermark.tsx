/**
 * Document Watermark Overlay — طبقة العلامة المائية المتقدمة
 * تغطي كامل صفحات المستند بغض النظر عن الطول
 * تتضمن بيانات المستخدم + التحذيرات القانونية الثلاثة
 */
import { memo, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface DocumentWatermarkProps {
  enabled: boolean;
  userName?: string;
  orgName?: string;
}

const DocumentWatermark = memo(({ enabled, userName, orgName }: DocumentWatermarkProps) => {
  const { user, profile, organization } = useAuth();

  const watermarkText = useMemo(() => {
    const name = userName || profile?.full_name || user?.email || 'مستخدم';
    const org = orgName || organization?.name || '';
    const time = format(new Date(), 'yyyy/MM/dd HH:mm:ss');
    return [name, org, time].filter(Boolean).join(' • ');
  }, [userName, orgName, profile?.full_name, user?.email, organization?.name]);

  const legalLines = [
    '⚠ يُحظر الاستخدام بدون موافقة كتابية من صاحب الشأن أو ممثله القانوني',
    '⚠ يُمنع التداول أو الطباعة لدى أي جهات حكومية أو خاصة بدون إذن',
    '⚠ iRecycle تُخلي مسؤوليتها عن أي تصرف غير قانوني بالمستند',
  ];

  const tileUrl = useMemo(() => {
    if (!enabled) return null;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const dpr = 2; // High-res tile
    const w = 800;
    const h = 500;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);

    // === Row 1: User info (bold, distinctive) ===
    ctx.save();
    ctx.translate(w / 2, 80);
    ctx.rotate(-30 * Math.PI / 180);
    ctx.font = 'bold 16px "Courier New", "Lucida Console", monospace';
    ctx.fillStyle = 'rgba(0, 80, 180, 0.22)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🔒 ${watermarkText}`, 0, 0);
    ctx.restore();

    // === Row 2: Legal warning lines (red-tinted, spaced) ===
    ctx.save();
    ctx.translate(w / 2, 220);
    ctx.rotate(-30 * Math.PI / 180);
    ctx.font = 'bold 11px "Courier New", "Lucida Console", monospace';
    ctx.fillStyle = 'rgba(180, 20, 20, 0.16)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    legalLines.forEach((line, i) => {
      ctx.fillText(line, 0, i * 22);
    });
    ctx.restore();

    // === Row 3: Repeat user info offset ===
    ctx.save();
    ctx.translate(w / 2, 400);
    ctx.rotate(-30 * Math.PI / 180);
    ctx.font = 'italic 12px "Courier New", "Lucida Console", monospace';
    ctx.fillStyle = 'rgba(0, 80, 180, 0.14)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`محمي — ${watermarkText}`, 0, 0);
    ctx.restore();

    return canvas.toDataURL('image/png');
  }, [enabled, watermarkText]);

  if (!enabled || !tileUrl) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none z-50"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        backgroundImage: `url(${tileUrl})`,
        backgroundRepeat: 'repeat',
        backgroundSize: '800px 500px',
        width: '100%',
        height: '100%',
        minHeight: '100%',
      }}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
});

DocumentWatermark.displayName = 'DocumentWatermark';
export default DocumentWatermark;
