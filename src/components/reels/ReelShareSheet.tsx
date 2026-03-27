import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Download, MessageCircle, Share2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReelShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  reelUrl: string;
  videoUrl: string;
  caption?: string | null;
}

const SHARE_OPTIONS = [
  {
    id: 'whatsapp',
    label: 'واتساب',
    emoji: '💬',
    color: 'bg-green-500',
    getUrl: (url: string, text: string) => `https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`,
  },
  {
    id: 'telegram',
    label: 'تيليجرام',
    emoji: '✈️',
    color: 'bg-blue-500',
    getUrl: (url: string, text: string) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    id: 'twitter',
    label: 'تويتر',
    emoji: '🐦',
    color: 'bg-sky-500',
    getUrl: (url: string, text: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: 'facebook',
    label: 'فيسبوك',
    emoji: '📘',
    color: 'bg-blue-600',
    getUrl: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
];

const ReelShareSheet = memo(({ isOpen, onClose, reelUrl, videoUrl, caption }: ReelShareSheetProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(reelUrl);
      setCopied(true);
      toast({ title: 'تم نسخ الرابط ✓' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'فشل النسخ', variant: 'destructive' });
    }
  }, [reelUrl, toast]);

  const handleDownload = useCallback(() => {
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `reel-${Date.now()}.mp4`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: 'جاري التنزيل... 📥' });
  }, [videoUrl, toast]);

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: caption || 'ريل', url: reelUrl });
      } catch {}
    }
  }, [caption, reelUrl]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 bg-black/60"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl p-5 pb-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4" />

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-foreground text-lg">مشاركة الريل</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Social share buttons */}
          <div className="flex gap-4 mb-6 justify-center">
            {SHARE_OPTIONS.map(opt => (
              <a
                key={opt.id}
                href={opt.getUrl(reelUrl, caption || 'شاهد هذا الريل!')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5"
              >
                <div className={`w-14 h-14 ${opt.color} rounded-2xl flex items-center justify-center text-2xl shadow-lg`}>
                  {opt.emoji}
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">{opt.label}</span>
              </a>
            ))}
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-muted-foreground" />}
              <span className="text-sm font-medium text-foreground">{copied ? 'تم النسخ!' : 'نسخ الرابط'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <Download className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">تنزيل الفيديو</span>
            </button>

            {typeof navigator.share === 'function' && (
              <button
                onClick={handleNativeShare}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <Share2 className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">مشاركة أخرى...</span>
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

ReelShareSheet.displayName = 'ReelShareSheet';
export default ReelShareSheet;
