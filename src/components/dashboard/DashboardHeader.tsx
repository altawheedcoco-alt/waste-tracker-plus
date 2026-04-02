import { memo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Menu, X } from 'lucide-react';
import PlatformLogo from '@/components/common/PlatformLogo';
import CommandPalette from './CommandPalette';
import NotificationDropdown from './NotificationDropdown';
import ViewModeToolbar from './ViewModeToolbar';
import LiveClock from './LiveClock';
import GlobalRefreshButton from './GlobalRefreshButton';
import FocusMusicPlayer from './FocusMusicPlayer';
import ThemeCustomizer from '@/components/settings/ThemeCustomizer';
import MyShipmentsButton from './header/MyShipmentsButton';
import DashboardUserMenu from './DashboardUserMenu';

interface DashboardHeaderProps {
  isMobile: boolean;
  isTablet: boolean;
  isSidebarOpen: boolean;
  isMobileMenuOpen: boolean;
  isLegalDataComplete: boolean;
  isDocumentsComplete: boolean;
  onToggleSidebar: () => void;
  onToggleMobileMenu: () => void;
}

const DashboardHeader = memo(({
  isMobile,
  isTablet,
  isSidebarOpen,
  isMobileMenuOpen,
  isLegalDataComplete,
  isDocumentsComplete,
  onToggleSidebar,
  onToggleMobileMenu,
}: DashboardHeaderProps) => {
  const { language } = useLanguage();
  const headerHeight = isMobile ? 'h-[48px]' : 'h-14';

  return (
    <header className={`sticky top-0 z-40 ${headerHeight} bg-card border-b border-border flex items-center justify-between gap-1.5 sm:gap-2 px-3 sm:px-4 lg:px-6`}>
      <div className="flex items-center gap-2 shrink-0">
        {!isMobile && !isSidebarOpen && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleSidebar}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                aria-label="فتح القائمة"
              >
                <Menu size={18} className="text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <p>{language === 'ar' ? 'فتح القائمة الجانبية' : 'Open sidebar'}</p>
            </TooltipContent>
          </Tooltip>
        )}
        {isMobile && (
          <button
            onClick={onToggleMobileMenu}
            className="p-2.5 hover:bg-muted rounded-xl transition-colors touch-manipulation active:bg-muted/80"
            aria-label="فتح القائمة"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}
        {isMobile && <PlatformLogo size="sm" showText />}
      </div>

      {/* Command Palette */}
      <div className={`${isMobile ? 'max-w-[40px]' : 'flex-1 max-w-md min-w-0'}`}>
        <CommandPalette />
      </div>

      {/* Right side actions */}
      <div className={`flex items-center shrink-0 ${isMobile ? 'gap-0.5' : isTablet ? 'gap-1.5' : 'gap-2'}`}>
        {!isMobile && !isTablet && <ViewModeToolbar />}
        {!isMobile && <LiveClock />}
        {!isMobile && <GlobalRefreshButton />}
        {!isMobile && <FocusMusicPlayer />}
        {!isMobile && <ThemeCustomizer />}
        <MyShipmentsButton />
        <NotificationDropdown />
        <DashboardUserMenu
          isLegalDataComplete={isLegalDataComplete}
          isDocumentsComplete={isDocumentsComplete}
        />
      </div>
    </header>
  );
});

DashboardHeader.displayName = 'DashboardHeader';

export default DashboardHeader;
