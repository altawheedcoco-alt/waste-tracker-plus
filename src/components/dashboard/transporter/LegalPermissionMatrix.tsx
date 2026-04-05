/**
 * مصفوفة الصلاحيات القانونية - فكرة #14
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scale, Check, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface PermissionItem {
  action: string;
  allowed: boolean;
  reason: string;
}

export default function LegalPermissionMatrix() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: docs, isLoading } = useQuery({
    queryKey: ['legal-permissions', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('entity_documents')
        .select('document_type, metadata, status')
        .eq('organization_id', orgId!)
        .in('status', ['active', 'approved']);
      return (data || []) as any[];
    },
  });

  const matrix = useMemo((): PermissionItem[] => {
    const types = new Set((docs || []).map((p: any) => p.document_type));
    const conditions = (docs || []).reduce((acc: any, p: any) => {
      const meta = p.metadata as any;
      if (meta) Object.assign(acc, meta);
      return acc;
    }, {} as any);

    const wasteTypes = new Set(conditions.waste_types || []);

    return [
      { action: 'نقل مخلفات خطرة', allowed: wasteTypes.has('hazardous'), reason: wasteTypes.has('hazardous') ? 'مصرح بموجب الموافقة البيئية' : 'يتطلب موافقة EEAA للمخلفات الخطرة' },
      { action: 'نقل مخلفات طبية', allowed: wasteTypes.has('medical'), reason: wasteTypes.has('medical') ? 'مصرح' : 'يتطلب ترخيص خاص للمخلفات الطبية' },
      { action: 'نقل مخلفات بترولية', allowed: wasteTypes.has('petroleum'), reason: wasteTypes.has('petroleum') ? 'مصرح' : 'يتطلب موافقة إضافية' },
      { action: 'العمل عموم الجمهورية', allowed: conditions.nationwide === true, reason: conditions.nationwide ? 'مصرح' : 'محدود بنطاق جغرافي' },
      { action: 'تخزين مؤقت للمخلفات', allowed: types.has('temporary_storage'), reason: types.has('temporary_storage') ? 'مصرح بموجب ترخيص التخزين' : 'يتطلب ترخيص تخزين مؤقت' },
      { action: 'نقل عبر المحافظات', allowed: (conditions.governorates?.length || 0) > 1 || conditions.nationwide, reason: 'حسب نطاق الترخيص الجغرافي' },
      { action: 'إصدار مانيفست', allowed: types.has('wmra_license'), reason: types.has('wmra_license') ? 'مصرح بموجب WMRA' : 'يتطلب ترخيص WMRA' },
    ];
  }, [docs]);

  if (isLoading) return <Skeleton className="h-[280px] w-full rounded-xl" />;

  const allowedCount = matrix.filter(m => m.allowed).length;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Scale className="h-5 w-5 text-primary" />
            الصلاحيات القانونية
          </CardTitle>
          <Badge variant="outline" className="text-[10px]">{allowedCount}/{matrix.length} مصرح</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {matrix.map((item, i) => (
            <div key={i} className={`flex items-center gap-2 p-2 rounded-lg ${item.allowed ? 'bg-emerald-500/5' : 'bg-muted/30'}`}>
              {item.allowed ? (
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className={`text-xs ${item.allowed ? 'font-medium' : 'text-muted-foreground'}`}>{item.action}</p>
                <p className="text-[9px] text-muted-foreground truncate">{item.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}