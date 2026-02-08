import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  ArrowLeft,
  Calendar,
  AlertTriangle,
  Save,
  Building2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import FlexibleWasteTypeSelector from '@/components/shipments/FlexibleWasteTypeSelector';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const NewDisposalOperation = () => {
  const navigate = useNavigate();
  const { organization, user } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    waste_type: '',
    waste_description: '',
    hazard_level: 'hazardous',
    quantity: '',
    unit: 'طن',
    disposal_method: '',
    disposal_date: new Date().toISOString().split('T')[0],
    manifest_number: '',
    receiving_officer: '',
    cost: '',
    notes: ''
  });

  // Fetch facility
  const { data: facility } = useQuery({
    queryKey: ['disposal-facility', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data } = await supabase
        .from('disposal_facilities')
        .select('*')
        .eq('organization_id', organization.id)
        .single();
      return data;
    },
    enabled: !!organization?.id
  });

  const createOperationMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('disposal_operations')
        .insert({
          organization_id: organization?.id,
          disposal_facility_id: facility?.id,
          waste_type: data.waste_type,
          waste_description: data.waste_description,
          hazard_level: data.hazard_level,
          quantity: Number(data.quantity),
          unit: data.unit,
          disposal_method: data.disposal_method,
          disposal_date: data.disposal_date,
          manifest_number: data.manifest_number || null,
          receiving_officer: data.receiving_officer || null,
          cost: data.cost ? Number(data.cost) : null,
          notes: data.notes || null,
          status: 'pending'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disposal-operations'] });
      toast.success('تم تسجيل العملية بنجاح');
      navigate('/dashboard/disposal/operations');
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error('حدث خطأ أثناء تسجيل العملية');
    }
  });

  const handleWasteTypeChange = (wasteType: string, hazardLevel: string, wasteDescription: string) => {
    setFormData(prev => ({
      ...prev,
      waste_type: wasteType,
      waste_description: wasteDescription,
      hazard_level: hazardLevel === 'hazardous' ? 'hazardous' : 'non_hazardous'
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.quantity || !formData.disposal_method) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }

    createOperationMutation.mutate(formData);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto" dir="rtl">
        <BackButton />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">تسجيل عملية تخلص جديدة</h1>
            <p className="text-muted-foreground text-sm">تسجيل استلام ومعالجة مخلفات خطرة</p>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Waste Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  بيانات المخلف
                </CardTitle>
                <CardDescription>تفاصيل نوع وكمية المخلف المستلم</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>نوع المخلف *</Label>
                  <FlexibleWasteTypeSelector
                    value={formData.waste_description}
                    onChange={handleWasteTypeChange}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الكمية *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الوحدة</Label>
                    <Select 
                      value={formData.unit} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, unit: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="طن">طن</SelectItem>
                        <SelectItem value="كجم">كجم</SelectItem>
                        <SelectItem value="م³">متر مكعب</SelectItem>
                        <SelectItem value="برميل">برميل</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>مستوى الخطورة</Label>
                  <div className="flex gap-2">
                    <Badge 
                      variant={formData.hazard_level === 'hazardous' ? 'destructive' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setFormData(prev => ({ ...prev, hazard_level: 'hazardous' }))}
                    >
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      خطر
                    </Badge>
                    <Badge 
                      variant={formData.hazard_level === 'non_hazardous' ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setFormData(prev => ({ ...prev, hazard_level: 'non_hazardous' }))}
                    >
                      غير خطر
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Disposal Method */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">طريقة التخلص</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: 'landfill', label: 'دفن صحي', icon: '🏔️' },
                    { value: 'incineration', label: 'حرق', icon: '🔥' },
                    { value: 'chemical_treatment', label: 'معالجة كيميائية', icon: '🧪' },
                    { value: 'biological_treatment', label: 'معالجة بيولوجية', icon: '🦠' },
                  ].map((method) => (
                    <Card
                      key={method.value}
                      className={`cursor-pointer transition-all ${
                        formData.disposal_method === method.value
                          ? 'ring-2 ring-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, disposal_method: method.value }))}
                    >
                      <CardContent className="pt-4 text-center">
                        <span className="text-2xl">{method.icon}</span>
                        <p className="text-sm font-medium mt-2">{method.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Additional Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">بيانات إضافية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>تاريخ التخلص</Label>
                    <Input
                      type="date"
                      value={formData.disposal_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, disposal_date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>رقم بيان النقل</Label>
                    <Input
                      placeholder="رقم البيان"
                      value={formData.manifest_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, manifest_number: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>مسؤول الاستلام</Label>
                    <Input
                      placeholder="اسم المسؤول"
                      value={formData.receiving_officer}
                      onChange={(e) => setFormData(prev => ({ ...prev, receiving_officer: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>التكلفة (ج.م)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={formData.cost}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>ملاحظات</Label>
                  <Textarea
                    placeholder="أي ملاحظات إضافية..."
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex items-center justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/dashboard/disposal/operations')}
              >
                إلغاء
              </Button>
              <Button 
                type="submit" 
                className="gap-2 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700"
                disabled={createOperationMutation.isPending}
              >
                <Save className="w-4 h-4" />
                {createOperationMutation.isPending ? 'جاري الحفظ...' : 'حفظ العملية'}
              </Button>
            </div>
          </motion.div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default NewDisposalOperation;
