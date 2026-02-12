import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileSignature,
  FileCheck,
  Receipt,
  Truck,
  Building2,
  Recycle,
  CheckCircle2,
  Clock,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import GeneratorHandoverDialog from './GeneratorHandoverDialog';
import DeliveryDeclarationViewDialog from './DeliveryDeclarationViewDialog';

interface ShipmentDocumentsTimelineProps {
  shipment: {
    id: string;
    shipment_number: string;
    waste_type: string;
    quantity: number;
    unit?: string;
    status: string;
    generator_id?: string;
    transporter_id?: string;
    recycler_id?: string;
    generator?: { name: string } | null;
    transporter?: { name: string } | null;
    recycler?: { name: string } | null;
    manual_disposal_name?: string;
  };
  onRefresh?: () => void;
}

interface DocumentStep {
  key: string;
  label: string;
  icon: React.ReactNode;
  colorClass: string;
  description: string;
  status: 'completed' | 'pending' | 'not_applicable';
  signedBy?: string;
  signedAt?: string;
  actionAvailable?: boolean;
  data?: any;
}

const ShipmentDocumentsTimeline = ({ shipment, onRefresh }: ShipmentDocumentsTimelineProps) => {
  const { organization } = useAuth();
  const [showGeneratorHandover, setShowGeneratorHandover] = useState(false);
  const [showDeclarationView, setShowDeclarationView] = useState<any>(null);

  // Fetch all declarations for this shipment
  const { data: declarations = [], refetch: refetchDeclarations } = useQuery({
    queryKey: ['shipment-documents', shipment.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_declarations')
        .select('*')
        .eq('shipment_id', shipment.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching declarations:', error);
        return [];
      }
      return data || [];
    },
    staleTime: 1000 * 60 * 2,
  });

  // Fetch receipts for this shipment
  const { data: receipts = [] } = useQuery({
    queryKey: ['shipment-receipts', shipment.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('receipts' as any)
        .select('id, receipt_number, status, created_at, issued_by_name')
        .eq('shipment_id', shipment.id)
        .order('created_at', { ascending: true });

      if (error) return [] as any[];
      return (data || []) as any[];
    },
    staleTime: 1000 * 60 * 2,
  });

  const generatorDeclaration = declarations.find((d: any) => d.declaration_type === 'generator_handover');
  const transporterDeclaration = declarations.find((d: any) => d.declaration_type === 'transporter_delivery' || !d.declaration_type);
  const latestReceipt = receipts[receipts.length - 1] as any;

  const isGenerator = organization?.id === shipment.generator_id;

  // Build the document steps
  const steps: DocumentStep[] = [
    {
      key: 'generator_handover',
      label: 'إقرار تسليم المولّد',
      icon: <Building2 className="w-4 h-4" />,
      colorClass: 'blue',
      description: 'المولّد يُقر بتسليم المخلفات للناقل',
      status: generatorDeclaration ? 'completed' : 'pending',
      signedBy: generatorDeclaration?.driver_name || generatorDeclaration?.generator_name,
      signedAt: generatorDeclaration?.declared_at,
      actionAvailable: isGenerator && !generatorDeclaration,
      data: generatorDeclaration,
    },
    {
      key: 'transporter_delivery',
      label: 'إقرار تسليم الناقل',
      icon: <Truck className="w-4 h-4" />,
      colorClass: 'purple',
      description: 'الناقل/السائق يُقر بتسليم الشحنة للمدوّر',
      status: transporterDeclaration ? 'completed' : 'pending',
      signedBy: transporterDeclaration?.driver_name || transporterDeclaration?.transporter_name,
      signedAt: transporterDeclaration?.declared_at,
      data: transporterDeclaration,
    },
    {
      key: 'receipt',
      label: 'شهادة الاستلام',
      icon: <Receipt className="w-4 h-4" />,
      colorClass: 'green',
      description: 'شهادة استلام من المدوّر/جهة التخلص',
      status: latestReceipt ? 'completed' : 'pending',
      signedBy: latestReceipt?.issued_by_name,
      signedAt: latestReceipt?.created_at,
      data: latestReceipt,
    },
  ];

  const completedCount = steps.filter(s => s.status === 'completed').length;
  const totalSteps = steps.length;

  const getColorClasses = (color: string, status: string) => {
    if (status === 'completed') {
      return {
        bg: `bg-${color}-100 dark:bg-${color}-900/30`,
        border: `border-${color}-300 dark:border-${color}-700`,
        text: `text-${color}-800 dark:text-${color}-200`,
        icon: `text-${color}-600`,
        line: `bg-${color}-400`,
      };
    }
    return {
      bg: 'bg-muted/30',
      border: 'border-muted',
      text: 'text-muted-foreground',
      icon: 'text-muted-foreground',
      line: 'bg-muted',
    };
  };

  return (
    <>
      <Card>
        <CardHeader className="text-right pb-3">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {completedCount}/{totalSteps} مكتمل
            </Badge>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-primary" />
              سلسلة المستندات
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {steps.map((step, index) => {
              const isCompleted = step.status === 'completed';
              return (
                <div key={step.key} className="flex gap-3" dir="rtl">
                  {/* Timeline Line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      isCompleted
                        ? 'bg-green-100 border-green-400 dark:bg-green-900/30 dark:border-green-600'
                        : 'bg-muted/50 border-muted-foreground/20'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-0.5 h-full min-h-[32px] ${
                        isCompleted ? 'bg-green-300 dark:bg-green-700' : 'bg-muted'
                      }`} />
                    )}
                  </div>

                  {/* Content */}
                  <div className={`flex-1 pb-4 ${index < steps.length - 1 ? '' : ''}`}>
                    <div className={`p-3 rounded-lg border ${
                      isCompleted
                        ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20'
                        : 'border-muted bg-muted/10'
                    }`}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          {step.icon}
                          <span className="font-semibold text-sm">{step.label}</span>
                        </div>
                        {isCompleted && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-[10px]">
                            مكتمل ✓
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground mb-2">{step.description}</p>

                      {isCompleted && (
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="text-muted-foreground">
                            {step.signedBy && <>بواسطة: <strong>{step.signedBy}</strong></>}
                            {step.signedAt && (
                              <> — {format(new Date(step.signedAt), 'dd/MM/yyyy HH:mm', { locale: ar })}</>
                            )}
                          </div>
                          {step.data && step.key !== 'receipt' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[10px] px-2"
                              onClick={() => setShowDeclarationView(step.data)}
                            >
                              <FileSignature className="w-3 h-3 ml-1" />
                              عرض
                            </Button>
                          )}
                        </div>
                      )}

                      {!isCompleted && step.actionAvailable && (
                        <Button
                          variant="eco"
                          size="sm"
                          className="mt-2 w-full h-8 text-xs"
                          onClick={() => {
                            if (step.key === 'generator_handover') {
                              setShowGeneratorHandover(true);
                            }
                          }}
                        >
                          <FileSignature className="w-3 h-3 ml-1" />
                          توقيع الإقرار
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Generator Handover Dialog */}
      <GeneratorHandoverDialog
        open={showGeneratorHandover}
        onOpenChange={setShowGeneratorHandover}
        shipment={{
          id: shipment.id,
          shipment_number: shipment.shipment_number,
          waste_type: shipment.waste_type,
          quantity: shipment.quantity,
          unit: shipment.unit,
          transporter_name: shipment.transporter?.name,
          recycler_name: shipment.recycler?.name,
          disposal_name: shipment.manual_disposal_name,
        }}
        onConfirmed={() => {
          refetchDeclarations();
          onRefresh?.();
        }}
      />

      {/* Declaration View Dialog */}
      {showDeclarationView && (
        <DeliveryDeclarationViewDialog
          open={!!showDeclarationView}
          onOpenChange={(open) => { if (!open) setShowDeclarationView(null); }}
          declaration={showDeclarationView}
        />
      )}
    </>
  );
};

export default ShipmentDocumentsTimeline;
