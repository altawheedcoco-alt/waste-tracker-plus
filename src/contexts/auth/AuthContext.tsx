import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { stopFocusMusicOnLogout } from '../FocusMusicContext';

// Types
export interface Profile {
  id: string;
  user_id: string;
  organization_id: string | null;
  active_organization_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
}

export interface Organization {
  id: string;
  name: string;
  organization_type: 'generator' | 'transporter' | 'recycler' | 'disposal' | 'regulator' | 'consultant' | 'consulting_office';
  email: string;
  phone: string;
  is_verified: boolean;
  is_active?: boolean;
  commercial_register?: string | null;
  environmental_license?: string | null;
  representative_name?: string | null;
  representative_national_id?: string | null;
  representative_phone?: string | null;
  logo_url?: string | null;
  stamp_url?: string | null;
  signature_url?: string | null;
}

export interface UserOrganization {
  organization_id: string;
  organization_name: string;
  organization_type: string;
  role_in_organization: string;
  is_primary: boolean;
  is_active: boolean;
  is_verified: boolean;
  logo_url: string | null;
}

interface UserRole {
  role: 'admin' | 'company_admin' | 'employee' | 'driver';
}

// Auth State Context - Core authentication state
interface AuthStateContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

// User Data Context - Profile and organization data
interface UserDataContextType {
  profile: Profile | null;
  organization: Organization | null;
  userOrganizations: UserOrganization[];
  roles: string[];
  refreshProfile: () => Promise<void>;
}

// Auth Actions Context - Authentication actions
interface AuthActionsContextType {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (data: SignUpData) => Promise<{ error: Error | null }>;
  signUpDriver: (data: DriverSignUpData) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  switchOrganization: (organizationId: string) => Promise<boolean>;
  switchingOrganization: boolean;
}

// Combined Auth Context for backward compatibility
interface AuthContextType extends AuthStateContextType, UserDataContextType, AuthActionsContextType {}

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  organizationType: 'generator' | 'transporter' | 'recycler';
  organizationName: string;
  organizationNameEn?: string;
  organizationEmail: string;
  organizationPhone: string;
  secondaryPhone?: string;
  address: string;
  city: string;
  region?: string;
  commercialRegister?: string;
  environmentalLicense?: string;
  activityType?: string;
  productionCapacity?: string;
  representativeName?: string;
  representativePosition?: string;
  representativePhone?: string;
  representativeEmail?: string;
  representativeNationalId?: string;
  delegateName?: string;
  delegatePhone?: string;
  delegateEmail?: string;
  delegateNationalId?: string;
  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;
  agentNationalId?: string;
}

export interface DriverSignUpData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  licenseNumber: string;
  vehicleType: string;
  vehiclePlate: string;
  licenseExpiry?: string;
}

// Create separate contexts
const AuthStateContext = createContext<AuthStateContextType | undefined>(undefined);
const UserDataContext = createContext<UserDataContextType | undefined>(undefined);
const AuthActionsContext = createContext<AuthActionsContextType | undefined>(undefined);

// Combined context for backward compatibility
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hooks for each context
export const useAuthState = () => {
  const context = useContext(AuthStateContext);
  if (context === undefined) {
    throw new Error('useAuthState must be used within an AuthProvider');
  }
  return context;
};

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within an AuthProvider');
  }
  return context;
};

export const useAuthActions = () => {
  const context = useContext(AuthActionsContext);
  if (context === undefined) {
    throw new Error('useAuthActions must be used within an AuthProvider');
  }
  return context;
};

// Combined hook for backward compatibility
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [userOrganizations, setUserOrganizations] = useState<UserOrganization[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [switchingOrganization, setSwitchingOrganization] = useState(false);

  const fetchUserOrganizations = useCallback(async (userId: string): Promise<UserOrganization[]> => {
    try {
      const { data, error } = await supabase.rpc('get_user_organizations', {
        _user_id: userId
      });
      
      if (error) {
        console.error('Error fetching user organizations:', error);
        return [];
      }
      
      return (data || []) as UserOrganization[];
    } catch (error) {
      console.error('Error in fetchUserOrganizations:', error);
      return [];
    }
  }, []);

  const fetchOrganization = useCallback(async (orgId: string): Promise<Organization | null> => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching organization:', error);
        return null;
      }
      
      return data as Organization | null;
    } catch (error) {
      console.error('Error in fetchOrganization:', error);
      return null;
    }
  }, []);

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      // Parallel fetch for better performance
      const [profileResult, rolesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
      ]);

      const profileData = profileResult.data;
      const rolesData = rolesResult.data;

      if (rolesData) {
        setRoles(rolesData.map((r: UserRole) => r.role));
      }

      if (profileData) {
        setProfile(profileData as Profile);

        // Fetch organizations in background (non-blocking)
        fetchUserOrganizations(userId).then(orgs => {
          setUserOrganizations(orgs);
        });

        // Determine which organization to load
        // Priority: tab-scoped sessionStorage > DB active_organization_id > profile organization_id
        const tabOrgId = sessionStorage.getItem('__tab_active_org_id');
        const activeOrgId = tabOrgId || profileData.active_organization_id || profileData.organization_id;
        
        if (activeOrgId) {
          fetchOrganization(activeOrgId).then(org => {
            if (org) {
              setOrganization(org);
              // Persist to this tab's session so it stays isolated
              sessionStorage.setItem('__tab_active_org_id', activeOrgId);
            }
          });
        }
      } else {
        // No profile found - check if this is an OAuth user that needs setup
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        const isOAuthUser = currentUser?.app_metadata?.provider === 'google' || 
                           currentUser?.identities?.some(i => i.provider === 'google');
        
        if (isOAuthUser && !window.location.pathname.includes('/auth/google-setup')) {
          // Redirect to Google setup page
          window.location.href = '/auth/google-setup';
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, [fetchUserOrganizations, fetchOrganization]);

  const switchOrganization = useCallback(async (organizationId: string): Promise<boolean> => {
    if (!user) return false;
    
    setSwitchingOrganization(true);
    
    try {
      const { data, error } = await supabase.rpc('switch_organization', {
        _user_id: user.id,
        _organization_id: organizationId
      });
      
      if (error) {
        console.error('Error switching organization:', error);
        toast.error('حدث خطأ أثناء تبديل المنظمة');
        return false;
      }
      
      if (data === false) {
        toast.error('ليس لديك صلاحية للوصول لهذه المنظمة');
        return false;
      }
      
      const newOrg = await fetchOrganization(organizationId);
      if (newOrg) {
        setOrganization(newOrg);
        setProfile(prev => prev ? { ...prev, active_organization_id: organizationId, organization_id: organizationId } : null);
        // Store in sessionStorage so only THIS tab switches
        sessionStorage.setItem('__tab_active_org_id', organizationId);
        toast.success(`تم التبديل إلى ${newOrg.name}`);
        window.location.reload();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error in switchOrganization:', error);
      toast.error('حدث خطأ أثناء تبديل المنظمة');
      return false;
    } finally {
      setSwitchingOrganization(false);
    }
  }, [user, fetchOrganization]);

  useEffect(() => {
    let mounted = true;
    let initialSessionHandled = false;
    
    const initializeAuth = async () => {
      try {
        // Add timeout to prevent hanging forever
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000));
        
        const result = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (!mounted) return;
        
        if (result && 'data' in result) {
          const { data: { session } } = result;
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            // Don't await - let it load in background
            fetchUserData(session.user.id).catch(console.error);
          }
          initialSessionHandled = true;
        } else {
          // Timeout - proceed without auth
          console.warn('Auth session fetch timed out, proceeding without auth');
          initialSessionHandled = true;
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        initialSessionHandled = true;
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        // Skip INITIAL_SESSION since we already handle it in initializeAuth
        if (event === 'INITIAL_SESSION' && initialSessionHandled) {
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Only re-fetch on actual auth changes (sign in, token refresh, etc.)
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
            setTimeout(() => {
              if (mounted) {
                fetchUserData(session.user.id);
              }
            }, 0);
          }
        } else {
          setProfile(null);
          setOrganization(null);
          setUserOrganizations([]);
          setRoles([]);
          // Clear tab-scoped org so next login picks up the correct org
          sessionStorage.removeItem('__tab_active_org_id');
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  }, []);

  const signUp = useCallback(async (data: SignUpData) => {
    try {
      // Delegate to register-company edge function for transactional safety
      const response = await supabase.functions.invoke('register-company', {
        body: {
          email: data.email,
          password: data.password,
          fullName: data.fullName,
          phone: data.phone,
          organizationType: data.organizationType,
          organizationName: data.organizationName,
          organizationNameEn: data.organizationNameEn,
          organizationEmail: data.organizationEmail,
          organizationPhone: data.organizationPhone,
          secondaryPhone: data.secondaryPhone,
          address: data.address,
          city: data.city,
          region: data.region,
          commercialRegister: data.commercialRegister,
          environmentalLicense: data.environmentalLicense,
          activityType: data.activityType,
          productionCapacity: data.productionCapacity,
          representativeName: data.representativeName,
          representativePosition: data.representativePosition,
          representativePhone: data.representativePhone,
          representativeEmail: data.representativeEmail,
          representativeNationalId: data.representativeNationalId,
          delegateName: data.delegateName,
          delegatePhone: data.delegatePhone,
          delegateEmail: data.delegateEmail,
          delegateNationalId: data.delegateNationalId,
          agentName: data.agentName,
          agentPhone: data.agentPhone,
          agentEmail: data.agentEmail,
          agentNationalId: data.agentNationalId,
        },
      });

      if (response.error) throw new Error(response.data?.error || response.error?.message || 'Registration failed');
      if (!response.data?.success) throw new Error(response.data?.error || 'Registration failed');

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  const signUpDriver = useCallback(async (data: DriverSignUpData) => {
    try {
      // Use register-driver-external edge function for transactional safety
      const response = await supabase.functions.invoke('register-driver-external', {
        body: {
          email: data.email,
          password: data.password,
          full_name: data.fullName,
          phone: data.phone,
          license_number: data.licenseNumber,
          vehicle_type: data.vehicleType,
          vehicle_plate: data.vehiclePlate,
          license_expiry: data.licenseExpiry || null,
        },
      });

      if (response.error) throw new Error(response.data?.error || response.error?.message || 'Driver registration failed');
      if (!response.data?.success) throw new Error(response.data?.error || 'Driver registration failed');

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  const signOut = useCallback(async () => {
    stopFocusMusicOnLogout();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setOrganization(null);
    setUserOrganizations([]);
    setRoles([]);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  }, [user, fetchUserData]);

  // Memoized context values to prevent unnecessary re-renders
  const authStateValue = useMemo<AuthStateContextType>(() => ({
    user,
    session,
    loading,
  }), [user, session, loading]);

  const userDataValue = useMemo<UserDataContextType>(() => ({
    profile,
    organization,
    userOrganizations,
    roles,
    refreshProfile,
  }), [profile, organization, userOrganizations, roles, refreshProfile]);

  const authActionsValue = useMemo<AuthActionsContextType>(() => ({
    signIn,
    signUp,
    signUpDriver,
    signOut,
    switchOrganization,
    switchingOrganization,
  }), [signIn, signUp, signUpDriver, signOut, switchOrganization, switchingOrganization]);

  // Combined value for backward compatibility
  const combinedValue = useMemo<AuthContextType>(() => ({
    ...authStateValue,
    ...userDataValue,
    ...authActionsValue,
  }), [authStateValue, userDataValue, authActionsValue]);

  return (
    <AuthContext.Provider value={combinedValue}>
      <AuthStateContext.Provider value={authStateValue}>
        <UserDataContext.Provider value={userDataValue}>
          <AuthActionsContext.Provider value={authActionsValue}>
            {children}
          </AuthActionsContext.Provider>
        </UserDataContext.Provider>
      </AuthStateContext.Provider>
    </AuthContext.Provider>
  );
};
