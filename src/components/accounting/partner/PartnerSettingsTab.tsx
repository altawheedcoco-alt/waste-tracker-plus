import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Settings, Save, DollarSign, Calendar, Percent } from "lucide-react";

interface PartnerSettingsTabProps {
  partnerId: string;
  partnerName: string;
  currentSettings?: {
    id?: string;
    credit_limit?: number;
    payment_terms_days?: number;
    discount_percentage?: number;
    tax_rate?: number;
    account_status?: string;
    billing_cycle?: string;
    auto_invoice?: boolean;
    notes?: string;
  } | null;
}

const PartnerSettingsTab = ({ partnerId, partnerName, currentSettings }: PartnerSettingsTabProps) => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    credit_limit: currentSettings?.credit_limit || 0,
    payment_terms_days: currentSettings?.payment_terms_days || 30,
    discount_percentage: currentSettings?.discount_percentage || 0,
    tax_rate: currentSettings?.tax_rate || 14,
    account_status: currentSettings?.account_status || "active",
    billing_cycle: currentSettings?.billing_cycle || "monthly",
    auto_invoice: currentSettings?.auto_invoice || false,
    notes: currentSettings?.notes || "",
  });

  useEffect(() => {
    if (currentSettings) {
      setFormData({
        credit_limit: currentSettings.credit_limit || 0,
        payment_terms_days: currentSettings.payment_terms_days || 30,
        discount_percentage: currentSettings.discount_percentage || 0,
        tax_rate: currentSettings.tax_rate || 14,
        account_status: currentSettings.account_status || "active",
        billing_cycle: currentSettings.billing_cycle || "monthly",
        auto_invoice: currentSettings.auto_invoice || false,
        notes: currentSettings.notes || "",
      });
    }
  }, [currentSettings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!organization?.id) throw new Error("No organization");

      const data = {
        organization_id: organization.id,
        partner_organization_id: partnerId,
        ...formData,
      };

      if (currentSettings?.id) {
        const { error } = await supabase
          .from("partner_account_settings")
          .update(data)
          .eq("id", currentSettings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("partner_account_settings")
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-account-settings"] });
      toast.success("تم حفظ الإعدادات بنجاح");
    },
    onError: (error) => {
      toast.error("فشل في حفظ الإعدادات: " + error.message);
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            إعدادات حساب {partnerName}
          </CardTitle>
          <CardDescription>
            تخصيص إعدادات الحساب والفوترة لهذا الشريك
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Financial Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                حد الائتمان
              </Label>
              <Input
                type="number"
                value={formData.credit_limit}
                onChange={(e) => setFormData({ ...formData, credit_limit: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                الحد الأقصى للمبالغ المستحقة قبل إيقاف الخدمة
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                مدة السداد (بالأيام)
              </Label>
              <Input
                type="number"
                value={formData.payment_terms_days}
                onChange={(e) => setFormData({ ...formData, payment_terms_days: parseInt(e.target.value) || 30 })}
                placeholder="30"
              />
              <p className="text-xs text-muted-foreground">
                عدد الأيام المسموحة للسداد بعد إصدار الفاتورة
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Percent className="h-4 w-4" />
                نسبة الخصم (%)
              </Label>
              <Input
                type="number"
                value={formData.discount_percentage}
                onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                min="0"
                max="100"
              />
              <p className="text-xs text-muted-foreground">
                نسبة الخصم التلقائية على الفواتير
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Percent className="h-4 w-4" />
                نسبة الضريبة (%)
              </Label>
              <Input
                type="number"
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 14 })}
                placeholder="14"
                min="0"
                max="100"
              />
              <p className="text-xs text-muted-foreground">
                نسبة ضريبة القيمة المضافة
              </p>
            </div>

            <div className="space-y-2">
              <Label>حالة الحساب</Label>
              <Select
                value={formData.account_status}
                onValueChange={(value) => setFormData({ ...formData, account_status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="suspended">موقوف</SelectItem>
                  <SelectItem value="closed">مغلق</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                حالة الحساب الحالية
              </p>
            </div>

            <div className="space-y-2">
              <Label>دورة الفوترة</Label>
              <Select
                value={formData.billing_cycle}
                onValueChange={(value) => setFormData({ ...formData, billing_cycle: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_shipment">لكل شحنة</SelectItem>
                  <SelectItem value="weekly">أسبوعية</SelectItem>
                  <SelectItem value="biweekly">نصف شهرية</SelectItem>
                  <SelectItem value="monthly">شهرية</SelectItem>
                  <SelectItem value="quarterly">ربع سنوية</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                تكرار إصدار الفواتير
              </p>
            </div>
          </div>

          {/* Auto Invoice Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>الفوترة التلقائية</Label>
              <p className="text-sm text-muted-foreground">
                إنشاء فواتير تلقائية عند تأكيد الشحنات
              </p>
            </div>
            <Switch
              checked={formData.auto_invoice}
              onCheckedChange={(checked) => setFormData({ ...formData, auto_invoice: checked })}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="أي ملاحظات خاصة بهذا الشريك..."
              rows={3}
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              <Save className="h-4 w-4 ml-2" />
              حفظ الإعدادات
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnerSettingsTab;
