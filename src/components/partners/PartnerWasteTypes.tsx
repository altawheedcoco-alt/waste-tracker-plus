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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Trash2, 
  Plus, 
  Package,
  Loader2,
  AlertTriangle,
  Leaf,
  ChevronsUpDown,
  Check,
  PenLine,
  Percent,
  Receipt,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  hazardousWasteCategories, 
  nonHazardousWasteCategories,
  type WasteCategoryInfo,
} from '@/lib/wasteClassification';
import { useCustomWasteTypes, type CustomWasteType } from '@/hooks/useCustomWasteTypes';
import { cn } from '@/lib/utils';

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
  tax_included: boolean;
  tax_type: string;
  tax_rate: number;
}

const TAX_TYPES = [
  { value: 'none', label: 'بدون ضريبة' },
  { value: 'vat', label: 'ضريبة القيمة المضافة' },
  { value: 'sales', label: 'ضريبة مبيعات' },
  { value: 'other', label: 'ضريبة أخرى' },
];

export default function PartnerWasteTypes({ partnerId, isExternal = false }: PartnerWasteTypesProps) {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const { customWasteTypes, addCustomWasteType } = useCustomWasteTypes();
  
  const [open, setOpen] = useState(false);
  const [selectedWasteType, setSelectedWasteType] = useState('');
  const [selectedWasteName, setSelectedWasteName] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [isCustomEntry, setIsCustomEntry] = useState(false);
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [unit, setUnit] = useState('كجم');
  const [taxIncluded, setTaxIncluded] = useState(false);
  const [taxType, setTaxType] = useState('none');
  const [taxRate, setTaxRate] = useState('');

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

  // Include custom waste types
  const customWasteOptions = customWasteTypes.map(cw => ({
    code: cw.code,
    name: cw.name,
    categoryName: 'مخلفات مخصصة',
    categoryId: 'custom',
    isHazardous: cw.category === 'hazardous',
    isCustom: true,
  }));

  const allAvailableTypes = [...allWasteTypes, ...customWasteOptions];

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
      if (!organization?.id) {
        throw new Error('بيانات غير مكتملة');
      }

      let wasteTypeName = selectedWasteName;
      let wasteCode = selectedWasteType;

      // Handle custom entry
      if (isCustomEntry && customInput.trim()) {
        wasteTypeName = customInput.trim();
        wasteCode = `CUSTOM-${Date.now()}`;
        
        // Save to custom waste types for reuse
        addCustomWasteType({
          name: wasteTypeName,
          code: wasteCode,
          category: 'non-hazardous',
          parent_category: 'custom',
        });
      }

      if (!wasteTypeName) {
        throw new Error('يرجى اختيار أو إدخال نوع المخلف');
      }
      
      const insertData: any = {
        organization_id: organization.id,
        waste_type: wasteTypeName,
        waste_code: wasteCode || null,
        price_per_unit: parseFloat(pricePerUnit) || 0,
        unit: unit,
        tax_included: taxIncluded,
        tax_type: taxType === 'none' ? null : taxType,
        tax_rate: taxType === 'none' ? 0 : (parseFloat(taxRate) || 0),
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
      resetForm();
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

  const resetForm = () => {
    setSelectedWasteType('');
    setSelectedWasteName('');
    setCustomInput('');
    setIsCustomEntry(false);
    setPricePerUnit('');
    setTaxIncluded(false);
    setTaxType('none');
    setTaxRate('');
  };

  const handleSelectWasteType = (code: string, name: string) => {
    setSelectedWasteType(code);
    setSelectedWasteName(name);
    setIsCustomEntry(false);
    setCustomInput('');
    setOpen(false);
  };

  const handleCustomEntry = () => {
    setIsCustomEntry(true);
    setSelectedWasteType('');
    setSelectedWasteName('');
    setOpen(false);
  };

  const handleAddWasteType = () => {
    if (!isCustomEntry && !selectedWasteType) {
      toast.error('يرجى اختيار نوع المخلف');
      return;
    }
    if (isCustomEntry && !customInput.trim()) {
      toast.error('يرجى إدخال اسم المخلف');
      return;
    }
    addWasteTypeMutation.mutate();
  };

  const getWasteTypeInfo = (wasteCode: string | null) => {
    if (!wasteCode) return null;
    return allAvailableTypes.find(w => w.code === wasteCode);
  };

  // Filter out already added waste types
  const availableWasteTypes = allAvailableTypes.filter(
    wt => !wasteTypes.some(pwt => pwt.waste_code === wt.code)
  );

  // Group available waste types by category
  const groupedWasteTypes = [
    ...allWasteCategories.map(cat => ({
      ...cat,
      availableSubcategories: cat.subcategories.filter(
        sub => !wasteTypes.some(pwt => pwt.waste_code === sub.code)
      ),
    })),
    // Add custom waste types group if any
    ...(customWasteOptions.filter(cw => !wasteTypes.some(pwt => pwt.waste_code === cw.code)).length > 0 ? [{
      id: 'custom',
      name: 'مخلفات مخصصة',
      category: 'non-hazardous' as const,
      availableSubcategories: customWasteOptions.filter(cw => !wasteTypes.some(pwt => pwt.waste_code === cw.code)),
    }] : []),
  ].filter(cat => cat.availableSubcategories.length > 0);

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
        <div className="flex flex-col gap-3 p-4 bg-muted/50 rounded-lg">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Waste Type Selection with Custom Input */}
            {isCustomEntry ? (
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="أدخل اسم المخلف..."
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="flex-1 bg-background"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setIsCustomEntry(false);
                    setCustomInput('');
                  }}
                >
                  <ChevronsUpDown className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="flex-1 justify-between bg-background"
                  >
                    {selectedWasteName || 'اختر نوع المخلف...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="ابحث عن نوع المخلف..." />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty>
                        <div className="py-2 text-center">
                          <p className="text-sm text-muted-foreground mb-2">لم يتم العثور على نتائج</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCustomEntry}
                            className="gap-2"
                          >
                            <PenLine className="h-4 w-4" />
                            إدخال يدوي
                          </Button>
                        </div>
                      </CommandEmpty>
                      
                      {/* Manual Entry Option */}
                      <CommandGroup heading="خيارات إضافية">
                        <CommandItem onSelect={handleCustomEntry} className="gap-2">
                          <PenLine className="h-4 w-4" />
                          إدخال نوع مخلف يدوياً
                        </CommandItem>
                      </CommandGroup>

                      {/* Waste Type Categories */}
                      {groupedWasteTypes.map((category) => (
                        <CommandGroup 
                          key={category.id} 
                          heading={
                            <span className="flex items-center gap-2">
                              {category.category === 'hazardous' ? (
                                <AlertTriangle className="h-3 w-3 text-destructive" />
                              ) : (
                                <Leaf className="h-3 w-3 text-green-500" />
                              )}
                              {category.name}
                            </span>
                          }
                        >
                          {category.availableSubcategories.map((sub) => (
                            <CommandItem
                              key={sub.code}
                              value={`${sub.code} ${sub.name}`}
                              onSelect={() => handleSelectWasteType(sub.code, sub.name)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedWasteType === sub.code ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <Badge variant="outline" className="text-xs font-mono ml-2">
                                {sub.code}
                              </Badge>
                              {sub.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}

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

            {/* Tax Settings */}
            <div className="flex gap-2 items-center">
              <Select value={taxType} onValueChange={setTaxType}>
                <SelectTrigger className="w-36 bg-background">
                  <SelectValue placeholder="نوع الضريبة" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {TAX_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {taxType !== 'none' && (
                <>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      placeholder="%"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      className="w-16 bg-background"
                      min="0"
                      max="100"
                    />
                    <Percent className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="tax-included" 
                      checked={taxIncluded}
                      onCheckedChange={(checked) => setTaxIncluded(checked === true)}
                    />
                    <Label htmlFor="tax-included" className="text-xs whitespace-nowrap cursor-pointer">
                      شامل الضريبة
                    </Label>
                  </div>
                </>
              )}
            </div>

            <Button 
              onClick={handleAddWasteType} 
              disabled={addWasteTypeMutation.isPending || (!selectedWasteType && !isCustomEntry) || (isCustomEntry && !customInput.trim())}
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

          {isCustomEntry && (
            <p className="text-xs text-muted-foreground">
              💡 سيتم حفظ هذا النوع في قائمة المخلفات المخصصة لاستخدامه عند إنشاء الشحنات
            </p>
          )}
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
                  <TableHead className="text-center font-bold">الضريبة</TableHead>
                  <TableHead className="text-center font-bold">الوحدة</TableHead>
                  <TableHead className="text-center font-bold">التصنيف</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wasteTypes.map((wt) => {
                  const wasteInfo = getWasteTypeInfo(wt.waste_code);
                  const isHazardous = wasteInfo?.isHazardous || 
                    hazardousWasteCategories.some(cat => 
                      cat.subcategories.some(sub => sub.code === wt.waste_code)
                    );
                  const isCustom = wt.waste_code?.startsWith('CUSTOM-') || wt.waste_code?.startsWith('custom-');

                  return (
                    <TableRow key={wt.id}>
                      <TableCell>
                        {isCustom ? (
                          <Badge variant="secondary" className="text-xs">
                            مخصص
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="font-mono text-xs">
                            {wt.waste_code || '-'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{wt.waste_type}</TableCell>
                      <TableCell className="text-center">
                        {wt.price_per_unit > 0 ? (
                          <div className="flex flex-col items-center">
                            <span className="text-green-600 font-medium">
                              {wt.price_per_unit.toLocaleString('ar-EG')} ج.م
                            </span>
                            {wt.tax_included && (
                              <span className="text-xs text-muted-foreground">شامل الضريبة</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {wt.tax_type && wt.tax_rate > 0 ? (
                          <Badge variant="outline" className="gap-1">
                            <Receipt className="h-3 w-3" />
                            {wt.tax_rate}%
                            <span className="text-xs">
                              {wt.tax_type === 'vat' ? 'ق.م' : wt.tax_type === 'sales' ? 'مبيعات' : ''}
                            </span>
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">بدون</span>
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
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
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