import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Factory, Recycle, Loader2, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CreateExternalPartnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: 'generator' | 'recycler' | 'guest';
}

export default function CreateExternalPartnerDialog({
  open,
  onOpenChange,
  defaultType = 'generator',
}: CreateExternalPartnerDialogProps) {
  const { organization, profile } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<{
    name: string;
    partner_type: 'generator' | 'recycler' | 'guest';
    phone: string;
    email: string;
    address: string;
    city: string;
    tax_number: string;
    commercial_register: string;
    notes: string;
  }>({
    name: '',
    partner_type: defaultType,
    phone: '',
    email: '',
    address: '',
    city: '',
    tax_number: '',
    commercial_register: '',
    notes: '',
  });

  const createPartnerMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!organization?.id) throw new Error('لا يوجد منظمة');
      
      const { data: result, error } = await supabase
        .from('external_partners')
        .insert({
          organization_id: organization.id,
          name: data.name,
          partner_type: data.partner_type,
          phone: data.phone || null,
          email: data.email || null,
          address: data.address || null,
          city: data.city || null,
          tax_number: data.tax_number || null,
          commercial_register: data.commercial_register || null,
          notes: data.notes || null,
          created_by: profile?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success('تم إنشاء حساب العميل بنجاح');
      queryClient.invalidateQueries({ queryKey: ['partner-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['external-partners'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      console.error('Error creating external partner:', error);
      toast.error('حدث خطأ أثناء إنشاء الحساب');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      partner_type: defaultType,
      phone: '',
      email: '',
      address: '',
      city: '',
      tax_number: '',
      commercial_register: '',
      notes: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('يرجى إدخال اسم العميل');
      return;
    }
    createPartnerMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            إنشاء حساب عميل خارجي
          </DialogTitle>
          <DialogDescription>
            أضف عميل جديد غير مسجل في النظام لتتبع حساباته المالية
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Partner Type */}
          <div className="space-y-2">
            <Label>نوع العميل *</Label>
            <Select
              value={formData.partner_type}
              onValueChange={(value: 'generator' | 'recycler' | 'guest') =>
                setFormData({ ...formData, partner_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="generator">
                  <div className="flex items-center gap-2">
                    <Factory className="h-4 w-4 text-amber-600" />
                    مولد (جهة مولدة للنفايات)
                  </div>
                </SelectItem>
                <SelectItem value="recycler">
                  <div className="flex items-center gap-2">
                    <Recycle className="h-4 w-4 text-green-600" />
                    مدور (جهة إعادة تدوير)
                  </div>
                </SelectItem>
                <SelectItem value="guest">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-purple-600" />
                    عميل خارجي (ضيف)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">اسم العميل / الشركة *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="أدخل اسم العميل أو الشركة"
              required
            />
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="01xxxxxxxxx"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                dir="ltr"
              />
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">المدينة</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="القاهرة"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">العنوان</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="العنوان التفصيلي"
              />
            </div>
          </div>

          {/* Business Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tax_number">الرقم الضريبي</Label>
              <Input
                id="tax_number"
                value={formData.tax_number}
                onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                placeholder="رقم التسجيل الضريبي"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commercial_register">السجل التجاري</Label>
              <Input
                id="commercial_register"
                value={formData.commercial_register}
                onChange={(e) => setFormData({ ...formData, commercial_register: e.target.value })}
                placeholder="رقم السجل التجاري"
                dir="ltr"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="أي ملاحظات إضافية..."
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={createPartnerMutation.isPending}>
              {createPartnerMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 ml-2" />
                  إنشاء الحساب
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
