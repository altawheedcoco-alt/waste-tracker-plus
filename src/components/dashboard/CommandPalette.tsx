import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  Package,
  Truck,
  Users,
  Bell,
  Settings,
  Building2,
  MapPin,
  BarChart3,
  FileText,
  CheckSquare,
  UserPlus,
  Search,
  Plus,
  Leaf,
  Bot,
  Loader2,
  Handshake,
  Receipt,
  User,
  Hash,
  ArrowRight,
  ExternalLink,
  ScrollText,
  Banknote,
  Award,
  ClipboardCheck,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';

interface CommandItemType {
  icon: React.ElementType;
  label: string;
  path: string;
  keywords?: string[];
  category: 'navigation' | 'actions' | 'admin';
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  active: 'bg-green-500/10 text-green-600 border-green-500/20',
  in_transit: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  delivered: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  completed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
  draft: 'bg-muted text-muted-foreground border-border',
  paid: 'bg-green-500/10 text-green-600 border-green-500/20',
  overdue: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { organization, roles } = useAuth();
  const { t } = useLanguage();
  const { query, setQuery, results, isLoading, hasResults } = useGlobalSearch();

  const isAdmin = roles.includes('admin');
  const isTransporter = organization?.organization_type === 'transporter';

  const navigationItems: CommandItemType[] = useMemo(() => [
    { icon: LayoutDashboard, label: t('commandPalette.dashboard'), path: '/dashboard', keywords: ['home', 'main', 'الرئيسية'], category: 'navigation' },
    { icon: Building2, label: t('commandPalette.orgProfile'), path: '/dashboard/organization-profile', keywords: ['organization', 'company', 'شركة', 'منظمة'], category: 'navigation' },
    { icon: Package, label: t('commandPalette.shipments'), path: isTransporter ? '/dashboard/transporter-shipments' : '/dashboard/shipments', keywords: ['shipment', 'delivery', 'شحنة', 'رحلة'], category: 'navigation' },
    { icon: BarChart3, label: t('commandPalette.reports'), path: '/dashboard/reports', keywords: ['reports', 'analytics', 'تقارير'], category: 'navigation' },
    { icon: Bell, label: t('commandPalette.notifications'), path: '/dashboard/notifications', keywords: ['notifications', 'alerts', 'إشعارات'], category: 'navigation' },
    { icon: Settings, label: t('commandPalette.settings'), path: '/dashboard/settings', keywords: ['settings', 'preferences', 'إعدادات'], category: 'navigation' },
    { icon: Leaf, label: t('commandPalette.envSustainability'), path: '/dashboard/environmental-sustainability', keywords: ['environment', 'green', 'بيئة', 'استدامة'], category: 'navigation' },
    { icon: Bot, label: t('commandPalette.aiTools'), path: '/dashboard/ai-tools', keywords: ['ai', 'tools', 'ذكاء'], category: 'navigation' },
  ], [t, isTransporter]);

  const transporterItems: CommandItemType[] = useMemo(() => isTransporter ? [
    { icon: Users, label: t('commandPalette.drivers'), path: '/dashboard/transporter-drivers', keywords: ['drivers', 'سائقين'], category: 'navigation' },
    { icon: MapPin, label: t('commandPalette.driverTracking'), path: '/dashboard/driver-tracking', keywords: ['tracking', 'location', 'تتبع'], category: 'navigation' },
  ] : [], [isTransporter, t]);

  const adminItems: CommandItemType[] = useMemo(() => isAdmin ? [
    { icon: CheckSquare, label: t('commandPalette.companyApprovals'), path: '/dashboard/company-approvals', keywords: ['approvals', 'موافقات'], category: 'admin' },
    { icon: UserPlus, label: t('commandPalette.driverApprovals'), path: '/dashboard/driver-approvals', keywords: ['driver approvals', 'سائقين'], category: 'admin' },
    { icon: FileText, label: t('commandPalette.orgDocuments'), path: '/dashboard/organization-documents', keywords: ['documents', 'وثائق'], category: 'admin' },
    { icon: MapPin, label: t('commandPalette.driverTracking'), path: '/dashboard/driver-tracking', keywords: ['tracking', 'تتبع'], category: 'admin' },
  ] : [], [isAdmin, t]);

  const actionItems: CommandItemType[] = useMemo(() => [
    { icon: Plus, label: t('commandPalette.newShipment'), path: '/dashboard/shipments/new', keywords: ['create', 'new shipment', 'إنشاء', 'جديد'], category: 'actions' },
  ], [t]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = useCallback((path: string) => {
    setOpen(false);
    setQuery('');
    navigate(path);
  }, [navigate, setQuery]);

  const showDataResults = query.length >= 2;

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="relative h-9 w-9 p-0 xl:h-9 xl:w-72 xl:justify-start xl:px-3 xl:py-2 group"
              onClick={() => setOpen(true)}
            >
              <Search className="h-4 w-4 xl:ml-2 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="hidden xl:inline-flex text-muted-foreground text-sm">بحث شامل... (شحنات، عقود، فواتير، شركاء)</span>
              <kbd className="pointer-events-none absolute left-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>بحث شامل في جميع البيانات (⌘K)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <CommandDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setQuery(''); }}>
        <CommandInput 
          placeholder="ابحث عن شحنة، عقد، فاتورة، شريك، إيداع، إقرار..." 
          className="text-right"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList className="max-h-[500px]">
          {/* Loading state */}
          {isLoading && showDataResults && (
            <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">جاري البحث...</span>
            </div>
          )}

          {/* Data Results */}
          {showDataResults && !isLoading && hasResults && (
            <>
              {/* Shipments */}
              {results.shipments.length > 0 && (
                <CommandGroup heading={`📦 الشحنات (${results.shipments.length})`}>
                  {results.shipments.map((s) => (
                    <CommandItem
                      key={s.id}
                      value={`shipment ${s.shipment_number} ${s.waste_type} ${s.from_name} ${s.to_name}`}
                      onSelect={() => runCommand(`/dashboard/shipments/${s.id}`)}
                      className="flex items-center gap-3 cursor-pointer py-3"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Package className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Badge variant="outline" className={`text-[10px] px-1.5 ${statusColors[s.status] || ''}`}>
                            {s.status}
                          </Badge>
                          <span className="font-medium text-sm">{s.shipment_number}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {s.waste_type} • {s.quantity} {s.unit} • {s.from_name} ← {s.to_name}
                        </p>
                      </div>
                      <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Organizations (Partners) */}
              {results.organizations.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading={`🏢 الشركاء (${results.organizations.length})`}>
                    {results.organizations.map((o) => (
                      <CommandItem
                        key={o.id}
                        value={`org ${o.name} ${o.city} ${o.organization_type}`}
                        onSelect={() => runCommand(`/dashboard/partners`)}
                        className="flex items-center gap-3 cursor-pointer py-3"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0 text-right">
                          <span className="font-medium text-sm">{o.name}</span>
                          <p className="text-xs text-muted-foreground">
                            {o.organization_type} {o.city ? `• ${o.city}` : ''}
                          </p>
                        </div>
                        <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              {/* External Partners */}
              {results.external_partners.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading={`🤝 شركاء خارجيون (${results.external_partners.length})`}>
                    {results.external_partners.map((ep) => (
                      <CommandItem
                        key={ep.id}
                        value={`partner ${ep.name} ${ep.city} ${ep.contact_person}`}
                        onSelect={() => runCommand(`/dashboard/external-partners`)}
                        className="flex items-center gap-3 cursor-pointer py-3"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                          <Handshake className="h-4 w-4 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0 text-right">
                          <span className="font-medium text-sm">{ep.name}</span>
                          <p className="text-xs text-muted-foreground">
                            {ep.partner_type} {ep.city ? `• ${ep.city}` : ''} {ep.contact_person ? `• ${ep.contact_person}` : ''}
                          </p>
                        </div>
                        <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              {/* Drivers */}
              {results.drivers.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading={`🚛 السائقون (${results.drivers.length})`}>
                    {results.drivers.map((d) => (
                      <CommandItem
                        key={d.id}
                        value={`driver ${d.full_name} ${d.phone} ${d.plate_number}`}
                        onSelect={() => runCommand(`/dashboard/transporter-drivers`)}
                        className="flex items-center gap-3 cursor-pointer py-3"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                          <Truck className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            {d.status && (
                              <Badge variant="outline" className={`text-[10px] px-1.5 ${statusColors[d.status] || ''}`}>
                                {d.status}
                              </Badge>
                            )}
                            <span className="font-medium text-sm">{d.full_name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {d.plate_number ? `🚗 ${d.plate_number}` : ''} {d.phone ? `• 📱 ${d.phone}` : ''} {d.vehicle_type ? `• ${d.vehicle_type}` : ''}
                          </p>
                        </div>
                        <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              {/* Employees */}
              {results.employees.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading={`👥 الموظفون (${results.employees.length})`}>
                    {results.employees.map((emp) => (
                      <CommandItem
                        key={emp.id}
                        value={`employee ${emp.full_name} ${emp.email} ${emp.phone}`}
                        onSelect={() => runCommand(`/dashboard/employees`)}
                        className="flex items-center gap-3 cursor-pointer py-3"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-violet-600" />
                        </div>
                        <div className="flex-1 min-w-0 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Badge variant="outline" className={`text-[10px] px-1.5 ${emp.is_active ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                              {emp.is_active ? 'نشط' : 'معطل'}
                            </Badge>
                            <span className="font-medium text-sm">{emp.full_name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {emp.email} {emp.employee_type ? `• ${emp.employee_type}` : ''}
                          </p>
                        </div>
                        <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              {/* Invoices */}
              {results.invoices.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading={`🧾 الفواتير (${results.invoices.length})`}>
                    {results.invoices.map((inv) => (
                      <CommandItem
                        key={inv.id}
                        value={`invoice ${inv.invoice_number} ${inv.client_name} ${inv.status}`}
                        onSelect={() => runCommand(`/dashboard/invoices`)}
                        className="flex items-center gap-3 cursor-pointer py-3"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <Receipt className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Badge variant="outline" className={`text-[10px] px-1.5 ${statusColors[inv.status] || ''}`}>
                              {inv.status}
                            </Badge>
                            <span className="font-medium text-sm">{inv.invoice_number}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {inv.client_name} • {inv.total_amount?.toLocaleString()} ج.م
                          </p>
                        </div>
                        <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              {/* Contracts */}
              {results.contracts?.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading={`📜 العقود (${results.contracts.length})`}>
                    {results.contracts.map((ct) => (
                      <CommandItem
                        key={ct.id}
                        value={`contract ${ct.contract_number} ${ct.title} ${ct.partner_name}`}
                        onSelect={() => runCommand(`/dashboard/contracts`)}
                        className="flex items-center gap-3 cursor-pointer py-3"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                          <ScrollText className="h-4 w-4 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Badge variant="outline" className={`text-[10px] px-1.5 ${statusColors[ct.status] || ''}`}>
                              {ct.status}
                            </Badge>
                            <span className="font-medium text-sm">{ct.contract_number}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {ct.title} {ct.partner_name ? `• ${ct.partner_name}` : ''}
                          </p>
                        </div>
                        <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              {/* Deposits */}
              {results.deposits?.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading={`💰 الإيداعات (${results.deposits.length})`}>
                    {results.deposits.map((dep) => (
                      <CommandItem
                        key={dep.id}
                        value={`deposit ${dep.reference_number} ${dep.depositor_name} ${dep.partner_name}`}
                        onSelect={() => runCommand(`/dashboard/deposits`)}
                        className="flex items-center gap-3 cursor-pointer py-3"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                          <Banknote className="h-4 w-4 text-teal-600" />
                        </div>
                        <div className="flex-1 min-w-0 text-right">
                          <span className="font-medium text-sm">{dep.depositor_name || dep.reference_number || 'إيداع'}</span>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {dep.amount?.toLocaleString()} ج.م • {dep.transfer_method} {dep.partner_name ? `• ${dep.partner_name}` : ''}
                          </p>
                        </div>
                        <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              {/* Award Letters */}
              {results.award_letters?.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading={`🏆 خطابات الترسية (${results.award_letters.length})`}>
                    {results.award_letters.map((al) => (
                      <CommandItem
                        key={al.id}
                        value={`award ${al.letter_number} ${al.title} ${al.partner_name}`}
                        onSelect={() => runCommand(`/dashboard/award-letters`)}
                        className="flex items-center gap-3 cursor-pointer py-3"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                          <Award className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Badge variant="outline" className={`text-[10px] px-1.5 ${statusColors[al.status] || ''}`}>
                              {al.status}
                            </Badge>
                            <span className="font-medium text-sm">{al.letter_number}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {al.title} {al.partner_name ? `• ${al.partner_name}` : ''}
                          </p>
                        </div>
                        <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              {/* Declarations */}
              {results.declarations?.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading={`📋 الإقرارات (${results.declarations.length})`}>
                    {results.declarations.map((dcl) => (
                      <CommandItem
                        key={dcl.id}
                        value={`declaration ${dcl.shipment_number} ${dcl.declaration_type} ${dcl.waste_type}`}
                        onSelect={() => runCommand(`/dashboard/generator-receipts`)}
                        className="flex items-center gap-3 cursor-pointer py-3"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                          <ClipboardCheck className="h-4 w-4 text-rose-600" />
                        </div>
                        <div className="flex-1 min-w-0 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Badge variant="outline" className={`text-[10px] px-1.5 ${statusColors[dcl.status] || ''}`}>
                              {dcl.status}
                            </Badge>
                            <span className="font-medium text-sm">{dcl.declaration_type}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            شحنة: {dcl.shipment_number} {dcl.waste_type ? `• ${dcl.waste_type}` : ''}
                          </p>
                        </div>
                        <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              {/* Receipts */}
              {results.receipts?.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading={`📄 شهادات الاستلام (${results.receipts.length})`}>
                    {results.receipts.map((rct) => (
                      <CommandItem
                        key={rct.id}
                        value={`receipt ${rct.receipt_number} ${rct.shipment_number}`}
                        onSelect={() => runCommand(`/dashboard/generator-receipts`)}
                        className="flex items-center gap-3 cursor-pointer py-3"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                          <FileCheck className="h-4 w-4 text-cyan-600" />
                        </div>
                        <div className="flex-1 min-w-0 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Badge variant="outline" className={`text-[10px] px-1.5 ${statusColors[rct.status] || ''}`}>
                              {rct.status}
                            </Badge>
                            <span className="font-medium text-sm">{rct.receipt_number}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            شحنة: {rct.shipment_number}
                          </p>
                        </div>
                        <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </>
          )}

          {/* No data results */}
          {showDataResults && !isLoading && !hasResults && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              لا توجد نتائج لـ "{query}"
            </div>
          )}

          {/* Navigation + Actions (always show when no query or as fallback) */}
          {!showDataResults && (
            <>
              <CommandEmpty>لا توجد نتائج</CommandEmpty>
              
              <CommandGroup heading="🧭 التنقل السريع">
                {navigationItems.map((item) => (
                  <CommandItem
                    key={item.path}
                    value={item.label + ' ' + (item.keywords?.join(' ') || '')}
                    onSelect={() => runCommand(item.path)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </CommandItem>
                ))}
                {transporterItems.map((item) => (
                  <CommandItem
                    key={item.path}
                    value={item.label + ' ' + (item.keywords?.join(' ') || '')}
                    onSelect={() => runCommand(item.path)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>

              {isAdmin && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="🔧 الإدارة">
                    {adminItems.map((item) => (
                      <CommandItem
                        key={item.path}
                        value={item.label + ' ' + (item.keywords?.join(' ') || '')}
                        onSelect={() => runCommand(item.path)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              <CommandSeparator />
              <CommandGroup heading="⚡ إجراءات سريعة">
                {actionItems.map((item) => (
                  <CommandItem
                    key={item.path}
                    value={item.label + ' ' + (item.keywords?.join(' ') || '')}
                    onSelect={() => runCommand(item.path)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* Footer hint */}
          <div className="border-t px-3 py-2 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>اكتب حرفين أو أكثر للبحث في 11 فئة من البيانات</span>
            <div className="flex gap-1.5">
              <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">↑↓</kbd>
              <span>تنقل</span>
              <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">↵</kbd>
              <span>فتح</span>
              <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">ESC</kbd>
              <span>إغلاق</span>
            </div>
          </div>
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default CommandPalette;
