import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Share2,
  Copy,
  Twitter,
  Facebook,
  Linkedin,
  MessageCircle,
  Mail,
  Link2,
  QrCode,
  Download,
  Check,
  ExternalLink,
} from 'lucide-react';

interface PostShareActionsProps {
  content: string;
  hashtags?: string[];
  postId?: string;
  postUrl?: string;
  variant?: 'button' | 'icon' | 'dropdown';
  size?: 'sm' | 'default' | 'lg';
}

const PostShareActions = ({
  content,
  hashtags = [],
  postId,
  postUrl,
  variant = 'dropdown',
  size = 'default',
}: PostShareActionsProps) => {
  const [copied, setCopied] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);

  const fullContent = hashtags.length > 0 
    ? `${content}\n\n${hashtags.map(h => `#${h}`).join(' ')}`
    : content;

  const shareUrl = postUrl || (postId ? `${window.location.origin}/posts/${postId}` : window.location.href);

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(fullContent);
      setCopied(true);
      toast.success('تم نسخ المحتوى');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('فشل في نسخ المحتوى');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('تم نسخ الرابط');
    } catch (error) {
      toast.error('فشل في نسخ الرابط');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'منشور من منصة رسكلة',
          text: fullContent.substring(0, 280),
          url: shareUrl,
        });
        toast.success('تمت المشاركة بنجاح');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error('فشل في المشاركة');
        }
      }
    } else {
      handleCopyContent();
    }
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(fullContent.substring(0, 280));
    const url = encodeURIComponent(shareUrl);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const shareToFacebook = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const shareToLinkedIn = () => {
    const url = encodeURIComponent(shareUrl);
    const title = encodeURIComponent('منشور من منصة رسكلة');
    const summary = encodeURIComponent(fullContent.substring(0, 200));
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`${fullContent}\n\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareToTelegram = () => {
    const text = encodeURIComponent(fullContent);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
  };

  const shareByEmail = () => {
    const subject = encodeURIComponent('منشور مشترك من منصة رسكلة');
    const body = encodeURIComponent(`${fullContent}\n\n${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const downloadAsImage = async () => {
    // Create a canvas with the content
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1080;
    canvas.height = 1080;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#10b981');
    gradient.addColorStop(1, '#059669');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // White card background
    ctx.fillStyle = 'white';
    ctx.roundRect(60, 60, canvas.width - 120, canvas.height - 120, 20);
    ctx.fill();

    // Text
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';

    // Word wrap
    const maxWidth = canvas.width - 180;
    const lineHeight = 48;
    const words = content.split(' ');
    let line = '';
    let y = 120;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, canvas.width - 90, y);
        line = words[n] + ' ';
        y += lineHeight;
        if (y > canvas.height - 200) break;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, canvas.width - 90, y);

    // Hashtags
    if (hashtags.length > 0) {
      ctx.fillStyle = '#10b981';
      ctx.font = '24px Arial';
      ctx.fillText(hashtags.map(h => `#${h}`).join(' '), canvas.width - 90, canvas.height - 160);
    }

    // Logo/Brand
    ctx.fillStyle = '#6b7280';
    ctx.font = '20px Arial';
    ctx.fillText('منصة رسكلة', canvas.width - 90, canvas.height - 100);

    // Download
    const link = document.createElement('a');
    link.download = `post-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    toast.success('تم تحميل الصورة');
  };

  if (variant === 'icon') {
    return (
      <Button variant="ghost" size="icon" onClick={handleNativeShare}>
        <Share2 className="h-4 w-4" />
      </Button>
    );
  }

  if (variant === 'button') {
    return (
      <Button variant="outline" size={size} onClick={handleNativeShare} className="gap-2">
        <Share2 className="h-4 w-4" />
        مشاركة
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size={size} className="gap-2">
            <Share2 className="h-4 w-4" />
            مشاركة
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={handleCopyContent} className="gap-2 flex-row-reverse">
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            نسخ المحتوى
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyLink} className="gap-2">
            <Link2 className="h-4 w-4" />
            نسخ الرابط
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={shareToTwitter} className="gap-2">
            <Twitter className="h-4 w-4 text-blue-400" />
            تويتر / X
            <ExternalLink className="h-3 w-3 mr-auto opacity-50" />
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareToFacebook} className="gap-2">
            <Facebook className="h-4 w-4 text-blue-600" />
            فيسبوك
            <ExternalLink className="h-3 w-3 mr-auto opacity-50" />
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareToLinkedIn} className="gap-2">
            <Linkedin className="h-4 w-4 text-blue-700" />
            لينكد إن
            <ExternalLink className="h-3 w-3 mr-auto opacity-50" />
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={shareToWhatsApp} className="gap-2">
            <MessageCircle className="h-4 w-4 text-green-500" />
            واتساب
            <ExternalLink className="h-3 w-3 mr-auto opacity-50" />
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareToTelegram} className="gap-2">
            <svg className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            تيليجرام
            <ExternalLink className="h-3 w-3 mr-auto opacity-50" />
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareByEmail} className="gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            البريد الإلكتروني
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={downloadAsImage} className="gap-2">
            <Download className="h-4 w-4 text-purple-500" />
            تحميل كصورة
          </DropdownMenuItem>
          
          {navigator.share && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleNativeShare} className="gap-2 font-medium">
                <Share2 className="h-4 w-4 text-primary" />
                المزيد من الخيارات...
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>مشاركة عبر QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="p-4 bg-white rounded-lg">
              <QrCode className="h-48 w-48 text-foreground" />
            </div>
            <div className="flex items-center gap-2 w-full">
              <Input value={shareUrl} readOnly className="flex-1" />
              <Button variant="outline" onClick={handleCopyLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PostShareActions;
