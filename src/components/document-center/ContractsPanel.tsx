/**
 * لوحة العقود والاتفاقيات
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileSignature, ArrowRight, FileText, Award, Plus, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ar as arLocale } from 'date-fns/locale';

const ContractsPanel = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();

  const { data: contracts = [] } = useQuery({
    queryKey: ['doc-center-contracts', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('contracts')
        .select('id, title, status, contract_type, start_date, end_date, created_at')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: awardLetters = [] } = useQuery({
    queryKey: ['doc-center-award-letters', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('award_letters')
        .select('id, title, status, letter_number, created_at')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const statusColor = (s: string) => {
    if (s === 'active' || s === 'approved') return 'default';
    if (s === 'pending') return 'outline';
    if (s === 'expired' || s === 'cancelled') return 'destructive';
    return 'secondary';
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">{contracts.length}</p>
            <p className="text-xs text-muted-foreground">عقود</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{awardLetters.length}</p>
            <p className="text-xs text-muted-foreground">خطابات ترسية</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{contracts.filter((c: any) => c.status === 'active').length}</p>
            <p className="text-xs text-muted-foreground">نشطة</p>
          </CardContent>
        </Card>
      </div>

      {/* Contracts list */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold flex items-center gap-2"><FileSignature className="w-4 h-4" />العقود</h3>
        {contracts.length === 0 ? (
          <Card><CardContent className="py-6 text-center text-muted-foreground text-sm">لا توجد عقود</CardContent></Card>
        ) : (
          contracts.slice(0, 10).map((c: any) => (
            <Card key={c.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate('/dashboard/contracts')}>
              <CardContent className="p-3 flex items-center gap-3">
                <FileSignature className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{c.title}</p>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: arLocale })}
                  </span>
                </div>
                <Badge variant={statusColor(c.status)} className="text-[10px]">{c.status}</Badge>
              </CardContent>
            </Card>
          ))
        )}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => navigate('/dashboard/contracts')}>
            عرض الكل <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/dashboard/award-letters')}>
            <Award className="w-3.5 h-3.5" /> خطابات الترسية
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/dashboard/contract-templates')}>
            <FileText className="w-3.5 h-3.5" /> القوالب
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContractsPanel;
