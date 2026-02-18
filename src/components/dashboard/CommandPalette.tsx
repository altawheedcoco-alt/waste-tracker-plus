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
  LayoutDashboard, Package, Truck, Users, Bell, Settings, Building2,
  MapPin, BarChart3, FileText, CheckSquare, UserPlus, Search, Plus,
  Leaf, Bot, Loader2, Handshake, Receipt, User, ArrowRight,
  ScrollText, Banknote, Award, ClipboardCheck, FileCheck,
  Clock, TrendingUp, X, Filter, Sparkles, Hash,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { useGlobalSearch, type SearchResults } from '@/hooks/useGlobalSearch';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface CommandItemType {
  icon: React.ElementType;
  label: string;
  path: string;
  keywords?: string[];
  category: 'navigation' | 'actions' | 'admin';
}

type CategoryKey = 'all' | keyof SearchResults;

interface CategoryConfig {
  key: CategoryKey;
  label: string;
  icon: React.ElementType;
  emoji: string;
  color: string;
}

const CATEGORIES: CategoryConfig[] = [
  { key: 'all', label: 'الكل', icon: Filter, emoji: '🔍', color: 'bg-primary/10 text-primary' },
  { key: 'shipments', label: 'شحنات', icon: Package, emoji: '📦', color: 'bg-blue-500/10 text-blue-600' },
  { key: 'organizations', label: 'جهات مرتبطة', icon: Building2, emoji: '🏢', color: 'bg-purple-500/10 text-purple-600' },
  { key: 'contracts', label: 'عقود', icon: ScrollText, emoji: '📜', color: 'bg-amber-500/10 text-amber-600' },
  { key: 'invoices', label: 'فواتير', icon: Receipt, emoji: '🧾', color: 'bg-emerald-500/10 text-emerald-600' },
  { key: 'drivers', label: 'سائقين', icon: Truck, emoji: '🚛', color: 'bg-green-500/10 text-green-600' },
  { key: 'deposits', label: 'إيداعات', icon: Banknote, emoji: '💰', color: 'bg-teal-500/10 text-teal-600' },
  { key: 'declarations', label: 'إقرارات', icon: ClipboardCheck, emoji: '📋', color: 'bg-rose-500/10 text-rose-600' },
  { key: 'receipts', label: 'شهادات', icon: FileCheck, emoji: '📄', color: 'bg-cyan-500/10 text-cyan-600' },
];

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
  confirmed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  approved: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
};

const SMART_SUGGESTIONS = [
  { query: 'pending', label: 'الشحنات المعلقة', emoji: '⏳', category: 'shipments' as CategoryKey },
  { query: 'active', label: 'العقود النشطة', emoji: '✅', category: 'contracts' as CategoryKey },
  { query: 'overdue', label: 'الفواتير المتأخرة', emoji: '🔴', category: 'invoices' as CategoryKey },
  { query: 'in_transit', label: 'شحنات قيد النقل', emoji: '🚚', category: 'shipments' as CategoryKey },
  { query: 'completed', label: 'الشحنات المكتملة', emoji: '✔️', category: 'shipments' as CategoryKey },
];

const RECENT_SEARCHES_KEY = 'global-search-recent';
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
  } catch { return []; }
}

function saveRecentSearch(q: string) {
  const recent = getRecentSearches().filter(s => s !== q);
  recent.unshift(q);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

function clearRecentSearches() {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
}

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const navigate = useNavigate();
  const { organization, roles } = useAuth();
  const { t } = useLanguage();
  const { query, setQuery, results, isLoading, hasResults, totalResults } = useGlobalSearch();

  const isAdmin = roles.includes('admin');
  const isTransporter = organization?.organization_type === 'transporter';

  // Load recent searches on open
  useEffect(() => {
    if (open) {
      setRecentSearches(getRecentSearches());
      setActiveCategory('all');
    }
  }, [open]);

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
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = useCallback((path: string) => {
    if (query.trim().length >= 2) saveRecentSearch(query.trim());
    setOpen(false);
    setQuery('');
    navigate(path);
  }, [navigate, setQuery, query]);

  const handleSmartSuggestion = useCallback((suggestion: typeof SMART_SUGGESTIONS[0]) => {
    setQuery(suggestion.query);
    setActiveCategory(suggestion.category);
  }, [setQuery]);

  const handleRecentSearch = useCallback((q: string) => {
    setQuery(q);
  }, [setQuery]);

  const showDataResults = query.length >= 2;

  // Count results per category
  const categoryCounts = useMemo(() => {
    if (!results) return {};
    const counts: Record<string, number> = {};
    for (const [key, arr] of Object.entries(results)) {
      if (Array.isArray(arr)) counts[key] = arr.length;
    }
    return counts;
  }, [results]);

  // Filter categories with results
  const activeCategoriesWithResults = useMemo(() => {
    return CATEGORIES.filter(c => c.key === 'all' || (categoryCounts[c.key] || 0) > 0);
  }, [categoryCounts]);

  // Check if a section should show based on active category
  const shouldShowSection = useCallback((key: string) => {
    return activeCategory === 'all' || activeCategory === key;
  }, [activeCategory]);

  // Render a result item generically
  const renderResultItem = (
    id: string,
    icon: React.ElementType,
    iconColor: string,
    bgColor: string,
    title: string,
    subtitle: string,
    status: string | undefined,
    path: string,
    valueStr: string,
  ) => {
    const Icon = icon;
    return (
      <CommandItem
        key={id}
        value={valueStr}
        onSelect={() => runCommand(path)}
        className="flex items-center gap-3 cursor-pointer py-3 group/item"
      >
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center transition-transform group-hover/item:scale-110`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-center gap-2 justify-end">
            {status && (
              <Badge variant="outline" className={`text-[10px] px-1.5 ${statusColors[status] || 'bg-muted text-muted-foreground'}`}>
                {status}
              </Badge>
            )}
            <span className="font-medium text-sm">{title}</span>
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>
          )}
        </div>
        <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity" />
      </CommandItem>
    );
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="relative h-9 w-9 p-0 xl:h-9 xl:w-80 xl:justify-start xl:px-3 xl:py-2 group"
              onClick={() => setOpen(true)}
            >
              <Search className="h-4 w-4 xl:ml-2 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="hidden xl:inline-flex text-muted-foreground text-sm">بحث شامل... (11 فئة)</span>
              <kbd className="pointer-events-none absolute left-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>بحث شامل في 11 فئة من البيانات (⌘K)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <CommandDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setQuery(''); setActiveCategory('all'); } }}>
        <CommandInput
          placeholder="ابحث عن شحنة، عقد، فاتورة، شريك، إيداع، إقرار..."
          className="text-right"
          value={query}
          onValueChange={setQuery}
        />

        {/* Category Filter Tabs */}
        {showDataResults && hasResults && (
          <div className="flex items-center gap-1 px-3 py-2 border-b overflow-x-auto scrollbar-hide">
            {activeCategoriesWithResults.map((cat) => {
              const count = cat.key === 'all' ? totalResults : (categoryCounts[cat.key] || 0);
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all",
                    activeCategory === cat.key
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  )}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                  <span className={cn(
                    "rounded-full px-1.5 py-0 text-[9px] font-bold",
                    activeCategory === cat.key ? "bg-primary-foreground/20" : "bg-background"
                  )}>{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Results summary bar */}
        {showDataResults && !isLoading && hasResults && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-muted/30 border-b text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              <span>تم العثور على <strong className="text-foreground">{totalResults}</strong> نتيجة في {Object.values(categoryCounts).filter(c => c > 0).length} فئات</span>
            </div>
            <span className="text-[10px]">"{query}"</span>
          </div>
        )}

        <CommandList className="max-h-[450px]">
          {/* Loading */}
          {isLoading && showDataResults && (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">جاري البحث في 11 فئة...</span>
            </div>
          )}

          {/* Data Results */}
          {showDataResults && !isLoading && hasResults && (
            <>
              {/* Shipments */}
              {shouldShowSection('shipments') && results.shipments.length > 0 && (
                <CommandGroup heading={`📦 الشحنات (${results.shipments.length})`}>
                  {results.shipments.map((s) =>
                    renderResultItem(s.id, Package, 'text-blue-600', 'bg-blue-500/10',
                      s.shipment_number,
                      `${s.waste_type} • ${s.quantity} ${s.unit} • ${s.from_name} ← ${s.to_name}`,
                      s.status, `/dashboard/shipments/${s.id}`,
                      `shipment ${s.shipment_number} ${s.waste_type} ${s.from_name} ${s.to_name}`)
                  )}
                </CommandGroup>
              )}

              {/* Organizations */}
              {shouldShowSection('organizations') && results.organizations.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading={`🏢 الجهات المرتبطة (${results.organizations.length})`}>
                    {results.organizations.map((o) =>
                      renderResultItem(o.id, Building2, 'text-purple-600', 'bg-purple-500/10',
                        o.name,
                        `${o.organization_type} ${o.city ? `• ${o.city}` : ''}`,
                        undefined, `/dashboard/partners`,
                        `org ${o.name} ${o.city} ${o.organization_type}`)
                    )}
                  </CommandGroup>
                </>
              )}

              {/* External Partners */}
              {shouldShowSection('external_partners') && results.external_partners.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading={`🤝 جهات خارجية (${results.external_partners.length})`}>
                    {results.external_partners.map((ep) =>
                      renderResultItem(ep.id, Handshake, 'text-orange-600', 'bg-orange-500/10',
                        ep.name,
                        `${ep.partner_type} ${ep.city ? `• ${ep.city}` : ''} ${ep.contact_person ? `• ${ep.contact_person}` : ''}`,
                        undefined, `/dashboard/external-partners`,
                        `partner ${ep.name} ${ep.city} ${ep.contact_person}`)
                    )}
                  </CommandGroup>
                </>
              )}

              {/* Drivers */}
              {shouldShowSection('drivers') && results.drivers.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading={`🚛 السائقون (${results.drivers.length})`}>
                    {results.drivers.map((d) =>
                      renderResultItem(d.id, Truck, 'text-green-600', 'bg-green-500/10',
                        d.full_name,
                        `${d.plate_number ? `🚗 ${d.plate_number}` : ''} ${d.phone ? `• 📱 ${d.phone}` : ''}`,
                        d.status, `/dashboard/transporter-drivers`,
                        `driver ${d.full_name} ${d.phone} ${d.plate_number}`)
                    )}
                  </CommandGroup>
                </>
              )}

              {/* Employees */}
              {shouldShowSection('employees') && results.employees.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading={`👥 الموظفون (${results.employees.length})`}>
                    {results.employees.map((emp) =>
                      renderResultItem(emp.id, User, 'text-violet-600', 'bg-violet-500/10',
                        emp.full_name,
                        `${emp.email} ${emp.employee_type ? `• ${emp.employee_type}` : ''}`,
                        emp.is_active ? 'active' : 'cancelled', `/dashboard/employees`,
                        `employee ${emp.full_name} ${emp.email} ${emp.phone}`)
                    )}
                  </CommandGroup>
                </>
              )}

              {/* Invoices */}
              {shouldShowSection('invoices') && results.invoices.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading={`🧾 الفواتير (${results.invoices.length})`}>
                    {results.invoices.map((inv) =>
                      renderResultItem(inv.id, Receipt, 'text-emerald-600', 'bg-emerald-500/10',
                        inv.invoice_number,
                        `${inv.client_name} • ${inv.total_amount?.toLocaleString()} ج.م`,
                        inv.status, `/dashboard/invoices`,
                        `invoice ${inv.invoice_number} ${inv.client_name} ${inv.status}`)
                    )}
                  </CommandGroup>
                </>
              )}

              {/* Contracts */}
              {shouldShowSection('contracts') && results.contracts?.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading={`📜 العقود (${results.contracts.length})`}>
                    {results.contracts.map((ct) =>
                      renderResultItem(ct.id, ScrollText, 'text-amber-600', 'bg-amber-500/10',
                        ct.contract_number,
                        `${ct.title} ${ct.partner_name ? `• ${ct.partner_name}` : ''}`,
                        ct.status, `/dashboard/contracts`,
                        `contract ${ct.contract_number} ${ct.title} ${ct.partner_name}`)
                    )}
                  </CommandGroup>
                </>
              )}

              {/* Deposits */}
              {shouldShowSection('deposits') && results.deposits?.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading={`💰 الإيداعات (${results.deposits.length})`}>
                    {results.deposits.map((dep) =>
                      renderResultItem(dep.id, Banknote, 'text-teal-600', 'bg-teal-500/10',
                        dep.depositor_name || dep.reference_number || 'إيداع',
                        `${dep.amount?.toLocaleString()} ج.م • ${dep.transfer_method} ${dep.partner_name ? `• ${dep.partner_name}` : ''}`,
                        undefined, `/dashboard/deposits`,
                        `deposit ${dep.reference_number} ${dep.depositor_name} ${dep.partner_name}`)
                    )}
                  </CommandGroup>
                </>
              )}

              {/* Award Letters */}
              {shouldShowSection('award_letters') && results.award_letters?.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading={`🏆 خطابات الترسية (${results.award_letters.length})`}>
                    {results.award_letters.map((al) =>
                      renderResultItem(al.id, Award, 'text-indigo-600', 'bg-indigo-500/10',
                        al.letter_number,
                        `${al.title} ${al.partner_name ? `• ${al.partner_name}` : ''}`,
                        al.status, `/dashboard/award-letters`,
                        `award ${al.letter_number} ${al.title} ${al.partner_name}`)
                    )}
                  </CommandGroup>
                </>
              )}

              {/* Declarations */}
              {shouldShowSection('declarations') && results.declarations?.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading={`📋 الإقرارات (${results.declarations.length})`}>
                    {results.declarations.map((dcl) =>
                      renderResultItem(dcl.id, ClipboardCheck, 'text-rose-600', 'bg-rose-500/10',
                        dcl.declaration_type,
                        `شحنة: ${dcl.shipment_number} ${dcl.waste_type ? `• ${dcl.waste_type}` : ''}`,
                        dcl.status, `/dashboard/generator-receipts`,
                        `declaration ${dcl.shipment_number} ${dcl.declaration_type} ${dcl.waste_type}`)
                    )}
                  </CommandGroup>
                </>
              )}

              {/* Receipts */}
              {shouldShowSection('receipts') && results.receipts?.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading={`📄 شهادات الاستلام (${results.receipts.length})`}>
                    {results.receipts.map((rct) =>
                      renderResultItem(rct.id, FileCheck, 'text-cyan-600', 'bg-cyan-500/10',
                        rct.receipt_number,
                        `شحنة: ${rct.shipment_number}`,
                        rct.status, `/dashboard/generator-receipts`,
                        `receipt ${rct.receipt_number} ${rct.shipment_number}`)
                    )}
                  </CommandGroup>
                </>
              )}
            </>
          )}

          {/* No data results */}
          {showDataResults && !isLoading && !hasResults && (
            <div className="py-8 text-center">
              <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">لا توجد نتائج لـ "<strong>{query}</strong>"</p>
              <p className="text-xs text-muted-foreground/70 mt-1">جرب كلمات مختلفة أو تصفح الأقسام أدناه</p>
            </div>
          )}

          {/* Pre-search: Recent + Suggestions + Navigation */}
          {!showDataResults && (
            <>
              <CommandEmpty>لا توجد نتائج</CommandEmpty>

              {/* Smart Suggestions */}
              <CommandGroup heading="💡 اقتراحات ذكية">
                {SMART_SUGGESTIONS.map((s, i) => (
                  <CommandItem
                    key={i}
                    value={`suggest ${s.label} ${s.query}`}
                    onSelect={() => handleSmartSuggestion(s)}
                    className="flex items-center gap-3 cursor-pointer py-2"
                  >
                    <div className="flex-shrink-0 w-7 h-7 rounded-md bg-accent/50 flex items-center justify-center text-sm">
                      {s.emoji}
                    </div>
                    <span className="text-sm">{s.label}</span>
                    <TrendingUp className="h-3 w-3 text-muted-foreground mr-auto" />
                  </CommandItem>
                ))}
              </CommandGroup>

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading={
                    <div className="flex items-center justify-between w-full">
                      <span>🕐 عمليات بحث سابقة</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); clearRecentSearches(); setRecentSearches([]); }}
                        className="text-[10px] text-muted-foreground hover:text-destructive transition-colors px-1.5 py-0.5 rounded hover:bg-destructive/10"
                      >
                        مسح الكل
                      </button>
                    </div>
                  }>
                    {recentSearches.map((rs, i) => (
                      <CommandItem
                        key={i}
                        value={`recent ${rs}`}
                        onSelect={() => handleRecentSearch(rs)}
                        className="flex items-center gap-3 cursor-pointer py-2"
                      >
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">{rs}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              <CommandSeparator />
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

          {/* Footer */}
          <div className="border-t px-3 py-2 text-[11px] text-muted-foreground flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Hash className="h-3 w-3" />
              <span>11 فئة بحث</span>
            </div>
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
