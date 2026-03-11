import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Building2, ChevronDown, Check, Truck, Factory, Recycle,
  Loader2, Shield, ArrowRightLeft, LogOut
} from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { UserOrganization } from '@/contexts/auth/AuthContext';

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
    case 'disposal': return 'تخلص';
    default: return 'منظمة';
  }
};

const getOrganizationColor = (type: string) => {
  switch (type) {
    case 'generator': return 'bg-amber-500/10 text-amber-600 border-amber-200';
    case 'transporter': return 'bg-blue-500/10 text-blue-600 border-blue-200';
    case 'recycler': return 'bg-green-500/10 text-green-600 border-green-200';
    case 'disposal': return 'bg-red-500/10 text-red-600 border-red-200';
    default: return 'bg-muted text-muted-foreground';
  }
};

interface AccountSwitcherProps {
  className?: string;
  collapsed?: boolean;
}

/**
 * AccountSwitcher for Admin:
 * - The top always shows admin identity (shield icon + "مدير النظام")
 * - No switching happens from the top button — EVER (prevents involuntary switching)
 * - Switching to org view ONLY happens from the dedicated sidebar button (AdminOrgSwitcherButton)
 * 
 * For non-admin: this component returns null (they don't have account switching)
 */
const AccountSwitcher = ({ className, collapsed = false }: AccountSwitcherProps) => {
  const { organization, roles } = useAuth();
  const isAdmin = roles.includes('admin');

  // Only admin sees this static identity display — never changes, never switches
  if (!organization || !isAdmin) return null;

  // Check if admin is currently viewing an org (voluntary switch only)
  const isViewingAsOrg = !!sessionStorage.getItem('admin_viewing_org');

  if (collapsed) {
    return (
      <div className={cn("p-2", className)}>
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          isViewingAsOrg 
            ? getOrganizationColor(organization.organization_type)
            : "bg-destructive/10 text-destructive"
        )}>
          {isViewingAsOrg ? (
            (() => { const Icon = getOrganizationIcon(organization.organization_type); return <Icon className="w-5 h-5" />; })()
          ) : (
            <Shield className="w-5 h-5" />
          )}
        </div>
      </div>
    );
  }

  if (isViewingAsOrg) {
    const OrgIcon = getOrganizationIcon(organization.organization_type);
    return (
      <div className={cn("p-3", className)}>
        <div className="flex items-center gap-3">
          {organization.logo_url ? (
            <img src={organization.logo_url} alt={organization.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
          ) : (
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
              getOrganizationColor(organization.organization_type)
            )}>
              <OrgIcon className="w-5 h-5" />
            </div>
          )}
          <div className="flex-1 min-w-0 text-right">
            <p className="font-medium text-sm truncate">{organization.name}</p>
            <p className="text-xs text-muted-foreground">
              {getOrganizationLabel(organization.organization_type)} — عرض كمدير
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("p-3", className)}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-destructive/10 text-destructive">
          <Shield className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0 text-right">
          <p className="font-medium text-sm truncate">مدير النظام</p>
          <p className="text-xs text-muted-foreground">لوحة الإدارة والرقابة</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Dedicated sidebar button for admin to switch/view organizations
 * Shows a sheet with all organizations when clicked
 */
export const AdminOrgSwitcherButton = ({ collapsed = false }: { collapsed?: boolean }) => {
  const { 
    organization, switchOrganization, switchingOrganization, roles 
  } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [allOrganizations, setAllOrganizations] = useState<UserOrganization[]>([]);
  const isAdmin = roles.includes('admin');
  const isViewingAsOrg = !!sessionStorage.getItem('admin_viewing_org');

  useEffect(() => {
    if (!isAdmin || !open) return;
    const fetchAllOrgs = async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, organization_type, is_active, is_verified, logo_url')
        .order('name');
      if (!error && data) {
        setAllOrganizations(data.map(org => ({
          organization_id: org.id,
          organization_name: org.name,
          organization_type: org.organization_type,
          role_in_organization: 'admin',
          is_primary: false,
          is_active: org.is_active ?? true,
          is_verified: org.is_verified ?? false,
          logo_url: org.logo_url,
        })));
      }
    };
    fetchAllOrgs();
  }, [isAdmin, open]);

  if (!isAdmin) return null;

  const filtered = allOrganizations.filter(org =>
    !search || org.organization_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSwitchToOrg = (orgId: string) => {
    sessionStorage.setItem('admin_viewing_org', orgId);
    switchOrganization(orgId);
    navigate('/dashboard');
    setOpen(false);
  };

  const handleReturnToAdmin = () => {
    sessionStorage.removeItem('admin_viewing_org');
    navigate('/dashboard/system-overview');
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {collapsed ? (
          <Button variant="ghost" size="icon" className="w-10 h-10 mx-auto" title="تبديل الحسابات">
            <ArrowRightLeft className="w-5 h-5 text-primary" />
          </Button>
        ) : (
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-11 border-primary/20 hover:bg-primary/5 text-primary"
            disabled={switchingOrganization}
          >
            {switchingOrganization ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRightLeft className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">تبديل لحساب جهة</span>
          </Button>
        )}
      </SheetTrigger>
      
      <SheetContent side="right" className="w-80 p-0">
        <SheetHeader className="p-4 pb-2 border-b">
          <SheetTitle className="text-right text-base">تبديل الحساب — عرض كجهة</SheetTitle>
        </SheetHeader>
        
        <div className="p-3 border-b">
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث بالاسم..."
            className="h-9 text-sm"
          />
        </div>

        <ScrollArea className="h-[calc(100vh-160px)]">
          <div className="p-3 space-y-1">
            {/* Return to Admin button */}
            {isViewingAsOrg && (
              <>
                <button
                  className="w-full flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors text-right hover:bg-destructive/5 border border-destructive/20 bg-destructive/5"
                  onClick={handleReturnToAdmin}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-destructive/10 text-destructive shrink-0">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-destructive">العودة لحساب المدير</p>
                    <p className="text-xs text-muted-foreground">الرجوع للوحة الإدارة والرقابة</p>
                  </div>
                </button>
                <div className="my-2 border-t" />
              </>
            )}

            <AnimatePresence>
              {filtered.map((org, index) => {
                const Icon = getOrganizationIcon(org.organization_type);
                const isActive = org.organization_id === organization?.id;
                
                return (
                  <motion.div
                    key={org.organization_id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <button
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors text-right",
                        isActive 
                          ? "bg-primary/10 border border-primary/20" 
                          : "hover:bg-muted/80 border border-transparent"
                      )}
                      onClick={() => handleSwitchToOrg(org.organization_id)}
                      disabled={switchingOrganization}
                    >
                      {org.logo_url ? (
                        <img src={org.logo_url} alt={org.organization_name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                          getOrganizationColor(org.organization_type)
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{org.organization_name}</p>
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
                      {isActive && <Check className="w-4 h-4 text-primary shrink-0" />}
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">لا توجد نتائج</p>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default AccountSwitcher;
