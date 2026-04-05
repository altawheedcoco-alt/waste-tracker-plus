/**
 * دليل الشركاء المعتمدين حسب المنطقة
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building2, Star, Phone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

const CertifiedPartnersDirectory = () => {
  const [search, setSearch] = useState('');

  const { data: partners = [] } = useQuery({
    queryKey: ['certified-partners-directory'],
    queryFn: async () => {
      const { data } = await supabase
        .from('organizations')
        .select('id, name, city, phone, org_type, address')
        .in('org_type', ['transporter', 'recycler'])
        .eq('status', 'active')
        .order('name')
        .limit(50);
      return (data || []) as any[];
    },
  });

  const filtered = partners.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.city?.toLowerCase().includes(search.toLowerCase())
  );

  const typeLabel: Record<string, string> = { transporter: 'ناقل', recycler: 'مدوّر' };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 justify-end">
          <Building2 className="h-4 w-4 text-primary" />
          دليل الشركاء المعتمدين
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2" dir="rtl">
        <Input
          className="h-8 text-xs"
          placeholder="🔍 بحث بالاسم أو المدينة..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div className="max-h-[250px] overflow-y-auto space-y-1.5">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">لا توجد نتائج</p>
          ) : (
            filtered.map(p => (
              <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-[10px]">
                    {typeLabel[p.org_type] || p.org_type}
                  </Badge>
                  {p.phone && (
                    <a href={`tel:${p.phone}`} className="text-primary hover:underline">
                      <Phone className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium">{p.name}</span>
                  {p.city && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 justify-end">
                      <MapPin className="h-2.5 w-2.5" />
                      {p.city}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CertifiedPartnersDirectory;
