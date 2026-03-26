import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Package } from 'lucide-react';
import { useMemo } from 'react';

const DisposalInputIntelligence = () => {
  const { organization } = useAuth();

  const { data: shipments, isLoading } = useQuery({
    queryKey: ['disposal-input-intel', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      const { data } = await supabase
        .from('shipments')
        .select('id, waste_type, quantity, created_at')
        .eq('recycler_id', organization.id)
        .gte('created_at', twoYearsAgo.toISOString())
        .order('created_at', { ascending: true });
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const yoyData = useMemo(() => {
    if (!shipments?.length) return [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const lastYear = currentYear - 1;
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    return Array.from({ length: 12 }, (_, i) => i + 1)
      .filter((_, i) => i <= now.getMonth())
      .map(month => {
        const cy = shipments.filter(s => { const d = new Date(s.created_at); return d.getFullYear() === currentYear && d.getMonth() + 1 === month; });
        const ly = shipments.filter(s => { const d = new Date(s.created_at); return d.getFullYear() === lastYear && d.getMonth() + 1 === month; });
        return {
          month: monthNames[month - 1],
          [`${currentYear}`]: Math.round(cy.reduce((s, sh) => s + (sh.quantity || 0), 0) * 10) / 10,
          [`${lastYear}`]: Math.round(ly.reduce((s, sh) => s + (sh.quantity || 0), 0) * 10) / 10,
        };
      });
  }, [shipments]);

  if (isLoading) return <Skeleton className="h-[300px]" />;
  if (!yoyData.length) return null;

  return (
    <Card>
      <CardHeader>
        <div className="text-right">
          <CardTitle className="flex items-center gap-2 justify-end">
            <Package className="w-5 h-5" />
            تحليل المخلفات الواردة — التخلص
          </CardTitle>
          <CardDescription>مقارنة سنوية لحجم الاستقبال</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={yoyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" fontSize={11} />
            <YAxis fontSize={11} />
            <Tooltip />
            <Legend />
            <Bar dataKey={`${new Date().getFullYear() - 1}`} fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
            <Bar dataKey={`${new Date().getFullYear()}`} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default DisposalInputIntelligence;
