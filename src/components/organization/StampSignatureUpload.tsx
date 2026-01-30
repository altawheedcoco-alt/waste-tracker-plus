import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Upload, Trash2, Loader2, Stamp, PenTool, Eye, Image as ImageIcon } from 'lucide-react';

interface StampSignatureUploadProps {
  organizationId: string;
  stampUrl: string | null;
  signatureUrl: string | null;
  onUpdate: () => void;
  disabled?: boolean;
}

const StampSignatureUpload = ({
  organizationId,
  stampUrl,
  signatureUrl,
  onUpdate,
  disabled = false,
}: StampSignatureUploadProps) => {
  const [uploadingStamp, setUploadingStamp] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [deletingStamp, setDeletingStamp] = useState(false);
  const [deletingSignature, setDeletingSignature] = useState(false);
  
  const stampInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (
    file: File,
    type: 'stamp' | 'signature',
    setLoading: (loading: boolean) => void
  ) => {
    if (!organizationId) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('نوع الملف غير مدعوم. يرجى رفع صورة (JPG, PNG, WebP, SVG)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت.');
      return;
    }

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}_${Date.now()}.${fileExt}`;
      const filePath = `${organizationId}/${fileName}`;

      // Delete old file if exists
      const oldUrl = type === 'stamp' ? stampUrl : signatureUrl;
      if (oldUrl) {
        const oldPath = oldUrl.split('/organization-stamps/')[1];
        if (oldPath) {
          await supabase.storage.from('organization-stamps').remove([oldPath]);
        }
      }

      // Upload new file
      const { error: uploadError } = await supabase.storage
        .from('organization-stamps')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('organization-stamps')
        .getPublicUrl(filePath);

      // Update organization record
      const updateField = type === 'stamp' ? 'stamp_url' : 'signature_url';
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ [updateField]: urlData.publicUrl })
        .eq('id', organizationId);

      if (updateError) throw updateError;

      toast.success(type === 'stamp' ? 'تم رفع الختم بنجاح' : 'تم رفع التوقيع بنجاح');
      onUpdate();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('حدث خطأ في رفع الملف');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (
    type: 'stamp' | 'signature',
    setLoading: (loading: boolean) => void
  ) => {
    if (!organizationId) return;

    const url = type === 'stamp' ? stampUrl : signatureUrl;
    if (!url) return;

    setLoading(true);
    try {
      // Extract file path from URL
      const filePath = url.split('/organization-stamps/')[1];
      if (filePath) {
        await supabase.storage.from('organization-stamps').remove([filePath]);
      }

      // Clear URL in database
      const updateField = type === 'stamp' ? 'stamp_url' : 'signature_url';
      const { error } = await supabase
        .from('organizations')
        .update({ [updateField]: null })
        .eq('id', organizationId);

      if (error) throw error;

      toast.success(type === 'stamp' ? 'تم حذف الختم' : 'تم حذف التوقيع');
      onUpdate();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('حدث خطأ في حذف الملف');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'stamp' | 'signature',
    setLoading: (loading: boolean) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file, type, setLoading);
    }
    // Reset input
    e.target.value = '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stamp className="w-5 h-5" />
          الختم والتوقيع
        </CardTitle>
        <CardDescription>
          ارفع ختم وتوقيع الجهة ليظهرا على وثائق الشحنات
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stamp Upload */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Stamp className="w-4 h-4" />
              ختم الجهة
            </Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              {stampUrl ? (
                <div className="space-y-3">
                  <div className="w-32 h-32 mx-auto bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                    <img
                      src={stampUrl}
                      alt="ختم الجهة"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(stampUrl, '_blank')}
                      className="gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      عرض
                    </Button>
                    {!disabled && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => stampInputRef.current?.click()}
                          disabled={uploadingStamp}
                          className="gap-1"
                        >
                          {uploadingStamp ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          تغيير
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete('stamp', setDeletingStamp)}
                          disabled={deletingStamp}
                          className="gap-1"
                        >
                          {deletingStamp ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          حذف
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 py-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">لم يتم رفع ختم بعد</p>
                  {!disabled && (
                    <Button
                      variant="outline"
                      onClick={() => stampInputRef.current?.click()}
                      disabled={uploadingStamp}
                      className="gap-2"
                    >
                      {uploadingStamp ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      رفع الختم
                    </Button>
                  )}
                </div>
              )}
            </div>
            <input
              ref={stampInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              onChange={(e) => handleFileChange(e, 'stamp', setUploadingStamp)}
              className="hidden"
            />
          </div>

          {/* Signature Upload */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <PenTool className="w-4 h-4" />
              توقيع الجهة
            </Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              {signatureUrl ? (
                <div className="space-y-3">
                  <div className="w-32 h-32 mx-auto bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                    <img
                      src={signatureUrl}
                      alt="توقيع الجهة"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(signatureUrl, '_blank')}
                      className="gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      عرض
                    </Button>
                    {!disabled && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => signatureInputRef.current?.click()}
                          disabled={uploadingSignature}
                          className="gap-1"
                        >
                          {uploadingSignature ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          تغيير
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete('signature', setDeletingSignature)}
                          disabled={deletingSignature}
                          className="gap-1"
                        >
                          {deletingSignature ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          حذف
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 py-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
                    <PenTool className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">لم يتم رفع توقيع بعد</p>
                  {!disabled && (
                    <Button
                      variant="outline"
                      onClick={() => signatureInputRef.current?.click()}
                      disabled={uploadingSignature}
                      className="gap-2"
                    >
                      {uploadingSignature ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      رفع التوقيع
                    </Button>
                  )}
                </div>
              )}
            </div>
            <input
              ref={signatureInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              onChange={(e) => handleFileChange(e, 'signature', setUploadingSignature)}
              className="hidden"
            />
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
          <p className="font-medium mb-2">ملاحظات:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>الصيغ المدعومة: JPG، PNG، WebP، SVG</li>
            <li>الحد الأقصى لحجم الملف: 5 ميجابايت</li>
            <li>يُفضل استخدام صور بخلفية شفافة (PNG أو SVG)</li>
            <li>سيظهر الختم والتوقيع في وثائق الشحنات المطبوعة</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default StampSignatureUpload;
