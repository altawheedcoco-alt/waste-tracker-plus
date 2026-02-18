import { memo, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Package, Bell, Settings, User, 
  MapPin, Truck, Building2, Recycle, Factory
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

    const orgIcon = orgType === 'transporter' ? Truck 
      : orgType === 'recycler' ? Recycle 
      : orgType === 'disposal' ? Factory 
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
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border/60 pb-[env(safe-area-inset-bottom)]"
      style={{ WebkitBackdropFilter: 'blur(16px)' }}
    >
      <div className="flex items-center justify-around h-14 px-1">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative',
                'touch-manipulation transition-colors duration-200',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {/* Active indicator */}
              {active && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-px left-1/4 right-1/4 h-0.5 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              <div className="relative">
                <Icon className={cn('w-5 h-5', active && 'stroke-[2.5]')} />
                
                {/* Badge */}
                {tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>

              <span className={cn(
                'text-[10px] leading-tight',
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
