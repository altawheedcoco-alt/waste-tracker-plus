import { memo, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Package, Bell, Settings, User, 
  MapPin, Truck, Building2, Recycle, Factory, Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useDisplayMode } from '@/hooks/useDisplayMode';

interface NavTab {
  id: string;
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  badge?: number;
}

const MobileBottomNav = memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const { organization, roles } = useAuth();
  const { unreadCount } = useNotifications();
  const { isMobile } = useDisplayMode();

  const isDriver = roles.includes('driver');
  const isAdmin = roles.includes('admin');
  const orgType = organization?.organization_type as string;

  const tabs = useMemo((): NavTab[] => {
    if (isDriver) {
      return [
        { id: 'dashboard', icon: LayoutDashboard, label: 'الرئيسية', path: '/dashboard' },
        { id: 'shipments', icon: Package, label: 'الشحنات', path: '/dashboard/transporter-shipments' },
        { id: 'location', icon: MapPin, label: 'موقعي', path: '/dashboard/my-location' },
        { id: 'notifications', icon: Bell, label: 'الإشعارات', path: '/dashboard/notifications', badge: unreadCount },
        { id: 'profile', icon: User, label: 'حسابي', path: '/dashboard/driver-profile' },
      ];
    }

    if (isAdmin) {
      return [
        { id: 'dashboard', icon: LayoutDashboard, label: 'الرئيسية', path: '/dashboard' },
        { id: 'shipments', icon: Package, label: 'الشحنات', path: '/dashboard/shipments' },
        { id: 'notifications', icon: Bell, label: 'الإشعارات', path: '/dashboard/notifications', badge: unreadCount },
        { id: 'settings', icon: Settings, label: 'الإعدادات', path: '/dashboard/settings' },
      ];
    }

    const shipmentsPath = orgType === 'transporter' 
      ? '/dashboard/transporter-shipments' 
      : '/dashboard/shipments';

    // Consulting office gets specialized bottom nav
    if (orgType === 'consulting_office') {
      return [
        { id: 'dashboard', icon: LayoutDashboard, label: 'الرئيسية', path: '/dashboard' },
        { id: 'team', icon: Users, label: 'الفريق', path: '/dashboard/environmental-consultants' },
        { id: 'notifications', icon: Bell, label: 'الإشعارات', path: '/dashboard/notifications', badge: unreadCount },
        { id: 'org', icon: Building2, label: 'المكتب', path: '/dashboard/organization-profile' },
        { id: 'settings', icon: Settings, label: 'الإعدادات', path: '/dashboard/settings' },
      ];
    }

    const orgIcon = orgType === 'transporter' ? Truck 
      : orgType === 'recycler' ? Recycle 
      : orgType === 'disposal' ? Factory 
      : orgType === 'consultant' ? User
      : Building2;

    return [
      { id: 'dashboard', icon: LayoutDashboard, label: 'الرئيسية', path: '/dashboard' },
      { id: 'shipments', icon: Package, label: 'الشحنات', path: shipmentsPath },
      { id: 'notifications', icon: Bell, label: 'الإشعارات', path: '/dashboard/notifications', badge: unreadCount },
      { id: 'org', icon: orgIcon, label: 'المنظمة', path: '/dashboard/organization-profile' },
      { id: 'settings', icon: Settings, label: 'الإعدادات', path: '/dashboard/settings' },
    ];
  }, [isDriver, isAdmin, orgType, unreadCount]);

  // Only show on mobile
  if (!isMobile) return null;

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/85 backdrop-blur-2xl border-t border-border/20 pb-[env(safe-area-inset-bottom)]"
      style={{ WebkitBackdropFilter: 'blur(28px) saturate(1.8)', boxShadow: '0 -2px 12px hsl(220 16% 12% / 0.06)' }}
    >
      <div className="flex items-center justify-around h-[60px] px-1">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative',
                'touch-manipulation spring-press',
                active ? 'text-primary' : 'text-muted-foreground/70'
              )}
            >
              {/* Active background glow */}
              {active && (
                <motion.div
                  layoutId="bottomNavBg"
                  className="absolute inset-x-1.5 inset-y-1 rounded-2xl bg-primary/8"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}

              {/* Active top indicator */}
              {active && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-px left-1/4 right-1/4 h-[2.5px] bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}

              <div className="relative z-10">
                <motion.div
                  animate={active ? { scale: 1.12 } : { scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <Icon className={cn('w-[22px] h-[22px]', active && 'stroke-[2.5]')} />
                </motion.div>
                
                {/* Badge */}
                {tab.badge && tab.badge > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center shadow-sm"
                  >
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </motion.span>
                )}
              </div>

              <span className={cn(
                'text-[10px] leading-tight relative z-10',
                active ? 'font-bold' : 'font-medium'
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
});

MobileBottomNav.displayName = 'MobileBottomNav';

export default MobileBottomNav;
