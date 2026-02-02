import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Database, Loader2, CheckCircle, AlertTriangle, FileText, CreditCard, DollarSign, Package, Users } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type SeedCategory = 'invoices' | 'payments' | 'expenses' | 'priceItems' | 'balances';

const SeedDataSettings = () => {
  const { organization, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<SeedCategory[]>([
    'invoices',
    'payments',
    'expenses',
    'priceItems',
    'balances'
  ]);
  const [results, setResults] = useState<{ category: string; success: boolean; count: number }[]>([]);

  const categories: { id: SeedCategory; label: string; icon: typeof FileText; description: string }[] = [
    { id: 'invoices', label: 'الفواتير', icon: FileText, description: 'فواتير مبيعات ومشتريات' },
    { id: 'payments', label: 'المدفوعات', icon: CreditCard, description: 'سجلات الدفع والتحصيل' },
    { id: 'expenses', label: 'المصروفات', icon: DollarSign, description: 'مصروفات تشغيلية متنوعة' },
    { id: 'priceItems', label: 'الأصناف والأسعار', icon: Package, description: 'قائمة أصناف وأسعار للشركاء' },
    { id: 'balances', label: 'أرصدة الشركاء', icon: Users, description: 'أرصدة مالية تجريبية' },
  ];

  const toggleCategory = (id: SeedCategory) => {
    setSelectedCategories(prev => 
      prev.includes(id) 
        ? prev.filter(c => c !== id)
        : [...prev, id]
    );
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}-${rand}`;
  };

  const generatePaymentNumber = () => {
    const date = new Date();
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `PAY-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}-${rand}`;
  };

  const generateExpenseNumber = () => {
    const date = new Date();
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `EXP-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}-${rand}`;
  };

  const generateItemCode = (index: number) => {
    const date = new Date();
    return `ITM-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${(index + 1).toString().padStart(4, '0')}`;
  };

  const seedData = async () => {
    if (!organization?.id || !user?.id) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    if (selectedCategories.length === 0) {
      toast.error('يرجى اختيار فئة واحدة على الأقل');
      return;
    }

    setIsLoading(true);
    setResults([]);
    const newResults: { category: string; success: boolean; count: number }[] = [];

    try {
      // Fetch partner organizations
      const { data: partners } = await supabase
        .from('organizations')
        .select('id, name, organization_type')
        .neq('id', organization.id)
        .limit(5);

      if (!partners || partners.length === 0) {
        toast.error('لا يوجد شركاء لإنشاء بيانات تجريبية معهم');
        setIsLoading(false);
        return;
      }

      // Seed Invoices
      if (selectedCategories.includes('invoices')) {
        try {
          const invoices = partners.slice(0, 3).flatMap((partner, idx) => [
            {
              invoice_number: generateInvoiceNumber(),
              organization_id: organization.id,
              partner_organization_id: partner.id,
              partner_name: partner.name,
              invoice_type: 'sales',
              invoice_category: 'shipment',
              status: 'pending',
              issue_date: new Date().toISOString().split('T')[0],
              due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              subtotal: 5000 + idx * 1500,
              tax_rate: 14,
              tax_amount: (5000 + idx * 1500) * 0.14,
              total_amount: (5000 + idx * 1500) * 1.14,
              remaining_amount: (5000 + idx * 1500) * 1.14,
              created_by: user.id,
            },
            {
              invoice_number: generateInvoiceNumber(),
              organization_id: organization.id,
              partner_organization_id: partner.id,
              partner_name: partner.name,
              invoice_type: 'purchase',
              invoice_category: 'service',
              status: 'paid',
              issue_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              subtotal: 3000 + idx * 500,
              tax_rate: 14,
              tax_amount: (3000 + idx * 500) * 0.14,
              total_amount: (3000 + idx * 500) * 1.14,
              paid_amount: (3000 + idx * 500) * 1.14,
              remaining_amount: 0,
              created_by: user.id,
            }
          ]);

          const { error } = await supabase.from('invoices').insert(invoices);
          if (error) throw error;
          newResults.push({ category: 'الفواتير', success: true, count: invoices.length });
        } catch (error) {
          console.error('Error seeding invoices:', error);
          newResults.push({ category: 'الفواتير', success: false, count: 0 });
        }
      }

      // Seed Payments
      if (selectedCategories.includes('payments')) {
        try {
          const payments = partners.slice(0, 2).map((partner, idx) => ({
            payment_number: generatePaymentNumber(),
            organization_id: organization.id,
            partner_organization_id: partner.id,
            partner_name: partner.name,
            amount: 2000 + idx * 1000,
            payment_method: idx === 0 ? 'bank_transfer' : 'cash',
            payment_type: idx === 0 ? 'incoming' : 'outgoing',
            status: 'completed',
            payment_date: new Date().toISOString().split('T')[0],
            notes: `دفعة تجريبية رقم ${idx + 1}`,
            created_by: user.id,
          }));

          const { error } = await supabase.from('payments').insert(payments);
          if (error) throw error;
          newResults.push({ category: 'المدفوعات', success: true, count: payments.length });
        } catch (error) {
          console.error('Error seeding payments:', error);
          newResults.push({ category: 'المدفوعات', success: false, count: 0 });
        }
      }

      // Seed Expenses
      if (selectedCategories.includes('expenses')) {
        try {
          const expenseCategories = [
            { category: 'fuel', description: 'وقود سيارات النقل', amount: 1500 },
            { category: 'maintenance', description: 'صيانة المركبات', amount: 2500 },
            { category: 'salaries', description: 'رواتب الموظفين', amount: 15000 },
            { category: 'utilities', description: 'فواتير المرافق', amount: 800 },
            { category: 'equipment', description: 'معدات ومستلزمات', amount: 3000 },
          ];

          const expenses = expenseCategories.map((exp, idx) => ({
            expense_number: generateExpenseNumber(),
            organization_id: organization.id,
            category: exp.category,
            description: exp.description,
            amount: exp.amount,
            expense_date: new Date(Date.now() - idx * 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            payment_method: idx % 2 === 0 ? 'cash' : 'bank_transfer',
            status: 'approved',
            created_by: user.id,
          }));

          const { error } = await supabase.from('expenses').insert(expenses);
          if (error) throw error;
          newResults.push({ category: 'المصروفات', success: true, count: expenses.length });
        } catch (error) {
          console.error('Error seeding expenses:', error);
          newResults.push({ category: 'المصروفات', success: false, count: 0 });
        }
      }

      // Seed Price Items
      if (selectedCategories.includes('priceItems')) {
        try {
          const priceItems = partners.slice(0, 2).flatMap((partner, pIdx) => [
            {
              item_code: generateItemCode(pIdx * 3),
              item_name: 'نقل نفايات صناعية',
              organization_id: organization.id,
              partner_organization_id: partner.id,
              unit_price: 500,
              unit: 'طن',
              price_type: 'fixed',
              waste_type: 'نفايات صناعية',
              is_active: true,
            },
            {
              item_code: generateItemCode(pIdx * 3 + 1),
              item_name: 'معالجة بلاستيك',
              organization_id: organization.id,
              partner_organization_id: partner.id,
              unit_price: 2.5,
              unit: 'كجم',
              price_type: 'variable',
              waste_type: 'بلاستيك',
              is_active: true,
            },
            {
              item_code: generateItemCode(pIdx * 3 + 2),
              item_name: 'رسوم تحميل',
              organization_id: organization.id,
              partner_organization_id: partner.id,
              unit_price: 150,
              unit: 'رحلة',
              price_type: 'fixed',
              is_active: true,
            },
          ]);

          const { error } = await supabase.from('partner_price_items').insert(priceItems);
          if (error) throw error;
          newResults.push({ category: 'الأصناف والأسعار', success: true, count: priceItems.length });
        } catch (error) {
          console.error('Error seeding price items:', error);
          newResults.push({ category: 'الأصناف والأسعار', success: false, count: 0 });
        }
      }

      // Seed Partner Balances
      if (selectedCategories.includes('balances')) {
        try {
          const balances = partners.slice(0, 3).map((partner, idx) => ({
            organization_id: organization.id,
            partner_organization_id: partner.id,
            balance: idx === 0 ? 5000 : idx === 1 ? -3000 : 0,
            total_invoiced: 10000 + idx * 2000,
            total_paid: idx === 0 ? 5000 : idx === 1 ? 13000 : 10000,
            last_transaction_date: new Date().toISOString(),
          }));

          // Use upsert to avoid conflicts
          for (const balance of balances) {
            const { error } = await supabase
              .from('partner_balances')
              .upsert(balance, { 
                onConflict: 'organization_id,partner_organization_id',
                ignoreDuplicates: false 
              });
            if (error) console.error('Error upserting balance:', error);
          }
          newResults.push({ category: 'أرصدة الشركاء', success: true, count: balances.length });
        } catch (error) {
          console.error('Error seeding balances:', error);
          newResults.push({ category: 'أرصدة الشركاء', success: false, count: 0 });
        }
      }

      setResults(newResults);
      const successCount = newResults.filter(r => r.success).length;
      if (successCount === newResults.length) {
        toast.success('تم إنشاء البيانات التجريبية بنجاح');
      } else if (successCount > 0) {
        toast.warning('تم إنشاء بعض البيانات التجريبية');
      } else {
        toast.error('فشل إنشاء البيانات التجريبية');
      }
    } catch (error) {
      console.error('Error seeding data:', error);
      toast.error('حدث خطأ أثناء إنشاء البيانات التجريبية');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          البيانات التجريبية
        </CardTitle>
        <CardDescription>
          إنشاء بيانات تجريبية للنظام المحاسبي لاختبار الوظائف
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>تنبيه</AlertTitle>
          <AlertDescription>
            سيتم إنشاء بيانات تجريبية جديدة في قاعدة البيانات. هذه البيانات للاختبار فقط.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <Label className="text-base font-medium">اختر الفئات المراد إنشاؤها:</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => {
              const IconComponent = category.icon;
              const isSelected = selectedCategories.includes(category.id);
              return (
                <div
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleCategory(category.id)}
                  />
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{category.label}</p>
                    <p className="text-xs text-muted-foreground">{category.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {results.length > 0 && (
          <div className="space-y-2">
            <Label className="text-base font-medium">النتائج:</Label>
            <div className="space-y-2">
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    result.success ? 'bg-green-500/10' : 'bg-red-500/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <span>{result.category}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {result.success ? `${result.count} سجل` : 'فشل'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={seedData}
          disabled={isLoading || selectedCategories.length === 0}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              جاري إنشاء البيانات...
            </>
          ) : (
            <>
              <Database className="h-4 w-4 ml-2" />
              إنشاء البيانات التجريبية
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SeedDataSettings;
