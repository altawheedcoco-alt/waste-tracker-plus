import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Users, 
  Search, 
  Mail, 
  Key,
  Phone, 
  Briefcase, 
  Truck,
  Copy,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Shield,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  position: string | null;
  department: string | null;
  is_active: boolean;
  avatar_url: string | null;
  created_at: string;
  type: 'employee' | 'driver';
  driver_info?: {
    license_number: string;
    vehicle_type: string | null;
    vehicle_plate: string | null;
    is_available: boolean;
  };
  stored_password?: string;
}

// Password storage for newly created members (in-memory, would need proper storage in production)
const getStoredCredentials = (): Record<string, string> => {
  try {
    const stored = sessionStorage.getItem('team_credentials');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const storeCredentials = (email: string, password: string) => {
  const current = getStoredCredentials();
  current[email] = password;
  sessionStorage.setItem('team_credentials', JSON.stringify(current));
};

const TeamCredentials = () => {
  const { organization, roles } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const storedCredentials = getStoredCredentials();

  const isCompanyAdmin = roles.includes('company_admin') || roles.includes('admin');

  // Fetch employees
  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['team-employees', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(emp => ({
        ...emp,
        type: 'employee' as const,
        stored_password: storedCredentials[emp.email],
      }));
    },
    enabled: !!organization?.id,
  });

  // Fetch drivers
  const { data: drivers = [], isLoading: loadingDrivers } = useQuery({
    queryKey: ['team-drivers', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          id,
          license_number,
          vehicle_type,
          vehicle_plate,
          is_available,
          profile:profiles(id, user_id, full_name, email, phone, is_active, avatar_url, created_at)
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || [])
        .filter(d => d.profile)
        .map(driver => ({
          id: driver.profile!.id,
          user_id: driver.profile!.user_id,
          full_name: driver.profile!.full_name,
          email: driver.profile!.email,
          phone: driver.profile!.phone,
          position: 'سائق',
          department: null,
          is_active: driver.profile!.is_active,
          avatar_url: driver.profile!.avatar_url,
          created_at: driver.profile!.created_at,
          type: 'driver' as const,
          driver_info: {
            license_number: driver.license_number,
            vehicle_type: driver.vehicle_type,
            vehicle_plate: driver.vehicle_plate,
            is_available: driver.is_available,
          },
          stored_password: storedCredentials[driver.profile!.email],
        }));
    },
    enabled: !!organization?.id,
  });

  const allMembers = [...employees, ...drivers];

  const filteredEmployees = employees.filter(emp =>
    emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDrivers = drivers.filter(driver =>
    driver.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`تم نسخ ${label}`);
  };

  const renderMemberCard = (member: TeamMember) => (
    <motion.div
      key={member.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={member.avatar_url || ''} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {member.full_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    {member.full_name}
                    {member.type === 'driver' && (
                      <Badge variant="outline" className="text-xs">
                        <Truck className="w-3 h-3 ml-1" />
                        سائق
                      </Badge>
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground">{member.position || '-'}</p>
                </div>
                <Badge variant={member.is_active ? 'default' : 'secondary'}>
                  {member.is_active ? (
                    <><UserCheck className="w-3 h-3 ml-1" /> نشط</>
                  ) : (
                    <><UserX className="w-3 h-3 ml-1" /> غير نشط</>
                  )}
                </Badge>
              </div>

              {/* Credentials Section */}
              <div className="space-y-2 p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="font-mono text-xs break-all">{member.email}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => copyToClipboard(member.email, 'البريد الإلكتروني')}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>

                {member.stored_password && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Key className="w-4 h-4 text-muted-foreground" />
                      <span className="font-mono text-xs">
                        {visiblePasswords[member.id] ? member.stored_password : '••••••••••'}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => togglePasswordVisibility(member.id)}
                      >
                        {visiblePasswords[member.id] ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyToClipboard(member.stored_password!, 'كلمة المرور')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {!member.stored_password && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    كلمة المرور غير متوفرة (تم التسجيل خارجياً أو تم تغييرها)
                  </p>
                )}
                
                {member.stored_password && member.type === 'driver' && (
                  <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                    ⚠️ قد يكون السائق قد غيّر كلمة المرور من حسابه
                  </p>
                )}
              </div>

              {/* Phone */}
              {member.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span dir="ltr">{member.phone}</span>
                </div>
              )}

              {/* Driver Info */}
              {member.driver_info && (
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline">
                    رخصة: {member.driver_info.license_number}
                  </Badge>
                  {member.driver_info.vehicle_plate && (
                    <Badge variant="outline">
                      لوحة: {member.driver_info.vehicle_plate}
                    </Badge>
                  )}
                  {member.driver_info.vehicle_type && (
                    <Badge variant="outline">
                      {member.driver_info.vehicle_type}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (!isCompanyAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-2">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">ليس لديك صلاحية الوصول لهذه الصفحة</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BackButton />

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            بيانات دخول الفريق
          </h1>
          <p className="text-muted-foreground mt-1">
            عرض بيانات دخول الموظفين والسائقين المسجلين من لوحة التحكم
          </p>
        </div>

        {/* Info Banner */}
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              💡 <strong>ملاحظة:</strong> البريد الإلكتروني يُحدّث تلقائياً من قاعدة البيانات. كلمات المرور المعروضة هي الكلمات الأولية التي تم إنشاؤها - قد يكون الموظف أو السائق قد غيّرها من حسابه.
            </p>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allMembers.length}</p>
                <p className="text-sm text-muted-foreground">إجمالي الفريق</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Briefcase className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{employees.length}</p>
                <p className="text-sm text-muted-foreground">موظفين</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Truck className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{drivers.length}</p>
                <p className="text-sm text-muted-foreground">سائقين</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Key className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {allMembers.filter(m => m.stored_password).length}
                </p>
                <p className="text-sm text-muted-foreground">بيانات محفوظة</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث بالاسم أو البريد..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all">الكل ({allMembers.length})</TabsTrigger>
            <TabsTrigger value="employees">الموظفين ({employees.length})</TabsTrigger>
            <TabsTrigger value="drivers">السائقين ({drivers.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              {[...filteredEmployees, ...filteredDrivers].map(renderMemberCard)}
              {filteredEmployees.length === 0 && filteredDrivers.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  لا توجد نتائج
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="employees" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              {filteredEmployees.map(renderMemberCard)}
              {filteredEmployees.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  لا يوجد موظفين
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="drivers" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              {filteredDrivers.map(renderMemberCard)}
              {filteredDrivers.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  لا يوجد سائقين
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default TeamCredentials;

// Export helper function to store credentials from other components
export { storeCredentials };
