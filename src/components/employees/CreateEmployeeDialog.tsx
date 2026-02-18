import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  UserPlus,
  Shield,
  Building2,
  Package,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { useEmployeeManagement, PERMISSION_CATEGORIES, CreateEmployeeData } from '@/hooks/useEmployeeManagement';
import { usePartners } from '@/hooks/usePartners';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CreateEmployeeDialogProps {
  trigger?: React.ReactNode;
}

export default function CreateEmployeeDialog({ trigger }: CreateEmployeeDialogProps) {
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [accessAllPartners, setAccessAllPartners] = useState(true);
  const [accessAllWasteTypes, setAccessAllWasteTypes] = useState(true);
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [selectedExternalPartners, setSelectedExternalPartners] = useState<string[]>([]);
  const [selectedWasteTypes, setSelectedWasteTypes] = useState<string[]>([]);

  const { createEmployee, isCreating } = useEmployeeManagement();
  const { partners } = usePartners();
  const { profile } = useAuth();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{
    email: string;
    password: string;
    fullName: string;
    phone: string;
  }>();

  // Fetch external partners
  const { data: externalPartners } = useQuery({
    queryKey: ['external-partners', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data } = await supabase
        .from('external_partners')
        .select('id, name, partner_type')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true);
      return data || [];
    },
    enabled: !!profile?.organization_id,
  });

  // Common waste types
  const wasteTypes = [
    'بلاستيك', 'ورق', 'كرتون', 'معادن', 'حديد', 'ألومنيوم', 
    'زجاج', 'خشب', 'إلكترونيات', 'مخلفات عضوية', 'مخلفات بناء',
    'مخلفات طبية', 'مخلفات كيميائية', 'زيوت مستعملة'
  ];

  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const toggleAllInCategory = (category: keyof typeof PERMISSION_CATEGORIES) => {
    const categoryPerms = PERMISSION_CATEGORIES[category].permissions.map((p) => p.value);
    const allSelected = categoryPerms.every((p) => selectedPermissions.includes(p));

    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((p) => !categoryPerms.includes(p)));
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...categoryPerms])]);
    }
  };

  const onSubmit = async (data: { email: string; password: string; fullName: string; phone: string }) => {
    const employeeData: CreateEmployeeData = {
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      phone: data.phone || undefined,
      employeeType: 'employee',
      permissions: selectedPermissions,
      accessAllPartners,
      accessAllWasteTypes,
      partnerIds: accessAllPartners ? undefined : selectedPartners,
      externalPartnerIds: accessAllPartners ? undefined : selectedExternalPartners,
      wasteTypes: accessAllWasteTypes ? undefined : selectedWasteTypes,
    };

    try {
      await createEmployee.mutateAsync(employeeData);
      setOpen(false);
      reset();
      setSelectedPermissions([]);
      setAccessAllPartners(true);
      setAccessAllWasteTypes(true);
      setSelectedPartners([]);
      setSelectedExternalPartners([]);
      setSelectedWasteTypes([]);
    } catch (error) {
      // Error handled in mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            إضافة موظف
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            إنشاء حساب موظف جديد
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="info" className="gap-1.5">
                <UserPlus className="h-4 w-4" />
                البيانات
              </TabsTrigger>
              <TabsTrigger value="permissions" className="gap-1.5">
                <Shield className="h-4 w-4" />
                الصلاحيات
              </TabsTrigger>
              <TabsTrigger value="access" className="gap-1.5">
                <Building2 className="h-4 w-4" />
                الوصول
              </TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="info" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">الاسم الكامل *</Label>
                  <Input
                    id="fullName"
                    {...register('fullName', { required: 'الاسم مطلوب' })}
                    placeholder="أدخل اسم الموظف"
                  />
                  {errors.fullName && (
                    <p className="text-xs text-destructive">{errors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    placeholder="01xxxxxxxxx"
                    dir="ltr"
                    className="text-left"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email', { 
                    required: 'البريد الإلكتروني مطلوب',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'بريد إلكتروني غير صالح'
                    }
                  })}
                  placeholder="employee@company.com"
                  dir="ltr"
                  className="text-left"
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', { 
                      required: 'كلمة المرور مطلوبة',
                      minLength: { value: 6, message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }
                    })}
                    placeholder="كلمة مرور قوية"
                    dir="ltr"
                    className="text-left pl-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute left-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>
            </TabsContent>

            {/* Permissions Tab */}
            <TabsContent value="permissions">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    حدد الصلاحيات التي يمكن للموظف استخدامها
                  </p>

                  {Object.entries(PERMISSION_CATEGORIES).map(([key, category]) => {
                    const categoryPerms = category.permissions.map((p) => p.value);
                    const selectedCount = categoryPerms.filter((p) => selectedPermissions.includes(p)).length;

                    return (
                      <div key={key} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{category.label}</h4>
                            <Badge variant="secondary" className="text-xs">
                              {selectedCount}/{category.permissions.length}
                            </Badge>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleAllInCategory(key as keyof typeof PERMISSION_CATEGORIES)}
                          >
                            {selectedCount === category.permissions.length ? 'إلغاء الكل' : 'تحديد الكل'}
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {category.permissions.map((permission) => (
                            <div
                              key={permission.value}
                              className="flex items-center space-x-2 space-x-reverse"
                            >
                              <Checkbox
                                id={permission.value}
                                checked={selectedPermissions.includes(permission.value)}
                                onCheckedChange={() => togglePermission(permission.value)}
                              />
                              <label
                                htmlFor={permission.value}
                                className="text-sm cursor-pointer"
                              >
                                {permission.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Access Tab */}
            <TabsContent value="access">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-6">
                  {/* Partner Access */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          الوصول للجهات المرتبطة
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          تحديد الجهات المرتبطة التي يمكن للموظف رؤيتها
                        </p>
                      </div>
                      <Switch
                        checked={accessAllPartners}
                        onCheckedChange={setAccessAllPartners}
                      />
                    </div>

                    {!accessAllPartners && (
                      <div className="space-y-3 mr-6">
                        <p className="text-sm font-medium">الجهات المرتبطة المسجلة:</p>
                        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                          {partners.map((partner) => (
                            <div key={partner.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`partner-${partner.id}`}
                                checked={selectedPartners.includes(partner.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedPartners((prev) => [...prev, partner.id]);
                                  } else {
                                    setSelectedPartners((prev) => prev.filter((p) => p !== partner.id));
                                  }
                                }}
                              />
                              <label htmlFor={`partner-${partner.id}`} className="text-sm truncate">
                                {partner.name}
                              </label>
                            </div>
                          ))}
                        </div>

                        {externalPartners && externalPartners.length > 0 && (
                          <>
                            <Separator />
                            <p className="text-sm font-medium">الجهات الخارجية:</p>
                            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                              {externalPartners.map((partner) => (
                                <div key={partner.id} className="flex items-center gap-2">
                                  <Checkbox
                                    id={`ext-${partner.id}`}
                                    checked={selectedExternalPartners.includes(partner.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedExternalPartners((prev) => [...prev, partner.id]);
                                      } else {
                                        setSelectedExternalPartners((prev) => prev.filter((p) => p !== partner.id));
                                      }
                                    }}
                                  />
                                  <label htmlFor={`ext-${partner.id}`} className="text-sm truncate">
                                    {partner.name}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Waste Type Access */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          الوصول لأنواع المخلفات
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          تحديد أنواع المخلفات التي يمكن للموظف التعامل معها
                        </p>
                      </div>
                      <Switch
                        checked={accessAllWasteTypes}
                        onCheckedChange={setAccessAllWasteTypes}
                      />
                    </div>

                    {!accessAllWasteTypes && (
                      <div className="mr-6">
                        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                          {wasteTypes.map((wasteType) => (
                            <div key={wasteType} className="flex items-center gap-2">
                              <Checkbox
                                id={`waste-${wasteType}`}
                                checked={selectedWasteTypes.includes(wasteType)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedWasteTypes((prev) => [...prev, wasteType]);
                                  } else {
                                    setSelectedWasteTypes((prev) => prev.filter((w) => w !== wasteType));
                                  }
                                }}
                              />
                              <label htmlFor={`waste-${wasteType}`} className="text-sm">
                                {wasteType}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isCreating} className="gap-2">
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  إنشاء الحساب
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
