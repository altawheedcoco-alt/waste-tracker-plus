import { memo, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDriverType } from '@/hooks/useDriverType';
import { useResolvedUrl } from '@/hooks/useResolvedUrl';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  User,
  Settings,
  LogOut,
  Send,
  BadgeCheck,
  Scale,
  FolderCheck,
  Car,
  Building2,
  Truck,
  Recycle,
  Factory,
  Shield,
} from 'lucide-react';
import CreateRequestButton from './CreateRequestButton';
import { getAvatarEmoji, getColorTheme } from '@/components/settings/ProfileCustomization';
import type { LucideIcon } from 'lucide-react';

interface DashboardUserMenuProps {
  isLegalDataComplete: boolean;
  isDocumentsComplete: boolean;
}

const ORG_ICONS: Record<string, LucideIcon> = {
  generator: Building2,
  transporter: Truck,
  recycler: Recycle,
  disposal: Factory,
  regulator: Shield,
  consultant: User,
  consulting_office: Building2,
};

const DashboardUserMenu = memo(({ isLegalDataComplete, isDocumentsComplete }: DashboardUserMenuProps) => {
  const { profile, organization, signOut, roles } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { driverType } = useDriverType();

  const isAdmin = roles.includes('admin');
  const isDriver = roles.includes('driver');
  const isStandaloneDriver = isDriver;

  const resolvedAvatarUrl = useResolvedUrl(profile?.avatar_url);
  const resolvedLogoUrl = useResolvedUrl(organization?.logo_url);

  const orgType = organization?.organization_type as string;
  const OrgIcon = isAdmin ? Settings : isStandaloneDriver ? Car : (ORG_ICONS[orgType] || Building2);

  const getEntityTypeLabel = () => {
    if (isAdmin) return t('dashboard.orgTypes.admin');
    if (isStandaloneDriver) return t('dashboard.orgTypes.driver');
    const key = `dashboard.orgTypes.${orgType === 'consulting_office' ? 'consultingOffice' : orgType}`;
    return t(key) || t('dashboard.orgTypes.entity');
  };

  const getEntityName = () => {
    if (isAdmin) return t('dashboard.orgTypes.systemAdmin');
    if (isStandaloneDriver) return profile?.full_name || t('dashboard.orgTypes.driver');
    return organization?.name || profile?.full_name || t('dashboard.orgTypes.user');
  };

  const handleSignOut = async () => {
    await signOut();
    startTransition(() => navigate('/'));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-1 sm:gap-2 hover:bg-muted/80 px-2 sm:px-3">
          {(profile as any)?.avatar_preset && (profile as any).avatar_preset !== 'default' ? (
            <div 
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center text-lg ring-2 ring-primary/20"
              style={{ 
                background: `linear-gradient(135deg, ${getColorTheme((profile as any)?.profile_color_theme || 'teal-blue')[0]}40, ${getColorTheme((profile as any)?.profile_color_theme || 'teal-blue')[1]}40)` 
              }}
            >
              {getAvatarEmoji((profile as any).avatar_preset)}
            </div>
          ) : (
            <Avatar className="h-7 w-7 sm:h-8 sm:w-8 ring-2 ring-primary/20">
              <AvatarImage src={resolvedAvatarUrl || ''} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                {profile?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          )}
          <span className="hidden md:inline-block font-medium text-sm lg:text-base max-w-[120px] truncate">{profile?.full_name}</span>
          <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground hidden sm:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 sm:w-72">
        <div className="px-3 py-3 space-y-2">
          <p className="text-xs text-muted-foreground">{getEntityTypeLabel()}</p>
          <div className="flex items-center gap-2">
            {(isStandaloneDriver ? resolvedAvatarUrl : resolvedLogoUrl) ? (
              <img src={(isStandaloneDriver ? resolvedAvatarUrl : resolvedLogoUrl) || ''} alt={getEntityName()} className="w-8 h-8 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <OrgIcon className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
            <p className="font-semibold text-foreground">{getEntityName()}</p>
            {!isStandaloneDriver && organization?.is_verified && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <BadgeCheck className="w-4 h-4 text-primary" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('dashboard.verifiedAndApproved')}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {isStandaloneDriver
              ? (driverType === 'company' ? 'سائق تابع'
                : driverType === 'hired' ? 'سائق حر مؤجر'
                : driverType === 'independent' ? 'سائق مستقل'
                : t('dashboard.orgTypes.driver'))
              : profile?.full_name}
          </p>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {isStandaloneDriver ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">
                <Car className="w-3 h-3 text-primary" />
                كيان مستقل
              </span>
            ) : (
              <>
                {organization?.is_verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    <BadgeCheck className="w-3 h-3" />
                    {t('dashboard.verifiedEntity')}
                  </span>
                )}
                {isLegalDataComplete && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">
                    <Scale className="w-3 h-3 text-primary" />
                    {t('dashboard.legalData')}
                  </span>
                )}
                {isDocumentsComplete && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">
                    <FolderCheck className="w-3 h-3 text-primary" />
                    {t('dashboard.docsComplete')}
                  </span>
                )}
                {!organization?.is_verified && !isLegalDataComplete && !isDocumentsComplete && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {t('dashboard.pleaseCompleteData')}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => startTransition(() => navigate(isStandaloneDriver ? '/dashboard/driver-profile' : '/dashboard/organization-profile'))} className="cursor-pointer">
          <OrgIcon className="ml-2 h-4 w-4" />
          {isStandaloneDriver ? 'الملف التشغيلي للسائق' : t('sidebar.orgProfile')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => startTransition(() => navigate('/dashboard/settings?tab=profile'))} className="cursor-pointer">
          <User className="ml-2 h-4 w-4" />
          {t('nav.profile')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => startTransition(() => navigate('/dashboard/settings'))} className="cursor-pointer">
          <Settings className="ml-2 h-4 w-4" />
          {t('nav.settings')}
        </DropdownMenuItem>
        {!isStandaloneDriver && (
          <>
            <DropdownMenuSeparator />
            <CreateRequestButton
              buttonVariant="ghost"
              buttonSize="sm"
              className="w-full justify-start px-2 py-1.5 h-auto font-normal"
            >
              <div className="flex items-center w-full cursor-pointer text-primary">
                <Send className="ml-2 h-4 w-4" />
                {t('dashboard.sendRequestToAdmin')}
              </div>
            </CreateRequestButton>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
          <LogOut className="ml-2 h-4 w-4" />
          {t('nav.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

DashboardUserMenu.displayName = 'DashboardUserMenu';

export default DashboardUserMenu;
