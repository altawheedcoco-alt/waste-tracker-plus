import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationSignatures, OrganizationSignature, OrganizationStamp } from '@/hooks/useOrganizationSignatures';
import {
  PenTool,
  Stamp,
  Plus,
  Trash2,
  Star,
  StarOff,
  Upload,
  Loader2,
  Edit2,
  Eye,
  Calendar,
  User,
  Phone,
  Mail,
  CreditCard,
  Building2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

const SignaturesStampsManager = () => {
  const {
    signatures,
    stamps,
    loading,
    addSignature,
    updateSignature,
    deleteSignature,
    setPrimarySignature,
    addStamp,
    updateStamp,
    deleteStamp,
    setPrimaryStamp,
    refetch,
  } = useOrganizationSignatures();

  const [activeTab, setActiveTab] = useState('signatures');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'signature' | 'stamp'>('signature');
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state for signature
  const [signatureForm, setSignatureForm] = useState({
    signature_name: '',
    signature_name_en: '',
    signer_name: '',
    signer_position: '',
    signer_national_id: '',
    signer_phone: '',
    signer_email: '',
    signature_image_url: '',
    is_primary: false,
    is_active: true,
    valid_from: '',
    valid_until: '',
  });

  // Form state for stamp
  const [stampForm, setStampForm] = useState({
    stamp_name: '',
    stamp_name_en: '',
    stamp_type: 'official',
    stamp_image_url: '',
    is_primary: false,
    is_active: true,
    valid_from: '',
    valid_until: '',
    department: '',
    branch: '',
  });

  const handleOpenAddDialog = (type: 'signature' | 'stamp') => {
    setDialogType(type);
    setPreviewUrl(null);
    if (type === 'signature') {
      setSignatureForm({
        signature_name: '',
        signature_name_en: '',
        signer_name: '',
        signer_position: '',
        signer_national_id: '',
        signer_phone: '',
        signer_email: '',
        signature_image_url: '',
        is_primary: false,
        is_active: true,
        valid_from: '',
        valid_until: '',
      });
    } else {
      setStampForm({
        stamp_name: '',
        stamp_name_en: '',
        stamp_type: 'official',
        stamp_image_url: '',
        is_primary: false,
        is_active: true,
        valid_from: '',
        valid_until: '',
        department: '',
        branch: '',
      });
    }
    setShowAddDialog(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('يجب اختيار ملف صورة');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const folderPath = dialogType === 'signature' ? 'signatures' : 'stamps';
      const filePath = `${folderPath}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('organization-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from('organization-documents')
        .getPublicUrl(filePath);

      const url = publicUrl.publicUrl;
      setPreviewUrl(url);

      if (dialogType === 'signature') {
        setSignatureForm(prev => ({ ...prev, signature_image_url: url }));
      } else {
        setStampForm(prev => ({ ...prev, stamp_image_url: url }));
      }

      toast.success('تم رفع الصورة بنجاح');
    } catch (err: any) {
      console.error('Error uploading file:', err);
      toast.error('فشل في رفع الصورة');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (dialogType === 'signature') {
      if (!signatureForm.signature_name || !signatureForm.signer_name || !signatureForm.signature_image_url) {
        toast.error('يرجى ملء الحقول المطلوبة');
        return;
      }
      await addSignature(signatureForm);
    } else {
      if (!stampForm.stamp_name || !stampForm.stamp_image_url) {
        toast.error('يرجى ملء الحقول المطلوبة');
        return;
      }
      await addStamp(stampForm);
    }
    setShowAddDialog(false);
  };

  const handleDeleteSignature = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا التوقيع؟')) {
      await deleteSignature(id);
    }
  };

  const handleDeleteStamp = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الختم؟')) {
      await deleteStamp(id);
    }
  };

  const handleToggleActive = async (type: 'signature' | 'stamp', id: string, currentState: boolean) => {
    if (type === 'signature') {
      await updateSignature(id, { is_active: !currentState });
    } else {
      await updateStamp(id, { is_active: !currentState });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenTool className="w-5 h-5" />
          إدارة التوقيعات والأختام
        </CardTitle>
        <CardDescription>
          إدارة التوقيعات والأختام الإلكترونية للمؤسسة
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="signatures" className="gap-2">
              <PenTool className="w-4 h-4" />
              التوقيعات ({signatures.length})
            </TabsTrigger>
            <TabsTrigger value="stamps" className="gap-2">
              <Stamp className="w-4 h-4" />
              الأختام ({stamps.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signatures" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => handleOpenAddDialog('signature')} className="gap-2">
                <Plus className="w-4 h-4" />
                إضافة توقيع جديد
              </Button>
            </div>

            {signatures.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <PenTool className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد توقيعات مسجلة</p>
                <p className="text-sm">أضف توقيعات المفوضين بالتوقيع</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {signatures.map((sig) => (
                  <Card key={sig.id} className={`relative ${!sig.is_active ? 'opacity-60' : ''}`}>
                    {sig.is_primary && (
                      <Badge className="absolute top-2 left-2 gap-1" variant="default">
                        <Star className="w-3 h-3" />
                        أساسي
                      </Badge>
                    )}
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-24 h-16 border rounded flex items-center justify-center bg-muted/50 overflow-hidden">
                          {sig.signature_image_url ? (
                            <img 
                              src={sig.signature_image_url} 
                              alt={sig.signature_name} 
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <PenTool className="w-8 h-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{sig.signature_name}</h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {sig.signer_name}
                          </p>
                          {sig.signer_position && (
                            <p className="text-xs text-muted-foreground">{sig.signer_position}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {sig.is_active ? (
                              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                <CheckCircle2 className="w-3 h-3 ml-1" />
                                نشط
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                                <XCircle className="w-3 h-3 ml-1" />
                                غير نشط
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={sig.is_active}
                            onCheckedChange={() => handleToggleActive('signature', sig.id, sig.is_active)}
                          />
                          <span className="text-xs text-muted-foreground">تفعيل</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {!sig.is_primary && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPrimarySignature(sig.id)}
                              title="تعيين كأساسي"
                            >
                              <StarOff className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSignature(sig.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="stamps" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => handleOpenAddDialog('stamp')} className="gap-2">
                <Plus className="w-4 h-4" />
                إضافة ختم جديد
              </Button>
            </div>

            {stamps.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Stamp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد أختام مسجلة</p>
                <p className="text-sm">أضف أختام المؤسسة الرسمية</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {stamps.map((stamp) => (
                  <Card key={stamp.id} className={`relative ${!stamp.is_active ? 'opacity-60' : ''}`}>
                    {stamp.is_primary && (
                      <Badge className="absolute top-2 left-2 gap-1" variant="default">
                        <Star className="w-3 h-3" />
                        أساسي
                      </Badge>
                    )}
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-20 h-20 border rounded-full flex items-center justify-center bg-muted/50 overflow-hidden">
                          {stamp.stamp_image_url ? (
                            <img 
                              src={stamp.stamp_image_url} 
                              alt={stamp.stamp_name} 
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <Stamp className="w-8 h-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{stamp.stamp_name}</h4>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {stamp.stamp_type === 'official' ? 'رسمي' : 
                             stamp.stamp_type === 'department' ? 'قسم' : 'فرع'}
                          </Badge>
                          {stamp.department && (
                            <p className="text-xs text-muted-foreground mt-1">
                              <Building2 className="w-3 h-3 inline ml-1" />
                              {stamp.department}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {stamp.is_active ? (
                              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                <CheckCircle2 className="w-3 h-3 ml-1" />
                                نشط
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                                <XCircle className="w-3 h-3 ml-1" />
                                غير نشط
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={stamp.is_active}
                            onCheckedChange={() => handleToggleActive('stamp', stamp.id, stamp.is_active)}
                          />
                          <span className="text-xs text-muted-foreground">تفعيل</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {!stamp.is_primary && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPrimaryStamp(stamp.id)}
                              title="تعيين كأساسي"
                            >
                              <StarOff className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteStamp(stamp.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Add Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {dialogType === 'signature' ? (
                  <>
                    <PenTool className="w-5 h-5" />
                    إضافة توقيع جديد
                  </>
                ) : (
                  <>
                    <Stamp className="w-5 h-5" />
                    إضافة ختم جديد
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {dialogType === 'signature' 
                  ? 'أضف توقيع مفوض جديد للمؤسسة'
                  : 'أضف ختم رسمي جديد للمؤسسة'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>صورة {dialogType === 'signature' ? 'التوقيع' : 'الختم'} *</Label>
                <div className="flex items-center gap-4">
                  <div className={`${dialogType === 'stamp' ? 'w-24 h-24 rounded-full' : 'w-32 h-20 rounded'} border-2 border-dashed flex items-center justify-center bg-muted/30 overflow-hidden`}>
                    {previewUrl || (dialogType === 'signature' ? signatureForm.signature_image_url : stampForm.stamp_image_url) ? (
                      <img 
                        src={previewUrl || (dialogType === 'signature' ? signatureForm.signature_image_url : stampForm.stamp_image_url)} 
                        alt="Preview" 
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : dialogType === 'signature' ? (
                      <PenTool className="w-8 h-8 text-muted-foreground" />
                    ) : (
                      <Stamp className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="gap-2"
                    >
                      {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      رفع صورة
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG بخلفية شفافة للأفضل
                    </p>
                  </div>
                </div>
              </div>

              {dialogType === 'signature' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signature_name">اسم التوقيع *</Label>
                      <Input
                        id="signature_name"
                        value={signatureForm.signature_name}
                        onChange={(e) => setSignatureForm(prev => ({ ...prev, signature_name: e.target.value }))}
                        placeholder="مثال: توقيع المدير العام"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signer_name">اسم الموقع *</Label>
                      <Input
                        id="signer_name"
                        value={signatureForm.signer_name}
                        onChange={(e) => setSignatureForm(prev => ({ ...prev, signer_name: e.target.value }))}
                        placeholder="الاسم الكامل"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signer_position">المنصب</Label>
                      <Input
                        id="signer_position"
                        value={signatureForm.signer_position}
                        onChange={(e) => setSignatureForm(prev => ({ ...prev, signer_position: e.target.value }))}
                        placeholder="مثال: المدير العام"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signer_national_id">رقم الهوية</Label>
                      <Input
                        id="signer_national_id"
                        value={signatureForm.signer_national_id}
                        onChange={(e) => setSignatureForm(prev => ({ ...prev, signer_national_id: e.target.value }))}
                        placeholder="الرقم القومي"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signer_phone">الهاتف</Label>
                      <Input
                        id="signer_phone"
                        value={signatureForm.signer_phone}
                        onChange={(e) => setSignatureForm(prev => ({ ...prev, signer_phone: e.target.value }))}
                        placeholder="رقم الهاتف"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signer_email">البريد الإلكتروني</Label>
                      <Input
                        id="signer_email"
                        value={signatureForm.signer_email}
                        onChange={(e) => setSignatureForm(prev => ({ ...prev, signer_email: e.target.value }))}
                        placeholder="البريد الإلكتروني"
                        type="email"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stamp_name">اسم الختم *</Label>
                      <Input
                        id="stamp_name"
                        value={stampForm.stamp_name}
                        onChange={(e) => setStampForm(prev => ({ ...prev, stamp_name: e.target.value }))}
                        placeholder="مثال: الختم الرسمي"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stamp_type">نوع الختم</Label>
                      <Select
                        value={stampForm.stamp_type}
                        onValueChange={(val) => setStampForm(prev => ({ ...prev, stamp_type: val }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="official">رسمي</SelectItem>
                          <SelectItem value="department">قسم</SelectItem>
                          <SelectItem value="branch">فرع</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="department">القسم</Label>
                      <Input
                        id="department"
                        value={stampForm.department}
                        onChange={(e) => setStampForm(prev => ({ ...prev, department: e.target.value }))}
                        placeholder="اسم القسم"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="branch">الفرع</Label>
                      <Input
                        id="branch"
                        value={stampForm.branch}
                        onChange={(e) => setStampForm(prev => ({ ...prev, branch: e.target.value }))}
                        placeholder="اسم الفرع"
                      />
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={dialogType === 'signature' ? signatureForm.is_primary : stampForm.is_primary}
                    onCheckedChange={(checked) => {
                      if (dialogType === 'signature') {
                        setSignatureForm(prev => ({ ...prev, is_primary: checked }));
                      } else {
                        setStampForm(prev => ({ ...prev, is_primary: checked }));
                      }
                    }}
                  />
                  <Label>تعيين كـ {dialogType === 'signature' ? 'توقيع' : 'ختم'} أساسي</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSave} disabled={uploading}>
                حفظ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default SignaturesStampsManager;
