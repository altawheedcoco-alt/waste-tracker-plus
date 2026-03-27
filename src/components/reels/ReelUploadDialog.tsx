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
import type { MusicTrack } from '@/lib/musicLibrary';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ReelUploadDialog = memo(({ open, onOpenChange }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { createReel } = useReelActions();
  const { user, organization } = useAuth();
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);
    setProgress(20);

    try {
      const ext = file.name.split('.').pop();
      const path = `reels/${user.id}/${Date.now()}.${ext}`;

      setProgress(40);
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError) throw uploadError;
      setProgress(80);

      const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);

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
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'خطأ في الرفع', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setCaption('');
    setHashtags('');
    setProgress(0);
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

          <Input
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            placeholder="هاشتاقات (مفصولة بفاصلة): بيئة، تدوير"
          />

          {uploading && (
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
            </div>
          )}

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
