import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CommandItem {
  icon: React.ElementType;
  label: string;
  path: string;
  keywords?: string[];
  category: 'navigation' | 'actions' | 'admin';
}

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { organization, roles } = useAuth();

  const isAdmin = roles.includes('admin');
  const isTransporter = organization?.organization_type === 'transporter';

  const navigationItems: CommandItem[] = [
    { icon: LayoutDashboard, label: 'لوحة التحكم', path: '/dashboard', keywords: ['home', 'main'], category: 'navigation' },
    { icon: Building2, label: 'ملف الجهة', path: '/dashboard/organization-profile', keywords: ['organization', 'company'], category: 'navigation' },
    { icon: Package, label: 'الشحنات', path: isTransporter ? '/dashboard/transporter-shipments' : '/dashboard/shipments', keywords: ['shipment', 'delivery'], category: 'navigation' },
    { icon: BarChart3, label: 'التقارير', path: '/dashboard/reports', keywords: ['reports', 'analytics'], category: 'navigation' },
    { icon: Bell, label: 'الإشعارات', path: '/dashboard/notifications', keywords: ['notifications', 'alerts'], category: 'navigation' },
    { icon: Settings, label: 'الإعدادات', path: '/dashboard/settings', keywords: ['settings', 'preferences'], category: 'navigation' },
    { icon: Leaf, label: 'الاستدامة البيئية', path: '/dashboard/environmental-sustainability', keywords: ['environment', 'green'], category: 'navigation' },
    { icon: Bot, label: 'أدوات الذكاء الاصطناعي', path: '/dashboard/ai-tools', keywords: ['ai', 'tools'], category: 'navigation' },
  ];

  const transporterItems: CommandItem[] = isTransporter ? [
    { icon: Users, label: 'السائقين', path: '/dashboard/transporter-drivers', keywords: ['drivers'], category: 'navigation' },
    { icon: MapPin, label: 'تتبع السائقين', path: '/dashboard/driver-tracking', keywords: ['tracking', 'location'], category: 'navigation' },
  ] : [];

  const adminItems: CommandItem[] = isAdmin ? [
    { icon: CheckSquare, label: 'موافقات الشركات', path: '/dashboard/company-approvals', keywords: ['approvals'], category: 'admin' },
    { icon: UserPlus, label: 'موافقات السائقين', path: '/dashboard/driver-approvals', keywords: ['driver approvals'], category: 'admin' },
    { icon: FileText, label: 'وثائق الجهات', path: '/dashboard/organization-documents', keywords: ['documents'], category: 'admin' },
    { icon: MapPin, label: 'تتبع السائقين', path: '/dashboard/driver-tracking', keywords: ['tracking'], category: 'admin' },
  ] : [];

  const actionItems: CommandItem[] = [
    { icon: Plus, label: 'إنشاء شحنة جديدة', path: '/dashboard/shipments/new', keywords: ['create', 'new shipment'], category: 'actions' },
  ];

  const allItems = [...navigationItems, ...transporterItems, ...adminItems, ...actionItems];

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
    navigate(path);
  }, [navigate]);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="relative h-9 w-9 p-0 xl:h-9 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
              onClick={() => setOpen(true)}
            >
              <Search className="h-4 w-4 xl:ml-2" />
              <span className="hidden xl:inline-flex">بحث سريع...</span>
              <kbd className="pointer-events-none absolute left-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>بحث سريع (⌘K)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="ابحث عن صفحة أو إجراء..." className="text-right" />
        <CommandList>
          <CommandEmpty>لا توجد نتائج.</CommandEmpty>
          
          <CommandGroup heading="التنقل">
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
              <CommandGroup heading="الإدارة">
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
          <CommandGroup heading="إجراءات سريعة">
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
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default CommandPalette;
