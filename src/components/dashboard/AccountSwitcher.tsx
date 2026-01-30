import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Building2, 
  ChevronDown, 
  Check, 
  Truck, 
  Factory, 
  Recycle,
  Plus,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const getOrganizationIcon = (type: string) => {
  switch (type) {
    case 'generator':
      return Factory;
    case 'transporter':
      return Truck;
    case 'recycler':
      return Recycle;
    default:
      return Building2;
  }
};

const getOrganizationLabel = (type: string) => {
  switch (type) {
    case 'generator':
      return 'مولد';
    case 'transporter':
      return 'ناقل';
    case 'recycler':
      return 'معالج';
    default:
      return 'منظمة';
  }
};

const getOrganizationColor = (type: string) => {
  switch (type) {
    case 'generator':
      return 'bg-amber-500/10 text-amber-600 border-amber-200';
    case 'transporter':
      return 'bg-blue-500/10 text-blue-600 border-blue-200';
    case 'recycler':
      return 'bg-green-500/10 text-green-600 border-green-200';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

interface AccountSwitcherProps {
  className?: string;
  collapsed?: boolean;
}

const AccountSwitcher = ({ className, collapsed = false }: AccountSwitcherProps) => {
  const { 
    organization, 
    userOrganizations, 
    switchOrganization, 
    switchingOrganization 
  } = useAuth();
  
  const [open, setOpen] = useState(false);

  if (!organization) return null;

  // Check if user already has an organization (cannot add more)
  const hasOrganization = userOrganizations.length >= 1;

  // For users with only one organization, show a simpler view (without add button since they already have an org)
  if (userOrganizations.length <= 1) {
    const Icon = getOrganizationIcon(organization.organization_type);
    
    if (collapsed) {
      return (
        <div className={cn("p-2", className)}>
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            getOrganizationColor(organization.organization_type)
          )}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      );
    }
    
    return (
      <div className={cn("w-full gap-3 p-3", className)}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
            getOrganizationColor(organization.organization_type)
          )}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 text-right">
            <p className="font-medium text-sm truncate">{organization.name}</p>
            <p className="text-xs text-muted-foreground">
              {getOrganizationLabel(organization.organization_type)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const CurrentIcon = getOrganizationIcon(organization.organization_type);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 h-auto p-3 hover:bg-muted/80",
            collapsed && "justify-center p-2",
            className
          )}
          disabled={switchingOrganization}
        >
          {switchingOrganization ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                getOrganizationColor(organization.organization_type)
              )}>
                <CurrentIcon className="w-5 h-5" />
              </div>
              
              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0 text-right">
                    <p className="font-medium text-sm truncate">{organization.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getOrganizationLabel(organization.organization_type)}
                    </p>
                  </div>
                  <ChevronDown className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform shrink-0",
                    open && "rotate-180"
                  )} />
                </>
              )}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="start" 
        className="w-72"
        sideOffset={8}
      >
        <DropdownMenuLabel className="text-muted-foreground font-normal">
          المنظمات المرتبطة بحسابك
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <AnimatePresence>
          {userOrganizations.map((org, index) => {
            const Icon = getOrganizationIcon(org.organization_type);
            const isActive = org.organization_id === organization.id;
            
            return (
              <motion.div
                key={org.organization_id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <DropdownMenuItem
                  className={cn(
                    "flex items-center gap-3 p-3 cursor-pointer",
                    isActive && "bg-primary/5"
                  )}
                  onClick={() => {
                    if (!isActive) {
                      switchOrganization(org.organization_id);
                      setOpen(false);
                    }
                  }}
                  disabled={switchingOrganization}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    getOrganizationColor(org.organization_type)
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{org.organization_name}</p>
                      {org.is_primary && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1">
                          الرئيسية
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground">
                        {getOrganizationLabel(org.organization_type)}
                      </p>
                      {!org.is_verified && (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1">
                          قيد المراجعة
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {isActive && (
                    <Check className="w-4 h-4 text-primary shrink-0" />
                  )}
                </DropdownMenuItem>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {/* Only show add organization option for admins or if no organization exists */}
        {!hasOrganization && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="flex items-center gap-3 p-3 text-primary cursor-pointer"
              onClick={() => {
                window.location.href = '/dashboard/add-organization';
              }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10 shrink-0">
                <Plus className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm">إضافة منظمة جديدة</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AccountSwitcher;
