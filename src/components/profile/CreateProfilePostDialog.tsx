import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import {
  MessageSquare,
  Image as ImageIcon,
  Video,
  Link as LinkIcon,
  Upload,
  Loader2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateProfilePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId?: string;
  onSuccess?: () => void;
}

const contentTypes = [
  { value: 'text', label: 'نص', icon: MessageSquare, color: 'text-blue-600' },
  { value: 'image', label: 'صورة', icon: ImageIcon, color: 'text-green-600' },
  { value: 'video', label: 'فيديو', icon: Video, color: 'text-purple-600' },
  { value: 'link', label: 'رابط', icon: LinkIcon, color: 'text-amber-600' },
];

export default function CreateProfilePostDialog({
  open,
  onOpenChange,
  organizationId,
  onSuccess,
}: CreateProfilePostDialogProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [contentType, setContentType] = useState<'text' | 'image' | 'video' | 'link'>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const resetForm = () => {
    setContentType('text');
    setTitle('');
    setContent('');
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (contentType === 'image' && !isImage) {
      toast.error('يرجى اختيار ملف صورة');
      return;
    }

    if (contentType === 'video' && !isVideo) {
      toast.error('يرجى اختيار ملف فيديو');
      return;
    }

    // Validate file size (50MB for video, 10MB for image)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`حجم الملف كبير جداً. الحد الأقصى ${isVideo ? '50' : '10'} ميجابايت`);
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!user) return;

    // Validation
    if (contentType === 'text' && !content.trim()) {
      toast.error('يرجى إدخال محتوى النص');
      return;
    }

    if (contentType === 'link' && !content.trim()) {
      toast.error('يرجى إدخال الرابط');
      return;
    }

    if ((contentType === 'image' || contentType === 'video') && !selectedFile) {
      toast.error(`يرجى اختيار ${contentType === 'image' ? 'صورة' : 'فيديو'}`);
      return;
    }

    setUploading(true);

    try {
      let mediaUrl: string | null = null;

      // Upload media file if exists
      if (selectedFile) {
        const { uploadFile } = await import('@/utils/optimizedUpload');
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const result = await uploadFile(selectedFile, {
          bucket: 'profile-media',
          path: fileName,
        });

        mediaUrl = result.publicUrl;
      }

      // Create post
      const { error: insertError } = await supabase
        .from('profile_posts')
        .insert({
          user_id: user.id,
          organization_id: organizationId || null,
          content_type: contentType,
          content: contentType === 'text' || contentType === 'link' ? content : null,
          media_url: mediaUrl,
          title: title.trim() || null,
        });

      if (insertError) throw insertError;

      toast.success('تم نشر المنشور بنجاح');
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast.error('فشل في نشر المنشور: ' + (error.message || 'خطأ غير معروف'));
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            إنشاء منشور جديد
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Content Type Selection */}
          <div className="space-y-3">
            <Label>نوع المحتوى</Label>
            <RadioGroup
              value={contentType}
              onValueChange={(value) => {
                setContentType(value as typeof contentType);
                setSelectedFile(null);
                setPreviewUrl(null);
                setContent('');
              }}
              className="grid grid-cols-4 gap-2"
            >
              {contentTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = contentType === type.value;
                return (
                  <Label
                    key={type.value}
                    htmlFor={type.value}
                    className={cn(
                      'flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all',
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <RadioGroupItem
                      value={type.value}
                      id={type.value}
                      className="sr-only"
                    />
                    <Icon className={cn('h-6 w-6 mb-1', isSelected ? 'text-primary' : type.color)} />
                    <span className="text-xs font-medium">{type.label}</span>
                  </Label>
                );
              })}
            </RadioGroup>
          </div>

          {/* Title (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="title">العنوان (اختياري)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="أضف عنوان للمنشور..."
              disabled={uploading}
            />
          </div>

          {/* Content based on type */}
          {contentType === 'text' && (
            <div className="space-y-2">
              <Label htmlFor="content">المحتوى</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="اكتب محتوى المنشور..."
                rows={5}
                disabled={uploading}
              />
            </div>
          )}

          {contentType === 'link' && (
            <div className="space-y-2">
              <Label htmlFor="link">الرابط</Label>
              <Input
                id="link"
                type="url"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="https://..."
                dir="ltr"
                disabled={uploading}
              />
            </div>
          )}

          {(contentType === 'image' || contentType === 'video') && (
            <div className="space-y-2">
              <Label>
                {contentType === 'image' ? 'الصورة' : 'الفيديو'}
              </Label>
              
              {!previewUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <Upload className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    اضغط لاختيار {contentType === 'image' ? 'صورة' : 'فيديو'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    الحد الأقصى: {contentType === 'video' ? '50' : '10'} ميجابايت
                  </p>
                </div>
              ) : (
                <div className="relative rounded-lg overflow-hidden border">
                  {contentType === 'image' ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-[200px] w-full object-contain"
                    />
                  ) : (
                    <video
                      src={previewUrl}
                      controls
                      playsInline
                      preload="metadata"
                      className="max-h-[200px] w-full"
                    />
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 left-2"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept={contentType === 'image' ? 'image/*' : 'video/*'}
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={uploading} className="gap-2">
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري النشر...
              </>
            ) : (
              'نشر'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
