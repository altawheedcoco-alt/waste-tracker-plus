import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Building2, 
  ChevronDown, 
  Check, 
  Truck, 
  Factory, 
  Recycle,
  Loader2,
  Shield
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const getOrganizationIcon = (type: string) => {
  switch (type) {
    case 'generator': return Factory;
    case 'transporter': return Truck;
    case 'recycler': return Recycle;
    default: return Building2;
  }
};

const getOrganizationLabel = (type: string) => {
  switch (type) {
    case 'generator': return 'مولد';
    case 'transporter': return 'ناقل';
    case 'recycler': return 'معالج';
    default: return 'منظمة';
  }
};

const getOrganizationColor = (type: string) => {
  switch (type) {
    case 'generator': return 'bg-amber-500/10 text-amber-600 border-amber-200';
    case 'transporter': return 'bg-blue-500/10 text-blue-600 border-blue-200';
    case 'recycler': return 'bg-green-500/10 text-green-600 border-green-200';
    default: return 'bg-muted text-muted-foreground';
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
    switchingOrganization,
    roles
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isOnSystemOverview = location.pathname === '/dashboard/system-overview';
  
  const [open, setOpen] = useState(false);
  const isAdmin = roles.includes('admin');

  if (!organization) return null;

  if (collapsed) {
    if (isOnSystemOverview && isAdmin) {
      return (
        <div className={cn("p-2", className)}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-destructive/10 text-destructive">
            <Shield className="w-5 h-5" />
          </div>
        </div>
      );
    }
    const Icon = getOrganizationIcon(organization.organization_type);
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

  const CurrentIcon = getOrganizationIcon(organization.organization_type);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 h-auto p-3 hover:bg-muted/80",
            className
          )}
          disabled={switchingOrganization}
        >
          {switchingOrganization ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isOnSystemOverview && isAdmin ? (
            <>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-destructive/10 text-destructive">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 text-right">
                <p className="font-medium text-sm truncate">مدير النظام</p>
                <p className="text-xs text-muted-foreground">لوحة الإدارة والرقابة</p>
              </div>
              <ChevronDown className={cn(
                "w-4 h-4 text-muted-foreground transition-transform shrink-0",
                open && "rotate-180"
              )} />
            </>
          ) : (
            <>
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                getOrganizationColor(organization.organization_type)
              )}>
                <CurrentIcon className="w-5 h-5" />
              </div>
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
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-80 p-0">
        <SheetHeader className="p-4 pb-2 border-b">
          <SheetTitle className="text-right text-base">المنظمات المرتبطة بحسابك</SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-3 space-y-1">
            <AnimatePresence>
              {userOrganizations.map((org, index) => {
                const Icon = getOrganizationIcon(org.organization_type);
                const isActive = org.organization_id === organization.id;
                
                return (
                  <motion.div
                    key={org.organization_id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <button
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors text-right",
                        isActive 
                          ? "bg-primary/10 border border-primary/20" 
                          : "hover:bg-muted/80 border border-transparent"
                      )}
                      onClick={() => {
                        if (!isActive) {
                          switchOrganization(org.organization_id);
                          navigate('/dashboard');
                        }
                        setOpen(false);
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
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {isAdmin && (
              <>
                <div className="my-2 border-t" />
                <button
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors text-right",
                    isOnSystemOverview
                      ? "bg-destructive/10 border border-destructive/20"
                      : "hover:bg-muted/80 border border-transparent"
                  )}
                  onClick={() => {
                    navigate('/dashboard/system-overview');
                    setOpen(false);
                  }}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-destructive/10 text-destructive shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">مدير النظام</p>
                      <Badge variant="outline" className="text-[10px] h-4 px-1 border-destructive/30 text-destructive">
                        Admin
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">لوحة الإدارة والرقابة الشاملة</p>
                  </div>
                  {isOnSystemOverview && (
                    <Check className="w-4 h-4 text-destructive shrink-0" />
                  )}
                </button>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default AccountSwitcher;
