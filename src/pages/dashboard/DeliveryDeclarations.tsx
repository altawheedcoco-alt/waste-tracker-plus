import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { FileCheck, Search, Download, Eye, Printer, AlertCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import DeliveryDeclarationViewDialog from '@/components/shipments/DeliveryDeclarationViewDialog';

const DeliveryDeclarations = () => {
  const navigate = useNavigate();
  const { organization } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedDeclaration, setSelectedDeclaration] = useState<any>(null);
  const [viewOpen, setViewOpen] = useState(false);

  const { data: declarations = [], isLoading } = useQuery({
    queryKey: ['all-delivery-declarations', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      // Fetch declarations for shipments related to this organization
      const { data, error } = await supabase
        .from('delivery_declarations')
        .select('*')
        .or(`declared_by_organization_id.eq.${organization.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching declarations:', error);
        return [];
      }

      // Also fetch declarations where org is generator/transporter/recycler on the shipment
      const { data: shipmentDeclarations, error: err2 } = await supabase
        .from('shipments')
        .select('id')
        .or(`organization_id.eq.${organization.id},generator_id.eq.${organization.id},transporter_id.eq.${organization.id},recycler_id.eq.${organization.id}`);

      if (err2 || !shipmentDeclarations?.length) return data || [];

      const shipmentIds = shipmentDeclarations.map((s: any) => s.id);
      
      const { data: allDeclarations, error: err3 } = await supabase
        .from('delivery_declarations')
        .select('*')
        .in('shipment_id', shipmentIds)
        .order('created_at', { ascending: false });

      if (err3) return data || [];

      // Merge and deduplicate
      const merged = [...(data || []), ...(allDeclarations || [])];
      const unique = Array.from(new Map(merged.map((d: any) => [d.id, d])).values());
      return unique;
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 5,
  });

  const filtered = declarations.filter((d: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      d.shipment_number?.toLowerCase().includes(s) ||
      d.driver_name?.toLowerCase().includes(s) ||
      d.waste_type?.toLowerCase().includes(s) ||
      d.generator_name?.toLowerCase().includes(s) ||
      d.transporter_name?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
          <ArrowRight className="w-4 h-4" />
          رجوع
        </Button>
        <div className="text-right flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2 justify-end">
            <FileCheck className="w-7 h-7 text-primary" />
            إقرارات التسليم
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            جميع إقرارات تسليم الشحنات الموقعة من السائقين
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-1 mr-4">
          {filtered.length} إقرار
        </Badge>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="بحث برقم الشحنة أو اسم السائق..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10"
          dir="rtl"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">لا توجد إقرارات تسليم حتى الآن</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((declaration: any) => (
            <Card key={declaration.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => {
                        setSelectedDeclaration(declaration);
                        setViewOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                      عرض
                    </Button>
                  </div>

                  <div className="flex-1 text-right space-y-2">
                    <div className="flex items-center gap-2 justify-end flex-wrap">
                      <Badge variant="outline" className="font-mono text-xs">
                        {declaration.shipment_number || 'غير محدد'}
                      </Badge>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <FileCheck className="w-3 h-3 ml-1" />
                        موقع
                      </Badge>
                      <span className="font-semibold">{declaration.driver_name || 'سائق غير محدد'}</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap justify-end">
                      {declaration.waste_type && <span>النفايات: {declaration.waste_type}</span>}
                      {declaration.quantity && <span>الكمية: {declaration.quantity} {declaration.unit || 'طن'}</span>}
                      {declaration.generator_name && <span>المولد: {declaration.generator_name}</span>}
                      {declaration.transporter_name && <span>الناقل: {declaration.transporter_name}</span>}
                      <span>
                        التاريخ: {declaration.declared_at
                          ? format(new Date(declaration.declared_at), 'dd/MM/yyyy HH:mm', { locale: ar })
                          : format(new Date(declaration.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedDeclaration && (
        <DeliveryDeclarationViewDialog
          open={viewOpen}
          onOpenChange={setViewOpen}
          declaration={selectedDeclaration}
        />
      )}
    </div>
  );
};

export default DeliveryDeclarations;
