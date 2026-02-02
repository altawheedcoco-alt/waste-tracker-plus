import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Customer, CustomerFormData } from "@/hooks/useCustomers";
import { Loader2, User } from "lucide-react";

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  isLoading?: boolean;
}

const initialFormData: CustomerFormData = {
  name: "",
  email: null,
  phone: null,
  company: null,
  address: null,
  city: null,
  status: "lead",
  source: null,
  notes: null,
  total_purchases: 0,
  last_contact_date: null,
};

export const CustomerDialog = ({
  open,
  onOpenChange,
  customer,
  onSubmit,
  isLoading,
}: CustomerDialogProps) => {
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        company: customer.company,
        address: customer.address,
        city: customer.city,
        status: customer.status,
        source: customer.source,
        notes: customer.notes,
        total_purchases: customer.total_purchases,
        last_contact_date: customer.last_contact_date,
      });
    } else {
      setFormData(initialFormData);
    }
  }, [customer, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {customer ? "تعديل العميل" : "إضافة عميل جديد"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-2">
              <Label>الاسم *</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="اسم العميل"
              />
            </div>

            {/* Company */}
            <div className="space-y-2">
              <Label>الشركة</Label>
              <Input
                value={formData.company || ""}
                onChange={(e) => setFormData({ ...formData, company: e.target.value || null })}
                placeholder="اسم الشركة"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input
                type="email"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value || null })}
                placeholder="email@example.com"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label>الهاتف</Label>
              <Input
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value || null })}
                placeholder="رقم الهاتف"
              />
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label>المدينة</Label>
              <Input
                value={formData.city || ""}
                onChange={(e) => setFormData({ ...formData, city: e.target.value || null })}
                placeholder="المدينة"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">عميل محتمل</SelectItem>
                  <SelectItem value="prospect">مهتم</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Source */}
            <div className="space-y-2">
              <Label>المصدر</Label>
              <Input
                value={formData.source || ""}
                onChange={(e) => setFormData({ ...formData, source: e.target.value || null })}
                placeholder="كيف عرف عنك؟"
              />
            </div>

            {/* Total Purchases */}
            <div className="space-y-2">
              <Label>إجمالي المشتريات</Label>
              <Input
                type="number"
                value={formData.total_purchases}
                onChange={(e) => setFormData({ ...formData, total_purchases: Number(e.target.value) })}
                placeholder="0"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label>العنوان</Label>
            <Input
              value={formData.address || ""}
              onChange={(e) => setFormData({ ...formData, address: e.target.value || null })}
              placeholder="العنوان الكامل"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
              placeholder="ملاحظات إضافية..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              {customer ? "تحديث" : "إضافة"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
