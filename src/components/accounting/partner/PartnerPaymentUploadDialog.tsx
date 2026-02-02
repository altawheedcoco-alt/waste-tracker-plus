import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import {
  Loader2,
  Upload,
  Image as ImageIcon,
  X,
  ArrowDownRight,
  ArrowUpRight,
  Receipt,
  Sparkles,
  ScanLine,
} from "lucide-react";

interface PartnerPaymentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string;
  partnerName: string;
}

const PartnerPaymentUploadDialog = ({
  open,
  onOpenChange,
  partnerId,
  partnerName,
}: PartnerPaymentUploadDialogProps) => {
  const { organization, user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [extractionConfidence, setExtractionConfidence] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    payment_type: "outgoing" as "incoming" | "outgoing",
    amount: 0,
    payment_method: "bank_transfer" as "cash" | "bank_transfer" | "check" | "card" | "other",
    payment_date: new Date().toISOString().split("T")[0],
    reference_number: "",
    bank_name: "",
    bank_branch: "",
    account_number: "",
    depositor_name: "",
    check_number: "",
    notes: "",
  });

  // Extract receipt data using AI
  const extractReceiptData = async (base64Image: string) => {
    setIsExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-receipt-data', {
        body: { imageBase64: base64Image }
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        const extracted = data.data;
        setFormData(prev => ({
          ...prev,
          amount: extracted.amount || prev.amount,
          payment_date: extracted.payment_date || prev.payment_date,
          bank_name: extracted.bank_name || prev.bank_name,
          bank_branch: extracted.bank_branch || prev.bank_branch,
          account_number: extracted.account_number || prev.account_number,
          depositor_name: extracted.depositor_name || prev.depositor_name,
          reference_number: extracted.reference_number || prev.reference_number,
          check_number: extracted.check_number || prev.check_number,
          payment_method: extracted.payment_method || prev.payment_method,
          notes: extracted.notes ? `${prev.notes}\n${extracted.notes}`.trim() : prev.notes,
        }));
        setExtractionConfidence(extracted.confidence || 0);
        
        if (extracted.confidence > 0.7) {
          toast.success("تم قراءة الإيصال بنجاح", {
            description: `الثقة: ${Math.round(extracted.confidence * 100)}%`
          });
        } else if (extracted.confidence > 0.4) {
          toast.warning("تم قراءة الإيصال جزئياً", {
            description: "يرجى مراجعة البيانات المستخرجة"
          });
        } else {
          toast.info("تعذر قراءة الإيصال بشكل كامل", {
            description: "يرجى إدخال البيانات يدوياً"
          });
        }
      }
    } catch (error: any) {
      console.error('Extraction error:', error);
      toast.error("فشل في قراءة الإيصال");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("يرجى اختيار صورة فقط");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("حجم الصورة يجب أن يكون أقل من 5 ميجابايت");
        return;
      }
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string;
        setReceiptPreview(base64);
        // Auto-extract data from receipt
        await extractReceiptData(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadReceipt = async (): Promise<string | null> => {
    if (!receiptFile || !organization?.id) return null;

    const fileExt = receiptFile.name.split(".").pop();
    const fileName = `${organization.id}/${partnerId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("payment-receipts")
      .upload(fileName, receiptFile);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from("payment-receipts")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!organization?.id || !user?.id) throw new Error("Not authenticated");

      setIsUploading(true);

      // Upload receipt if exists
      let receiptUrl: string | null = null;
      if (receiptFile) {
        receiptUrl = await uploadReceipt();
      }

      // Generate payment number
      const paymentNumber = `PAY-${Date.now().toString(36).toUpperCase()}`;

      // Create payment record
      const { error } = await supabase.from("payments").insert([{
        payment_number: paymentNumber,
        organization_id: organization.id,
        partner_organization_id: partnerId,
        partner_name: partnerName,
        payment_type: formData.payment_type,
        amount: formData.amount,
        payment_method: formData.payment_method,
        payment_date: formData.payment_date,
        reference_number: formData.reference_number || null,
        bank_name: formData.bank_name || null,
        check_number: formData.check_number || null,
        notes: formData.notes || null,
        receipt_url: receiptUrl,
        status: "completed",
        currency: "EGP",
        created_by: user.id,
      }]);

      if (error) throw error;

      // Update partner balance
      const balanceChange = formData.payment_type === "incoming" 
        ? formData.amount 
        : -formData.amount;

      // Check if balance record exists
      const { data: existingBalance } = await supabase
        .from("partner_balances")
        .select("id, balance")
        .eq("organization_id", organization.id)
        .eq("partner_organization_id", partnerId)
        .maybeSingle();

      if (existingBalance) {
        await supabase
          .from("partner_balances")
          .update({ 
            balance: existingBalance.balance + balanceChange,
            last_transaction_date: new Date().toISOString(),
          })
          .eq("id", existingBalance.id);
      } else {
        await supabase.from("partner_balances").insert({
          organization_id: organization.id,
          partner_organization_id: partnerId,
          balance: balanceChange,
          last_transaction_date: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-payments"] });
      queryClient.invalidateQueries({ queryKey: ["partner-balance"] });
      queryClient.invalidateQueries({ queryKey: ["partner-balances"] });
      toast.success("تم تسجيل الدفعة بنجاح", {
        description: receiptFile ? "تم رفع إيصال الإيداع" : undefined,
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error("فشل في تسجيل الدفعة: " + error.message);
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const resetForm = () => {
    setFormData({
      payment_type: "outgoing",
      amount: 0,
      payment_method: "bank_transfer",
      payment_date: new Date().toISOString().split("T")[0],
      reference_number: "",
      bank_name: "",
      bank_branch: "",
      account_number: "",
      depositor_name: "",
      check_number: "",
      notes: "",
    });
    removeReceipt();
  };

  const handleSubmit = () => {
    if (formData.amount <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح");
      return;
    }
    createPaymentMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            تسجيل دفعة لـ {partnerName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Payment Type */}
          <div className="space-y-3">
            <Label>نوع الدفعة</Label>
            <RadioGroup
              value={formData.payment_type}
              onValueChange={(value: "incoming" | "outgoing") =>
                setFormData({ ...formData, payment_type: value })
              }
              className="flex gap-4"
            >
              <Card
                className={`flex-1 cursor-pointer transition-all ${
                  formData.payment_type === "incoming"
                    ? "ring-2 ring-green-500 bg-green-50 dark:bg-green-950/30"
                    : ""
                }`}
                onClick={() =>
                  setFormData({ ...formData, payment_type: "incoming" })
                }
              >
                <CardContent className="p-3 flex items-center gap-2">
                  <RadioGroupItem value="incoming" id="incoming" />
                  <ArrowDownRight className="h-4 w-4 text-green-600" />
                  <Label htmlFor="incoming" className="cursor-pointer text-sm">
                    وارد (لنا)
                  </Label>
                </CardContent>
              </Card>
              <Card
                className={`flex-1 cursor-pointer transition-all ${
                  formData.payment_type === "outgoing"
                    ? "ring-2 ring-red-500 bg-red-50 dark:bg-red-950/30"
                    : ""
                }`}
                onClick={() =>
                  setFormData({ ...formData, payment_type: "outgoing" })
                }
              >
                <CardContent className="p-3 flex items-center gap-2">
                  <RadioGroupItem value="outgoing" id="outgoing" />
                  <ArrowUpRight className="h-4 w-4 text-red-600" />
                  <Label htmlFor="outgoing" className="cursor-pointer text-sm">
                    صادر (علينا)
                  </Label>
                </CardContent>
              </Card>
            </RadioGroup>
          </div>

          {/* Amount and Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>المبلغ المودع *</Label>
              <Input
                type="number"
                min="0"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                }
                placeholder="0.00"
                className="text-lg font-semibold"
              />
            </div>
            <div className="space-y-2">
              <Label>تاريخ الإيداع</Label>
              <Input
                type="date"
                value={formData.payment_date}
                onChange={(e) =>
                  setFormData({ ...formData, payment_date: e.target.value })
                }
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>طريقة الدفع</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, payment_method: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                  <SelectItem value="cash">نقدي</SelectItem>
                  <SelectItem value="check">شيك</SelectItem>
                  <SelectItem value="card">بطاقة</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>رقم المرجع / الإيصال</Label>
              <Input
                value={formData.reference_number}
                onChange={(e) =>
                  setFormData({ ...formData, reference_number: e.target.value })
                }
                placeholder="رقم التحويل أو الإيصال"
              />
            </div>
          </div>

          {/* Bank/Check Details */}
          {(formData.payment_method === "bank_transfer" ||
            formData.payment_method === "check") && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم البنك</Label>
                  <Input
                    value={formData.bank_name}
                    onChange={(e) =>
                      setFormData({ ...formData, bank_name: e.target.value })
                    }
                    placeholder="مثال: البنك الأهلي"
                  />
                </div>
                <div className="space-y-2">
                  <Label>فرع البنك</Label>
                  <Input
                    value={formData.bank_branch}
                    onChange={(e) =>
                      setFormData({ ...formData, bank_branch: e.target.value })
                    }
                    placeholder="مثال: فرع المعادي"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>رقم الحساب</Label>
                  <Input
                    value={formData.account_number}
                    onChange={(e) =>
                      setFormData({ ...formData, account_number: e.target.value })
                    }
                    placeholder="رقم الحساب المودع فيه"
                  />
                </div>
                <div className="space-y-2">
                  <Label>اسم المودع</Label>
                  <Input
                    value={formData.depositor_name}
                    onChange={(e) =>
                      setFormData({ ...formData, depositor_name: e.target.value })
                    }
                    placeholder="اسم صاحب الحساب"
                  />
                </div>
              </div>
              {formData.payment_method === "check" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>رقم الشيك</Label>
                    <Input
                      value={formData.check_number}
                      onChange={(e) =>
                        setFormData({ ...formData, check_number: e.target.value })
                      }
                      placeholder="رقم الشيك"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Receipt Upload with AI Extraction */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <ScanLine className="h-4 w-4" />
              صورة إيصال الإيداع البنكي
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                قراءة تلقائية
              </span>
            </Label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />
            {receiptPreview ? (
              <div className="relative border rounded-lg p-2 bg-muted/30">
                {isExtracting && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    <p className="text-sm font-medium">جاري قراءة الإيصال...</p>
                    <p className="text-xs text-muted-foreground">يتم استخراج البيانات تلقائياً</p>
                  </div>
                )}
                <img
                  src={receiptPreview}
                  alt="معاينة الإيصال"
                  className="w-full max-h-48 object-contain rounded"
                />
                {extractionConfidence !== null && !isExtracting && (
                  <div className={`absolute bottom-3 right-3 text-xs px-2 py-1 rounded-full ${
                    extractionConfidence > 0.7 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : extractionConfidence > 0.4
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    دقة القراءة: {Math.round(extractionConfidence * 100)}%
                  </div>
                )}
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-3 left-3 h-7 w-7"
                  onClick={removeReceipt}
                  disabled={isExtracting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-primary/30 rounded-lg p-6 text-center cursor-pointer hover:bg-primary/5 hover:border-primary/50 transition-colors"
              >
                <div className="relative inline-block">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-primary/60" />
                  <Sparkles className="h-4 w-4 absolute -top-1 -right-1 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  ارفع صورة الإيصال للقراءة التلقائية
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  سيتم ملء الحقول تلقائياً بالذكاء الاصطناعي
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="أي ملاحظات إضافية..."
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createPaymentMutation.isPending || isUploading || formData.amount <= 0}
              className={
                formData.payment_type === "incoming"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {(createPaymentMutation.isPending || isUploading) && (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              )}
              إرسال
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PartnerPaymentUploadDialog;
