import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Building2, User, FileText } from 'lucide-react';

const companySchema = z.object({
  // معلومات الشركة الأساسية
  name: z.string().min(2, 'اسم الشركة مطلوب'),
  name_en: z.string().optional(),
  organization_type: z.enum(['generator', 'transporter', 'recycler'], {
    required_error: 'نوع الشركة مطلوب',
  }),
  email: z.string().email('البريد الإلكتروني غير صالح'),
  phone: z.string().min(9, 'رقم الهاتف مطلوب'),
  secondary_phone: z.string().optional(),
  address: z.string().min(5, 'العنوان مطلوب'),
  city: z.string().min(2, 'المدينة مطلوبة'),
  region: z.string().optional(),
  commercial_register: z.string().optional(),
  environmental_license: z.string().optional(),
  activity_type: z.string().optional(),
  production_capacity: z.string().optional(),

  // الممثل القانوني
  representative_name: z.string().optional(),
  representative_position: z.string().optional(),
  representative_phone: z.string().optional(),
  representative_email: z.string().optional(),
  representative_national_id: z.string().optional(),

  // المفوض
  delegate_name: z.string().optional(),
  delegate_phone: z.string().optional(),
  delegate_email: z.string().optional(),
  delegate_national_id: z.string().optional(),

  // الوكيل
  agent_name: z.string().optional(),
  agent_phone: z.string().optional(),
  agent_email: z.string().optional(),
  agent_national_id: z.string().optional(),

  // حالة الشركة
  is_verified: z.boolean().default(true),
  is_active: z.boolean().default(true),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface AddCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function AddCompanyDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddCompanyDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      name_en: '',
      organization_type: undefined,
      email: '',
      phone: '',
      secondary_phone: '',
      address: '',
      city: '',
      region: '',
      commercial_register: '',
      environmental_license: '',
      activity_type: '',
      production_capacity: '',
      representative_name: '',
      representative_position: '',
      representative_phone: '',
      representative_email: '',
      representative_national_id: '',
      delegate_name: '',
      delegate_phone: '',
      delegate_email: '',
      delegate_national_id: '',
      agent_name: '',
      agent_phone: '',
      agent_email: '',
      agent_national_id: '',
      is_verified: true,
      is_active: true,
    },
  });

  const onSubmit = async (data: CompanyFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('organizations').insert([{
        name: data.name,
        name_en: data.name_en || null,
        organization_type: data.organization_type,
        email: data.email,
        phone: data.phone,
        secondary_phone: data.secondary_phone || null,
        address: data.address,
        city: data.city,
        region: data.region || null,
        commercial_register: data.commercial_register || null,
        environmental_license: data.environmental_license || null,
        activity_type: data.activity_type || null,
        production_capacity: data.production_capacity || null,
        representative_name: data.representative_name || null,
        representative_position: data.representative_position || null,
        representative_phone: data.representative_phone || null,
        representative_email: data.representative_email || null,
        representative_national_id: data.representative_national_id || null,
        delegate_name: data.delegate_name || null,
        delegate_phone: data.delegate_phone || null,
        delegate_email: data.delegate_email || null,
        delegate_national_id: data.delegate_national_id || null,
        agent_name: data.agent_name || null,
        agent_phone: data.agent_phone || null,
        agent_email: data.agent_email || null,
        agent_national_id: data.agent_national_id || null,
        is_verified: data.is_verified,
        is_active: data.is_active,
      }]);

      if (error) throw error;

      toast({
        title: 'تمت الإضافة بنجاح',
        description: `تم إضافة شركة ${data.name} بنجاح`,
      });

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error adding company:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في إضافة الشركة',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOrgTypeLabel = (type: string) => {
    switch (type) {
      case 'generator':
        return 'الجهة المولدة';
      case 'transporter':
        return 'الجهة الناقلة';
      case 'recycler':
        return 'الجهة المدورة';
      default:
        return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Building2 className="h-6 w-6 text-primary" />
            إضافة شركة جديدة
          </DialogTitle>
          <DialogDescription>
            أدخل بيانات الشركة الجديدة. الحقول المطلوبة موضحة بنجمة (*)
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] pr-4">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="basic" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    بيانات أساسية
                  </TabsTrigger>
                  <TabsTrigger value="legal" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    الممثلين
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    التراخيص
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="organization_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نوع الشركة *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر نوع الشركة" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="generator">الجهة المولدة</SelectItem>
                              <SelectItem value="transporter">الجهة الناقلة</SelectItem>
                              <SelectItem value="recycler">الجهة المدورة</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>اسم الشركة (عربي) *</FormLabel>
                          <FormControl>
                            <Input placeholder="أدخل اسم الشركة" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="name_en"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>اسم الشركة (إنجليزي)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter company name" dir="ltr" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>البريد الإلكتروني *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="example@company.com" dir="ltr" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رقم الهاتف *</FormLabel>
                          <FormControl>
                            <Input placeholder="05xxxxxxxx" dir="ltr" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="secondary_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رقم هاتف ثانوي</FormLabel>
                          <FormControl>
                            <Input placeholder="05xxxxxxxx" dir="ltr" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>المدينة *</FormLabel>
                          <FormControl>
                            <Input placeholder="أدخل المدينة" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="region"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>المنطقة</FormLabel>
                          <FormControl>
                            <Input placeholder="أدخل المنطقة" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>العنوان التفصيلي *</FormLabel>
                          <FormControl>
                            <Input placeholder="أدخل العنوان كاملاً" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="activity_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نوع النشاط</FormLabel>
                          <FormControl>
                            <Input placeholder="مثال: صناعة، خدمات..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="production_capacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الطاقة الإنتاجية</FormLabel>
                          <FormControl>
                            <Input placeholder="مثال: 1000 طن/شهر" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="legal" className="space-y-6">
                  {/* الممثل القانوني */}
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      الممثل القانوني
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="representative_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الاسم</FormLabel>
                            <FormControl>
                              <Input placeholder="اسم الممثل القانوني" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="representative_position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>المنصب</FormLabel>
                            <FormControl>
                              <Input placeholder="مثال: المدير العام" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="representative_phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الهاتف</FormLabel>
                            <FormControl>
                              <Input placeholder="05xxxxxxxx" dir="ltr" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="representative_email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>البريد الإلكتروني</FormLabel>
                            <FormControl>
                              <Input type="email" dir="ltr" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="representative_national_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الهوية</FormLabel>
                            <FormControl>
                              <Input dir="ltr" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* المفوض */}
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      المفوض
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="delegate_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الاسم</FormLabel>
                            <FormControl>
                              <Input placeholder="اسم المفوض" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="delegate_phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الهاتف</FormLabel>
                            <FormControl>
                              <Input placeholder="05xxxxxxxx" dir="ltr" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="delegate_email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>البريد الإلكتروني</FormLabel>
                            <FormControl>
                              <Input type="email" dir="ltr" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="delegate_national_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الهوية</FormLabel>
                            <FormControl>
                              <Input dir="ltr" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* الوكيل */}
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      الوكيل
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="agent_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الاسم</FormLabel>
                            <FormControl>
                              <Input placeholder="اسم الوكيل" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="agent_phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الهاتف</FormLabel>
                            <FormControl>
                              <Input placeholder="05xxxxxxxx" dir="ltr" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="agent_email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>البريد الإلكتروني</FormLabel>
                            <FormControl>
                              <Input type="email" dir="ltr" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="agent_national_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الهوية</FormLabel>
                            <FormControl>
                              <Input dir="ltr" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="commercial_register"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رقم السجل التجاري</FormLabel>
                          <FormControl>
                            <Input placeholder="أدخل رقم السجل التجاري" dir="ltr" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="environmental_license"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رقم الترخيص البيئي</FormLabel>
                          <FormControl>
                            <Input placeholder="أدخل رقم الترخيص البيئي" dir="ltr" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20 text-sm text-muted-foreground">
                    <p>يمكنك رفع المستندات لاحقاً من صفحة إدارة الشركة</p>
                  </div>
                </TabsContent>
              </Tabs>
            </ScrollArea>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Building2 className="h-4 w-4 ml-2" />
                    إضافة الشركة
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
