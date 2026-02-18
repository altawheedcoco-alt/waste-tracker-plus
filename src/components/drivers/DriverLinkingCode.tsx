import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Copy, RefreshCw, Search, UserPlus, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DriverLinkingCode = () => {
  const { organization } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchCode, setSearchCode] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['drivers-linking-codes', organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('id, linking_code, is_available, profile_id, vehicle_plate, vehicle_type, profiles:profile_id(full_name, phone)')
        .eq('organization_id', organization!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const regenerateCode = useMutation({
    mutationFn: async (driverId: string) => {
      const newCode = 'DRV-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const { error } = await supabase
        .from('drivers')
        .update({ linking_code: newCode } as any)
        .eq('id', driverId);
      if (error) throw error;
      return newCode;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers-linking-codes'] });
      toast({ title: 'تم التجديد', description: 'تم توليد كود ربط جديد بنجاح' });
    },
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: 'تم النسخ', description: `تم نسخ الكود: ${code}` });
  };

  const filteredDrivers = searchCode
    ? drivers.filter((d: any) =>
        d.linking_code?.toLowerCase().includes(searchCode.toLowerCase()) ||
        (d.profiles as any)?.full_name?.toLowerCase().includes(searchCode.toLowerCase())
      )
    : drivers;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary" />
          أكواد ربط السائقين
        </CardTitle>
        <CardDescription>
          كل سائق يحصل على كود فريد يمكن استخدامه لربطه بالشحنات أو مشاركته مع الجهات المرتبطة
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو الكود..."
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            className="pr-10"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse h-16 bg-muted rounded-lg" />
            ))}
          </div>
        ) : filteredDrivers.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">لا يوجد سائقين</p>
        ) : (
          <div className="space-y-3">
            {filteredDrivers.map((driver: any) => {
              const profile = driver.profiles;
              const name = profile?.full_name || 'سائق بدون اسم';
              const code = driver.linking_code || '—';

              return (
                <div
                  key={driver.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyCode(code)}
                      disabled={!driver.linking_code}
                    >
                      {copied === code ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => regenerateCode.mutate(driver.id)}
                      disabled={regenerateCode.isPending}
                    >
                      <RefreshCw className={`w-4 h-4 ${regenerateCode.isPending ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className="font-medium text-sm">{name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {driver.vehicle_plate || '—'} • {driver.vehicle_type || '—'}
                        </span>
                      </div>
                    </div>
                    <div className="text-center">
                      <Badge
                        variant="outline"
                        className="font-mono text-base px-3 py-1 bg-primary/5 border-primary/20"
                      >
                        {code}
                      </Badge>
                      <Badge
                        variant={driver.is_available ? 'default' : 'secondary'}
                        className="text-[10px] mt-1 block"
                      >
                        {driver.is_available ? 'متاح' : 'مشغول'}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DriverLinkingCode;
