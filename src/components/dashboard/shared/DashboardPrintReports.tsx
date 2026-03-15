import { memo, useState, useCallback } from 'react';
import { Printer, FileText, Receipt, Loader2, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { generateReceiptTemplate } from './printTemplates/receiptTemplate';
import { generateA4Template } from './printTemplates/a4Template';
import { generateComprehensiveTemplate } from './printTemplates/comprehensiveTemplate';
import { useGuillocheBackground } from '@/hooks/useGuillocheBackground';
import { useMyPermissions } from '@/hooks/useMyPermissions';

const statusLabel = (s: string) => {
  const map: Record<string, string> = {
    new: 'جديدة', pending: 'معلقة', approved: 'معتمدة', collecting: 'قيد الجمع',
    in_transit: 'في الطريق', delivered: 'تم التسليم',
    confirmed: 'مؤكدة', cancelled: 'ملغاة', completed: 'مكتملة',
  };
  return map[s] || s;
};

const wasteTypeLabel = (w: string) => {
  const map: Record<string, string> = {
    plastic: 'بلاستيك', paper: 'ورق', metal: 'معادن', glass: 'زجاج',
    chemical: 'كيميائي', organic: 'عضوي', electronic: 'إلكتروني',
    hazardous: 'خطر', medical: 'طبي', construction: 'مخلفات بناء',
  };
  return map[w] || w;
};

const orgTypeLabel = (t: string) => {
  const map: Record<string, string> = {
    generator: 'مولّد', transporter: 'ناقل', recycler: 'مدوّر', disposal: 'تخلص نهائي',
  };
  return map[t] || t;
};

/** Shared print reports button for all dashboard headers */
const DashboardPrintReports = memo(() => {
  const { organization, profile, user } = useAuth();
  const [isPrinting, setIsPrinting] = useState(false);
  const { backgroundHTML, hasBackground } = useGuillocheBackground();
  const { hasPermission, isAdmin, isCompanyAdmin } = useMyPermissions();
  const orgId = organization?.id;

  const { data: todayData } = useQuery({
    queryKey: ['dashboard-print-today', orgId],
    enabled: !!orgId,
    staleTime: 30_000,
    queryFn: async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const [shipmentsRes, ledgerRes, notifRes, driversRes, receiptsRes]: any[] = await Promise.all([
        supabase.from('shipments')
          .select('id, shipment_number, status, waste_type, quantity, unit, weighbridge_net_weight, created_at, pickup_address, delivery_address, manual_vehicle_plate, manual_driver_name, hazard_level, packaging_method, disposal_method, notes, generator_id, recycler_id, transporter_id, driver_id, approved_at, in_transit_at, delivered_at, confirmed_at')
          .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`)
          .gte('created_at', todayStart.toISOString()).lte('created_at', todayEnd.toISOString())
          .order('created_at', { ascending: false }),
        supabase.from('accounting_ledger')
          .select('id, entry_type, entry_category, amount, description, entry_date, reference_number, verified')
          .eq('organization_id', orgId!)
          .gte('entry_date', todayStart.toISOString().split('T')[0]).lte('entry_date', todayEnd.toISOString().split('T')[0])
          .order('entry_date', { ascending: false }),
        supabase.from('notifications' as any)
          .select('id, title, message, created_at, type')
          .eq('organization_id', orgId!)
          .gte('created_at', todayStart.toISOString())
          .order('created_at', { ascending: false }).limit(20),
        supabase.from('drivers')
          .select('id, license_number, vehicle_type, vehicle_plate, profile:profiles(full_name, phone)')
          .eq('organization_id', orgId!),
        supabase.from('shipment_receipts')
          .select('id, receipt_number, status, receipt_type, actual_weight, unit, created_at, shipment_id')
          .gte('created_at', todayStart.toISOString()).lte('created_at', todayEnd.toISOString())
          .order('created_at', { ascending: false }),
      ]);

      const shipments = shipmentsRes.data || [];
      const ledger = ledgerRes.data || [];
      const notifications = notifRes.data || [];
      const drivers = (driversRes.data || []).map((d: any) => ({
        ...d, profile: Array.isArray(d.profile) ? d.profile[0] : d.profile,
      }));
      const receipts = receiptsRes.data || [];

      const partnerIds = [...new Set([
        ...shipments.map((s: any) => s.generator_id).filter(Boolean),
        ...shipments.map((s: any) => s.recycler_id).filter(Boolean),
        ...shipments.map((s: any) => s.transporter_id).filter(Boolean),
      ].filter((id: string) => id !== orgId))] as string[];

      let partners: any[] = [];
      if (partnerIds.length > 0) {
        const { data } = await supabase.from('organizations').select('id, name, organization_type, city, phone').in('id', partnerIds);
        partners = data || [];
      }

      const totalWeight = shipments.reduce((s: number, sh: any) => s + (sh.weighbridge_net_weight || sh.quantity || 0), 0);
      const totalRevenue = ledger.filter((l: any) => l.entry_type === 'credit').reduce((s: number, l: any) => s + l.amount, 0);
      const totalExpenses = ledger.filter((l: any) => l.entry_type === 'debit').reduce((s: number, l: any) => s + l.amount, 0);

      const statusCounts: Record<string, number> = {};
      shipments.forEach((s: any) => { statusCounts[s.status] = (statusCounts[s.status] || 0) + 1; });

      const wasteTypeCounts: Record<string, { count: number; weight: number }> = {};
      shipments.forEach((s: any) => {
        const wt = s.waste_type || 'غير محدد';
        if (!wasteTypeCounts[wt]) wasteTypeCounts[wt] = { count: 0, weight: 0 };
        wasteTypeCounts[wt].count += 1;
        wasteTypeCounts[wt].weight += (s.weighbridge_net_weight || s.quantity || 0);
      });

      return {
        shipments, ledger, notifications, drivers, receipts, partners,
        totalWeight, totalRevenue, totalExpenses, statusCounts, wasteTypeCounts,
      };
    },
  });

  const canPrint = isAdmin || isCompanyAdmin || hasPermission('print_documents');

  const printReport = useCallback((type: 'receipt' | 'a4' | 'comprehensive') => {
    if (!canPrint) {
      toast.error('ليس لديك صلاحية طباعة المستندات. تواصل مع مدير الجهة لمنحك الصلاحية.');
      return;
    }
    if (!todayData || !organization) {
      toast.error('لا توجد بيانات متاحة');
      return;
    }
    setIsPrinting(true);

    const now = new Date();
    const dateStr = format(now, 'yyyy/MM/dd', { locale: ar });
    const timeStr = format(now, 'HH:mm:ss');
    const dayName = format(now, 'EEEE', { locale: ar });
    const orgName = organization.name || 'المنظمة';
    const userName = profile?.full_name || 'المستخدم';

    let html = '';

    if (type === 'receipt') {
      html = generateReceiptTemplate({ orgName, dateStr, timeStr, userName, statusLabel, ...todayData });
    } else if (type === 'a4') {
      html = generateA4Template({ orgName, dateStr, timeStr, userName, statusLabel, wasteTypeLabel, ...todayData });
    } else {
      html = generateComprehensiveTemplate({
        orgName, orgType: organization.organization_type || '', dateStr, timeStr, dayName, userName,
        statusLabel, wasteTypeLabel, orgTypeLabel, ...todayData,
      });
    }

    // Inject guilloche background + dynamic watermark for non-receipt docs
    if (type !== 'receipt') {
      const securityLayers: string[] = [];

      // Guilloche background
      if (hasBackground && backgroundHTML) {
        securityLayers.push(`<div style="position:fixed;inset:0;z-index:0;pointer-events:none;">${backgroundHTML}</div>`);
      }

      // Dynamic watermark
      const watermarkText = `${orgName} | ${userName} | ${dateStr} ${timeStr}`;
      const watermarkRows: string[] = [];
      for (let i = 0; i < 8; i++) {
        const top = 5 + i * 12;
        watermarkRows.push(`<div style="position:absolute;top:${top}%;left:-10%;right:-10%;text-align:center;font-size:14px;font-family:'Cairo',sans-serif;color:rgba(0,0,0,0.04);transform:rotate(-35deg);white-space:nowrap;letter-spacing:4px;font-weight:700;pointer-events:none;user-select:none;">${watermarkText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${watermarkText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${watermarkText}</div>`);
      }
      securityLayers.push(`<div style="position:fixed;inset:0;z-index:2;pointer-events:none;overflow:hidden;">${watermarkRows.join('')}</div>`);

      if (securityLayers.length > 0) {
        html = html.replace('<body>', `<body style="position:relative;">${securityLayers.join('')}`);
      }
    }

    const { PrintService } = await import('@/services/documentService');
    PrintService.printHTML(html, { 
      title: 'تقرير طباعة',
      windowFeatures: type === 'receipt' ? 'width=320,height=600' : 'width=900,height=1100',
    });
    setIsPrinting(false);

    // Audit log
    if (user?.id && orgId) {
      supabase.from('activity_logs').insert({
        user_id: user.id,
        organization_id: orgId,
        action: `print_report_${type}`,
        action_type: 'print',
        resource_type: 'document',
        details: { report_type: type } as any,
      }).then();
    }
  }, [canPrint, todayData, organization, profile, user, orgId, hasBackground, backgroundHTML]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={isPrinting}>
          {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
          <span className="hidden sm:inline">طباعة</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem onClick={() => printReport('comprehensive')} className="gap-2 cursor-pointer">
          <ClipboardList className="w-4 h-4 text-primary" />
          <div>
            <div className="font-medium">التقرير اليومي الشامل</div>
            <div className="text-xs text-muted-foreground">تقرير مفصل بكل عمليات وبيانات اليوم</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => printReport('a4')} className="gap-2 cursor-pointer">
          <FileText className="w-4 h-4" />
          <div>
            <div className="font-medium">تقرير A4</div>
            <div className="text-xs text-muted-foreground">تقرير مع جداول وإحصائيات</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => printReport('receipt')} className="gap-2 cursor-pointer">
          <Receipt className="w-4 h-4" />
          <div>
            <div className="font-medium">إيصال حراري</div>
            <div className="text-xs text-muted-foreground">ملخص سريع لطابعة الإيصالات</div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

DashboardPrintReports.displayName = 'DashboardPrintReports';

export default DashboardPrintReports;
