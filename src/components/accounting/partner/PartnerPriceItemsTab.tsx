import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Search, Edit, Trash2, Package } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface PartnerPriceItemsTabProps {
  partnerId: string;
  partnerName: string;
}

interface PriceItem {
  id: string;
  item_code: string;
  item_name: string;
  item_description?: string;
  waste_type?: string;
  unit: string;
  unit_price: number;
  currency: string;
  price_type: string;
  min_quantity?: number;
  max_quantity?: number;
  effective_from?: string;
  effective_to?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
}

const PartnerPriceItemsTab = ({ partnerId, partnerName }: PartnerPriceItemsTabProps) => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PriceItem | null>(null);
  const [formData, setFormData] = useState({
    item_name: "",
    item_description: "",
    waste_type: "",
    unit: "kg",
    unit_price: 0,
    currency: "EGP",
    price_type: "fixed",
    min_quantity: "",
    max_quantity: "",
    effective_from: "",
    effective_to: "",
    notes: "",
  });

  const { data: priceItems = [], isLoading } = useQuery({
    queryKey: ["partner-price-items", organization?.id, partnerId],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from("partner_price_items")
        .select("*")
        .eq("organization_id", organization.id)
        .eq("partner_organization_id", partnerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PriceItem[];
    },
    enabled: !!organization?.id && !!partnerId,
  });

  const createMutation = useMutation({
    mutationFn: async (itemData: typeof formData) => {
      const { error } = await supabase.from("partner_price_items").insert([{
        item_name: itemData.item_name,
        item_description: itemData.item_description || null,
        waste_type: itemData.waste_type || null,
        unit: itemData.unit,
        unit_price: itemData.unit_price,
        currency: itemData.currency,
        price_type: itemData.price_type,
        min_quantity: itemData.min_quantity ? parseFloat(itemData.min_quantity) : null,
        max_quantity: itemData.max_quantity ? parseFloat(itemData.max_quantity) : null,
        effective_from: itemData.effective_from || null,
        effective_to: itemData.effective_to || null,
        notes: itemData.notes || null,
        organization_id: organization?.id,
        partner_organization_id: partnerId,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-price-items"] });
      toast.success("تم إضافة الصنف بنجاح");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("فشل في إضافة الصنف: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PriceItem> }) => {
      const { error } = await supabase
        .from("partner_price_items")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-price-items"] });
      toast.success("تم تحديث الصنف بنجاح");
      setIsDialogOpen(false);
      setEditingItem(null);
      resetForm();
    },
    onError: (error) => {
      toast.error("فشل في تحديث الصنف: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("partner_price_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-price-items"] });
      toast.success("تم حذف الصنف بنجاح");
    },
    onError: (error) => {
      toast.error("فشل في حذف الصنف: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      item_name: "",
      item_description: "",
      waste_type: "",
      unit: "kg",
      unit_price: 0,
      currency: "EGP",
      price_type: "fixed",
      min_quantity: "",
      max_quantity: "",
      effective_from: "",
      effective_to: "",
      notes: "",
    });
  };

  const handleEdit = (item: PriceItem) => {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name,
      item_description: item.item_description || "",
      waste_type: item.waste_type || "",
      unit: item.unit,
      unit_price: item.unit_price,
      currency: item.currency,
      price_type: item.price_type,
      min_quantity: item.min_quantity?.toString() || "",
      max_quantity: item.max_quantity?.toString() || "",
      effective_from: item.effective_from || "",
      effective_to: item.effective_to || "",
      notes: item.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.item_name || formData.unit_price <= 0) {
      toast.error("يرجى إدخال اسم الصنف والسعر");
      return;
    }

    const data = {
      item_name: formData.item_name,
      item_description: formData.item_description || null,
      waste_type: formData.waste_type || null,
      unit: formData.unit,
      unit_price: formData.unit_price,
      currency: formData.currency,
      price_type: formData.price_type,
      min_quantity: formData.min_quantity ? parseFloat(formData.min_quantity) : null,
      max_quantity: formData.max_quantity ? parseFloat(formData.max_quantity) : null,
      effective_from: formData.effective_from || null,
      effective_to: formData.effective_to || null,
      notes: formData.notes || null,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredItems = priceItems.filter(
    (item) =>
      item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.waste_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPriceTypeBadge = (type: string) => {
    const types: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      fixed: { label: "ثابت", variant: "default" },
      variable: { label: "متغير", variant: "secondary" },
      negotiable: { label: "قابل للتفاوض", variant: "outline" },
    };
    return types[type] || { label: type, variant: "default" };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            أصناف وأسعار {partnerName}
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث في الأصناف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 w-64"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingItem(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة صنف
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? "تعديل الصنف" : "إضافة صنف جديد"}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label>اسم الصنف *</Label>
                    <Input
                      value={formData.item_name}
                      onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                      placeholder="مثال: بلاستيك PET"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>نوع النفاية</Label>
                    <Input
                      value={formData.waste_type}
                      onChange={(e) => setFormData({ ...formData, waste_type: e.target.value })}
                      placeholder="مثال: بلاستيك"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>السعر *</Label>
                    <Input
                      type="number"
                      value={formData.unit_price}
                      onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الوحدة</Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(value) => setFormData({ ...formData, unit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">كيلوجرام</SelectItem>
                        <SelectItem value="ton">طن</SelectItem>
                        <SelectItem value="unit">وحدة</SelectItem>
                        <SelectItem value="trip">رحلة</SelectItem>
                        <SelectItem value="container">حاوية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>نوع السعر</Label>
                    <Select
                      value={formData.price_type}
                      onValueChange={(value) => setFormData({ ...formData, price_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">ثابت</SelectItem>
                        <SelectItem value="variable">متغير</SelectItem>
                        <SelectItem value="negotiable">قابل للتفاوض</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>العملة</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => setFormData({ ...formData, currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EGP">جنيه مصري</SelectItem>
                        <SelectItem value="USD">دولار أمريكي</SelectItem>
                        <SelectItem value="EUR">يورو</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>الحد الأدنى للكمية</Label>
                    <Input
                      type="number"
                      value={formData.min_quantity}
                      onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
                      placeholder="اختياري"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الحد الأقصى للكمية</Label>
                    <Input
                      type="number"
                      value={formData.max_quantity}
                      onChange={(e) => setFormData({ ...formData, max_quantity: e.target.value })}
                      placeholder="اختياري"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>تاريخ بدء السريان</Label>
                    <Input
                      type="date"
                      value={formData.effective_from}
                      onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>تاريخ انتهاء السريان</Label>
                    <Input
                      type="date"
                      value={formData.effective_to}
                      onChange={(e) => setFormData({ ...formData, effective_to: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>وصف الصنف</Label>
                    <Textarea
                      value={formData.item_description}
                      onChange={(e) => setFormData({ ...formData, item_description: e.target.value })}
                      placeholder="وصف تفصيلي للصنف..."
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>ملاحظات</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="أي ملاحظات إضافية..."
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingItem ? "تحديث" : "إضافة"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد أصناف مسجلة</p>
            <p className="text-sm">أضف أصناف وأسعار لهذا الشريك</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>كود الصنف</TableHead>
                  <TableHead>اسم الصنف</TableHead>
                  <TableHead>نوع النفاية</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>الوحدة</TableHead>
                  <TableHead>نوع السعر</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const priceTypeBadge = getPriceTypeBadge(item.price_type);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">{item.item_code}</TableCell>
                      <TableCell className="font-medium">{item.item_name}</TableCell>
                      <TableCell>{item.waste_type || "-"}</TableCell>
                      <TableCell className="font-bold">
                        {item.unit_price.toLocaleString()} {item.currency}
                      </TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>
                        <Badge variant={priceTypeBadge.variant}>{priceTypeBadge.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.is_active ? "default" : "secondary"}>
                          {item.is_active ? "نشط" : "غير نشط"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("هل تريد حذف هذا الصنف؟")) {
                                deleteMutation.mutate(item.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PartnerPriceItemsTab;
