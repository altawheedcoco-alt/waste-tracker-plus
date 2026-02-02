import { useState } from 'react';
import {
  Dialog,
  DialogContent,
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
import { useAccounting } from '@/hooks/useAccounting';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Fuel, Wrench, Users, Home, Zap, Package, MoreHorizontal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface CreateExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categories = [
  { value: 'fuel', label: 'وقود', icon: Fuel, color: 'bg-amber-100 text-amber-800' },
  { value: 'maintenance', label: 'صيانة', icon: Wrench, color: 'bg-blue-100 text-blue-800' },
  { value: 'salaries', label: 'رواتب', icon: Users, color: 'bg-purple-100 text-purple-800' },
  { value: 'rent', label: 'إيجار', icon: Home, color: 'bg-green-100 text-green-800' },
  { value: 'utilities', label: 'مرافق', icon: Zap, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'equipment', label: 'معدات', icon: Package, color: 'bg-indigo-100 text-indigo-800' },
  { value: 'other', label: 'أخرى', icon: MoreHorizontal, color: 'bg-gray-100 text-gray-800' },
];

export default function CreateExpenseDialog({ open, onOpenChange }: CreateExpenseDialogProps) {
  const { organization } = useAuth();
  const { createExpense } = useAccounting();
  
  const [formData, setFormData] = useState({
    category: 'fuel',
    subcategory: '',
    description: '',
    amount: 0,
    expense_date: new Date().toISOString().split('T')[0],
    shipment_id: '',
    driver_id: '',
    vehicle_plate: '',
    payment_method: 'cash',
  });

  // Fetch drivers
  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers-for-expense', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          id,
          vehicle_plate,
          profiles:profile_id(full_name)
        `)
        .eq('organization_id', organization.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id && open,
  });

  // Fetch shipments
  const { data: shipments = [] } = useQuery({
    queryKey: ['shipments-for-expense', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('shipments')
        .select('id, shipment_number')
        .or(`generator_id.eq.${organization.id},transporter_id.eq.${organization.id},recycler_id.eq.${organization.id}`)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id && open,
  });

  const handleSubmit = async () => {
    await createExpense.mutateAsync({
      ...formData,
      shipment_id: formData.shipment_id || undefined,
      driver_id: formData.driver_id || undefined,
    });
    
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      category: 'fuel',
      subcategory: '',
      description: '',
      amount: 0,
      expense_date: new Date().toISOString().split('T')[0],
      shipment_id: '',
      driver_id: '',
      vehicle_plate: '',
      payment_method: 'cash',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>تسجيل مصروف جديد</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Category Selection */}
          <div className="space-y-3">
            <Label>فئة المصروف</Label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map(cat => {
                const Icon = cat.icon;
                return (
                  <Card
                    key={cat.value}
                    className={`cursor-pointer transition-all hover:scale-105 ${
                      formData.category === cat.value ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setFormData({ ...formData, category: cat.value })}
                  >
                    <CardContent className="p-3 flex flex-col items-center gap-1">
                      <div className={`p-2 rounded-lg ${cat.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs">{cat.label}</span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Description and Amount */}
          <div className="space-y-2">
            <Label>الوصف</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="وصف المصروف..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>المبلغ</Label>
              <Input
                type="number"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="text-lg font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label>تاريخ المصروف</Label>
              <Input
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>طريقة الدفع</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">نقدي</SelectItem>
                  <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                  <SelectItem value="check">شيك</SelectItem>
                  <SelectItem value="card">بطاقة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>رقم المركبة (اختياري)</Label>
              <Input
                value={formData.vehicle_plate}
                onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value })}
                placeholder="رقم لوحة المركبة"
              />
            </div>
          </div>

          {/* Optional Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drivers.length > 0 && (
              <div className="space-y-2">
                <Label>السائق (اختياري)</Label>
                <Select
                  value={formData.driver_id}
                  onValueChange={(value) => {
                    const driver = drivers.find(d => d.id === value);
                    setFormData({ 
                      ...formData, 
                      driver_id: value,
                      vehicle_plate: driver?.vehicle_plate || formData.vehicle_plate
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر السائق" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">بدون</SelectItem>
                    {drivers.map(driver => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {(driver.profiles as any)?.full_name || 'سائق'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {shipments.length > 0 && (
              <div className="space-y-2">
                <Label>الشحنة (اختياري)</Label>
                <Select
                  value={formData.shipment_id}
                  onValueChange={(value) => setFormData({ ...formData, shipment_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الشحنة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">بدون</SelectItem>
                    {shipments.map(shipment => (
                      <SelectItem key={shipment.id} value={shipment.id}>
                        {shipment.shipment_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={createExpense.isPending || !formData.description || formData.amount <= 0}
            >
              {createExpense.isPending && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              تسجيل المصروف
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
