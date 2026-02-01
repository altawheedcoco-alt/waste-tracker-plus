import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { stopFocusMusicOnLogout } from './FocusMusicContext';

interface Profile {
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

interface Organization {
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

interface UserOrganization {
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

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  organization: Organization | null;
  userOrganizations: UserOrganization[];
  roles: string[];
  loading: boolean;
  switchingOrganization: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (data: SignUpData) => Promise<{ error: Error | null }>;
  signUpDriver: (data: DriverSignUpData) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  switchOrganization: (organizationId: string) => Promise<boolean>;
}

interface SignUpData {
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

interface DriverSignUpData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  licenseNumber: string;
  vehicleType: string;
  vehiclePlate: string;
  licenseExpiry?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [userOrganizations, setUserOrganizations] = useState<UserOrganization[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [switchingOrganization, setSwitchingOrganization] = useState(false);

  const fetchUserOrganizations = async (userId: string): Promise<UserOrganization[]> => {
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
  };

  const fetchOrganization = async (orgId: string): Promise<Organization | null> => {
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
  };

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
        const activeOrgId = profileData.active_organization_id || profileData.organization_id;
        
        if (activeOrgId) {
          fetchOrganization(activeOrgId).then(org => {
            if (org) {
              setOrganization(org);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, []);

  const switchOrganization = useCallback(async (organizationId: string): Promise<boolean> => {
    if (!user) return false;
    
    setSwitchingOrganization(true);
    
    try {
      // Call the switch_organization function
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
      
      // Fetch the new organization data
      const newOrg = await fetchOrganization(organizationId);
      if (newOrg) {
        setOrganization(newOrg);
        
        // Update profile's active organization locally
        setProfile(prev => prev ? { ...prev, active_organization_id: organizationId, organization_id: organizationId } : null);
        
        toast.success(`تم التبديل إلى ${newOrg.name}`);
        
        // Reload the page to ensure all components update correctly
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
  }, [user]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Defer Supabase calls with setTimeout
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setOrganization(null);
          setUserOrganizations([]);
          setRoles([]);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (data: SignUpData) => {
    try {
      // 1. Create organization first (will be pending approval)
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
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
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // 2. Create auth user
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
        // 3. Create profile
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

        // 4. Create user_organizations entry
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

        // 5. Assign company_admin role
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
  };

  const signUpDriver = async (data: DriverSignUpData) => {
    try {
      // 1. Create auth user
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
        // 2. Create profile (without organization - will be assigned later)
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

        // 3. Create driver record
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

        // 4. Assign driver role
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
  };

  const signOut = async () => {
    // Stop focus music on logout
    stopFocusMusicOnLogout();
    
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setOrganization(null);
    setUserOrganizations([]);
    setRoles([]);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        organization,
        userOrganizations,
        roles,
        loading,
        switchingOrganization,
        signIn,
        signUp,
        signUpDriver,
        signOut,
        refreshProfile,
        switchOrganization,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
