import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Trash2, 
  Plus, 
  Package,
  Loader2,
  AlertTriangle,
  Leaf,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  hazardousWasteCategories, 
  nonHazardousWasteCategories,
  type WasteCategoryInfo,
} from '@/lib/wasteClassification';

interface PartnerWasteTypesProps {
  partnerId: string;
  isExternal?: boolean;
}

interface PartnerWasteType {
  id: string;
  waste_type: string;
  waste_code: string | null;
  price_per_unit: number;
  unit: string;
  notes: string | null;
  is_active: boolean;
}

export default function PartnerWasteTypes({ partnerId, isExternal = false }: PartnerWasteTypesProps) {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [selectedWasteType, setSelectedWasteType] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [unit, setUnit] = useState('كجم');

  // Combine all waste types
  const allWasteCategories: WasteCategoryInfo[] = [
    ...hazardousWasteCategories,
    ...nonHazardousWasteCategories,
  ];

  // Flatten all subcategories for dropdown
  const allWasteTypes = allWasteCategories.flatMap(cat => 
    cat.subcategories.map(sub => ({
      ...sub,
      categoryName: cat.name,
      categoryId: cat.id,
      isHazardous: cat.category === 'hazardous',
    }))
  );

  // Fetch partner waste types
  const { data: wasteTypes = [], isLoading } = useQuery({
    queryKey: ['partner-waste-types', partnerId, organization?.id],
    queryFn: async () => {
      if (!partnerId || !organization?.id) return [];

      const query = supabase
        .from('partner_waste_types')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('is_active', true);

      if (isExternal) {
        query.eq('external_partner_id', partnerId);
      } else {
        query.eq('partner_organization_id', partnerId);
      }

      const { data, error } = await query.order('waste_type');

      if (error) {
        console.error('Error fetching partner waste types:', error);
        return [];
      }

      return data as PartnerWasteType[];
    },
    enabled: !!partnerId && !!organization?.id,
  });

  // Add waste type mutation
  const addWasteTypeMutation = useMutation({
    mutationFn: async () => {
      if (!organization?.id || !selectedWasteType) {
        throw new Error('بيانات غير مكتملة');
      }

      const wasteInfo = allWasteTypes.find(w => w.code === selectedWasteType);
      
      const insertData: any = {
        organization_id: organization.id,
        waste_type: wasteInfo?.name || selectedWasteType,
        waste_code: wasteInfo?.code || null,
        price_per_unit: parseFloat(pricePerUnit) || 0,
        unit: unit,
      };

      if (isExternal) {
        insertData.external_partner_id = partnerId;
      } else {
        insertData.partner_organization_id = partnerId;
      }

      const { error } = await supabase
        .from('partner_waste_types')
        .insert(insertData);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم إضافة نوع المخلف بنجاح');
      queryClient.invalidateQueries({ queryKey: ['partner-waste-types', partnerId] });
      setSelectedWasteType('');
      setPricePerUnit('');
    },
    onError: (error: Error) => {
      console.error('Error adding waste type:', error);
      if (error.message.includes('duplicate')) {
        toast.error('نوع المخلف موجود بالفعل');
      } else {
        toast.error('حدث خطأ أثناء إضافة نوع المخلف');
      }
    },
  });

  // Delete waste type mutation
  const deleteWasteTypeMutation = useMutation({
    mutationFn: async (wasteTypeId: string) => {
      const { error } = await supabase
        .from('partner_waste_types')
        .delete()
        .eq('id', wasteTypeId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم حذف نوع المخلف');
      queryClient.invalidateQueries({ queryKey: ['partner-waste-types', partnerId] });
    },
    onError: (error: Error) => {
      console.error('Error deleting waste type:', error);
      toast.error('حدث خطأ أثناء الحذف');
    },
  });

  const handleAddWasteType = () => {
    if (!selectedWasteType) {
      toast.error('يرجى اختيار نوع المخلف');
      return;
    }
    addWasteTypeMutation.mutate();
  };

  const getWasteTypeInfo = (wasteCode: string | null) => {
    if (!wasteCode) return null;
    return allWasteTypes.find(w => w.code === wasteCode);
  };

  // Filter out already added waste types
  const availableWasteTypes = allWasteTypes.filter(
    wt => !wasteTypes.some(pwt => pwt.waste_code === wt.code)
  );

  // Group available waste types by category
  const groupedWasteTypes = allWasteCategories
    .map(cat => ({
      ...cat,
      availableSubcategories: cat.subcategories.filter(
        sub => !wasteTypes.some(pwt => pwt.waste_code === sub.code)
      ),
    }))
    .filter(cat => cat.availableSubcategories.length > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          أنواع المخلفات المشتركة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new waste type */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-muted/50 rounded-lg">
          <Select value={selectedWasteType} onValueChange={setSelectedWasteType}>
            <SelectTrigger className="flex-1 bg-background">
              <SelectValue placeholder="اختر نوع المخلف..." />
            </SelectTrigger>
            <SelectContent className="max-h-80 bg-background z-50">
              {groupedWasteTypes.map((category) => (
                <div key={category.id}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted flex items-center gap-2">
                    {category.category === 'hazardous' ? (
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                    ) : (
                      <Leaf className="h-3 w-3 text-green-500" />
                    )}
                    {category.name}
                  </div>
                  {category.availableSubcategories.map((sub) => (
                    <SelectItem key={sub.code} value={sub.code}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-mono">
                          {sub.code}
                        </Badge>
                        {sub.name}
                      </div>
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="السعر"
              value={pricePerUnit}
              onChange={(e) => setPricePerUnit(e.target.value)}
              className="w-24 bg-background"
            />
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger className="w-20 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="كجم">كجم</SelectItem>
                <SelectItem value="طن">طن</SelectItem>
                <SelectItem value="قطعة">قطعة</SelectItem>
                <SelectItem value="لتر">لتر</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleAddWasteType} 
            disabled={addWasteTypeMutation.isPending || !selectedWasteType}
          >
            {addWasteTypeMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4 ml-1" />
                إضافة
              </>
            )}
          </Button>
        </div>

        {/* List of waste types */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            جاري التحميل...
          </div>
        ) : wasteTypes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-lg">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>لم يتم إضافة أنواع مخلفات بعد</p>
            <p className="text-sm">أضف أنواع المخلفات التي تتعامل بها مع هذا الشريك</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold">الكود</TableHead>
                  <TableHead className="font-bold">نوع المخلف</TableHead>
                  <TableHead className="text-center font-bold">السعر</TableHead>
                  <TableHead className="text-center font-bold">الوحدة</TableHead>
                  <TableHead className="text-center font-bold">التصنيف</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wasteTypes.map((wt) => {
                  const wasteInfo = getWasteTypeInfo(wt.waste_code);
                  const isHazardous = wasteInfo ? 
                    hazardousWasteCategories.some(cat => 
                      cat.subcategories.some(sub => sub.code === wt.waste_code)
                    ) : false;

                  return (
                    <TableRow key={wt.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {wt.waste_code || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{wt.waste_type}</TableCell>
                      <TableCell className="text-center">
                        {wt.price_per_unit > 0 ? (
                          <span className="text-green-600 font-medium">
                            {wt.price_per_unit.toLocaleString('ar-EG')} ج.م
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{wt.unit}</TableCell>
                      <TableCell className="text-center">
                        {isHazardous ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            خطر
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700">
                            <Leaf className="h-3 w-3" />
                            آمن
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => deleteWasteTypeMutation.mutate(wt.id)}
                          disabled={deleteWasteTypeMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Summary */}
        {wasteTypes.length > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
            <span>إجمالي الأنواع: {wasteTypes.length}</span>
            <span>
              ({wasteTypes.filter(wt => {
                return hazardousWasteCategories.some(cat => 
                  cat.subcategories.some(sub => sub.code === wt.waste_code)
                );
              }).length} خطر، {wasteTypes.filter(wt => {
                return !hazardousWasteCategories.some(cat => 
                  cat.subcategories.some(sub => sub.code === wt.waste_code)
                );
              }).length} آمن)
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}