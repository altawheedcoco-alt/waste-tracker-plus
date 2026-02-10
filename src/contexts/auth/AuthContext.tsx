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
  organization_type: 'generator' | 'transporter' | 'recycler';
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
    
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserData(session.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
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
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            if (mounted) {
              fetchUserData(session.user.id);
            }
          }, 0);
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
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert([{
          name: data.organizationName,
          name_en: data.organizationNameEn,
          organization_type: data.organizationType,
          email: data.organizationEmail,
          phone: data.organizationPhone,
          secondary_phone: data.secondaryPhone,
          address: data.address,
          city: data.city,
          region: data.region,
          commercial_register: data.commercialRegister,
          environmental_license: data.environmentalLicense,
          activity_type: data.activityType,
          production_capacity: data.productionCapacity,
          representative_name: data.representativeName,
          representative_position: data.representativePosition,
          representative_phone: data.representativePhone,
          representative_email: data.representativeEmail,
          representative_national_id: data.representativeNationalId,
          delegate_name: data.delegateName,
          delegate_phone: data.delegatePhone,
          delegate_email: data.delegateEmail,
          delegate_national_id: data.delegateNationalId,
          agent_name: data.agentName,
          agent_phone: data.agentPhone,
          agent_email: data.agentEmail,
          agent_national_id: data.agentNationalId,
          is_verified: false,
          is_active: false,
        }])
        .select()
        .single();

      if (orgError) throw orgError;

      const redirectUrl = `${window.location.origin}/`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: data.fullName,
            organization_id: orgData.id,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: authData.user.id,
            organization_id: orgData.id,
            active_organization_id: orgData.id,
            full_name: data.fullName,
            email: data.email,
            phone: data.phone,
            is_active: false,
          });

        if (profileError) throw profileError;

        const { error: userOrgError } = await (supabase
          .from('user_organizations') as any)
          .insert({
            user_id: authData.user.id,
            organization_id: orgData.id,
            role_in_organization: 'admin',
            is_primary: true,
            is_active: true,
          });

        if (userOrgError) throw userOrgError;

        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'company_admin',
          });

        if (roleError) throw roleError;
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  const signUpDriver = useCallback(async (data: DriverSignUpData) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: data.fullName,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: authData.user.id,
            full_name: data.fullName,
            email: data.email,
            phone: data.phone,
            is_active: false,
          })
          .select()
          .single();

        if (profileError) throw profileError;

        const { error: driverError } = await supabase
          .from('drivers')
          .insert({
            profile_id: profileData.id,
            license_number: data.licenseNumber,
            vehicle_type: data.vehicleType,
            vehicle_plate: data.vehiclePlate,
            license_expiry: data.licenseExpiry || null,
            is_available: false,
            organization_id: null as any,
          });

        if (driverError) throw driverError;

        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'driver',
          });

        if (roleError) throw roleError;
      }

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
