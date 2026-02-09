import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Search, UserCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DriverResult {
  full_name: string;
  phone: string | null;
  vehicle_plate: string | null;
  vehicle_type: string | null;
  is_available: boolean;
  organization_name: string | null;
}

const DriverCodeLookup = () => {
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DriverResult | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);
    setNotFound(false);

    try {
      const { data, error } = await (supabase
        .from('drivers')
        .select('vehicle_plate, vehicle_type, is_available, profile_id, organization_id, profiles:profile_id(full_name, phone)') as any)
        .eq('linking_code', code.trim().toUpperCase())
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setNotFound(true);
        return;
      }

      // Fetch org name
      let orgName: string | null = null;
      if (data.organization_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', data.organization_id)
          .single();
        orgName = org?.name || null;
      }

      const profile = data.profiles as any;
      setResult({
        full_name: profile?.full_name || 'غير معروف',
        phone: profile?.phone || null,
        vehicle_plate: data.vehicle_plate,
        vehicle_type: data.vehicle_type,
        is_available: data.is_available,
        organization_name: orgName,
      });
    } catch (err) {
      console.error(err);
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء البحث', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5 text-primary" />
          التحقق من سائق بكود الربط
        </CardTitle>
        <CardDescription>
          أدخل كود ربط السائق للتحقق من هويته وبياناته قبل استلام أو تسليم الشحنة
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={handleSearch} disabled={loading || !code.trim()}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span className="mr-1">بحث</span>
          </Button>
          <Input
            placeholder="أدخل كود الربط مثل DRV-XXXXXX"
            value={code}
            onChange={(e) => { setCode(e.target.value); setNotFound(false); setResult(null); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="text-center font-mono"
            dir="ltr"
          />
        </div>

        {notFound && (
          <div className="flex items-center gap-2 p-4 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive">
            <AlertCircle className="w-5 h-5" />
            <span>لم يتم العثور على سائق بهذا الكود</span>
          </div>
        )}

        {result && (
          <div className="p-4 rounded-lg border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant={result.is_available ? 'default' : 'secondary'}>
                {result.is_available ? 'متاح' : 'مشغول'}
              </Badge>
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary" />
                <span className="font-bold">{result.full_name}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-right">
              {result.phone && (
                <div>
                  <span className="text-muted-foreground">الهاتف: </span>
                  <span dir="ltr">{result.phone}</span>
                </div>
              )}
              {result.vehicle_plate && (
                <div>
                  <span className="text-muted-foreground">لوحة المركبة: </span>
                  <span>{result.vehicle_plate}</span>
                </div>
              )}
              {result.vehicle_type && (
                <div>
                  <span className="text-muted-foreground">نوع المركبة: </span>
                  <span>{result.vehicle_type}</span>
                </div>
              )}
              {result.organization_name && (
                <div>
                  <span className="text-muted-foreground">شركة النقل: </span>
                  <span>{result.organization_name}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DriverCodeLookup;
