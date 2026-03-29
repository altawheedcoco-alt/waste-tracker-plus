import { memo, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Video, X, Loader2 } from 'lucide-react';
import { useReelActions } from '@/hooks/useReels';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MusicPicker from '@/components/media/MusicPicker';
import VideoUploadProgress, { UploadStage } from '@/components/upload/VideoUploadProgress';
import { ffmpegCompressVideo, isFFmpegSupported, generateThumbnail } from '@/utils/ffmpegCompress';
import { needsCompression } from '@/utils/quickVideoCompress';
import type { MusicTrack } from '@/lib/musicLibrary';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ReelUploadDialog = memo(({ open, onOpenChange }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [stage, setStage] = useState<UploadStage>('idle');
  const [progress, setProgress] = useState(0);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { createReel } = useReelActions();
  const { user, organization } = useAuth();
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('video/')) {
      toast({ title: 'يرجى اختيار ملف فيديو', variant: 'destructive' });
      return;
    }
    if (f.size > 100 * 1024 * 1024) {
      toast({ title: 'الحد الأقصى 100 ميجابايت', variant: 'destructive' });
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setOriginalSize(f.size);

    // توليد صورة مصغرة تلقائياً
    try {
      const thumb = await generateThumbnail(f);
      setThumbnailUrl(URL.createObjectURL(thumb));
    } catch {
      console.warn('لم يتم توليد صورة مصغرة');
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);
    setStage('idle');
    setProgress(0);

    try {
      let fileToUpload = file;

      // المرحلة 1: ضغط الفيديو
      if (needsCompression(file)) {
        setStage('compressing');
        if (isFFmpegSupported()) {
          const result = await ffmpegCompressVideo(file, {
            maxWidth: 1080,
            crf: 26,
            onProgress: (p) => setProgress(p * 0.5), // 0-50%
            onStage: (s) => { if (s === 'compressing') setStage('compressing'); },
          });
          fileToUpload = result.file;
          setCompressedSize(result.compressedSize);
        }
      }

      // المرحلة 2: رفع الفيديو
      setStage('uploading');
      const ext = fileToUpload.name.split('.').pop();
      const path = `reels/${user.id}/${Date.now()}.${ext}`;

      setProgress(55);
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(path, fileToUpload, { contentType: fileToUpload.type, upsert: false });

      if (uploadError) throw uploadError;
      setProgress(85);

      const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);

      // رفع الصورة المصغرة
      let thumbPublicUrl: string | undefined;
      if (thumbnailUrl) {
        try {
          const thumbBlob = await fetch(thumbnailUrl).then(r => r.blob());
          const thumbPath = `reels/${user.id}/${Date.now()}_thumb.jpg`;
          await supabase.storage.from('media').upload(thumbPath, thumbBlob, { contentType: 'image/jpeg' });
          const { data: tData } = supabase.storage.from('media').getPublicUrl(thumbPath);
          thumbPublicUrl = tData.publicUrl;
        } catch { /* thumbnail upload optional */ }
      }

      const tags = hashtags
        .split(/[,،\s#]+/)
        .map(t => t.trim())
        .filter(Boolean);

      await createReel.mutateAsync({
        video_url: urlData.publicUrl,
        caption: caption || undefined,
        hashtags: tags.length > 0 ? tags : undefined,
        organization_id: organization?.id || undefined,
      });

      setProgress(100);
      setStage('done');
      setTimeout(() => {
        resetForm();
        onOpenChange(false);
      }, 800);
    } catch (err: any) {
      setStage('error');
      toast({ title: 'خطأ في الرفع', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setThumbnailUrl(null);
    setCaption('');
    setHashtags('');
    setProgress(0);
    setStage('idle');
    setOriginalSize(0);
    setCompressedSize(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            نشر ريل جديد
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Video picker */}
          {!preview ? (
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full aspect-[9/16] max-h-[300px] rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 hover:border-primary/50 transition-colors bg-muted/30"
            >
              <Upload className="w-10 h-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">اختر فيديو (حتى 100MB)</p>
              {isFFmpegSupported() && (
                <p className="text-[10px] text-primary/70">⚡ ضغط H.264 تلقائي</p>
              )}
            </button>
          ) : (
            <div className="relative w-full aspect-[9/16] max-h-[300px] rounded-2xl overflow-hidden bg-black">
              <video src={preview} className="w-full h-full object-contain" controls />
              <button
                onClick={resetForm}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              {/* File info */}
              <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1 text-white text-[10px]">
                🎥 {(file!.size / 1024 / 1024).toFixed(1)} MB
              </div>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="اكتب وصفاً للريل..."
            className="resize-none"
            rows={2}
          />

          {/* Music Picker */}
          <MusicPicker selectedTrack={selectedMusic} onSelect={setSelectedMusic} />

          <Input
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            placeholder="هاشتاقات (مفصولة بفاصلة): بيئة، تدوير"
          />

          {/* 2-Phase Progress Bar */}
          <VideoUploadProgress
            stage={stage}
            progress={progress}
            originalSize={originalSize}
            compressedSize={compressedSize}
          />

          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading ? (
              <><Loader2 className="w-4 h-4 animate-spin ml-2" /> جاري النشر...</>
            ) : (
              'نشر الريل 🎬'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

ReelUploadDialog.displayName = 'ReelUploadDialog';
export default ReelUploadDialog;
