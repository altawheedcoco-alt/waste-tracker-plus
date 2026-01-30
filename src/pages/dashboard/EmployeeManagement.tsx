import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  Phone, 
  Briefcase, 
  Building2,
  Shield,
  Check,
  X,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const DEPARTMENTS = [
  { value: 'operations', label: 'العمليات' },
  { value: 'logistics', label: 'اللوجستيات' },
  { value: 'sales', label: 'المبيعات' },
  { value: 'finance', label: 'المالية' },
  { value: 'hr', label: 'الموارد البشرية' },
  { value: 'it', label: 'تقنية المعلومات' },
  { value: 'quality', label: 'الجودة' },
  { value: 'safety', label: 'السلامة' },
];

const PERMISSIONS = [
  { value: 'view_shipments', label: 'عرض الشحنات' },
  { value: 'create_shipments', label: 'إنشاء الشحنات' },
  { value: 'manage_shipments', label: 'إدارة الشحنات' },
  { value: 'view_reports', label: 'عرض التقارير' },
  { value: 'manage_drivers', label: 'إدارة السائقين' },
  { value: 'chat', label: 'الدردشة مع الشركات' },
  { value: 'view_documents', label: 'عرض المستندات' },
  { value: 'manage_documents', label: 'إدارة المستندات' },
];

interface Employee {
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
  permissions?: string[];
}

const EmployeeManagement = () => {
  const { user, organization, roles } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    position: '',
    department: '',
    permissions: [] as string[],
  });

  const isAdmin = roles.includes('admin');
  const isCompanyAdmin = roles.includes('company_admin');
  const canManageEmployees = isAdmin || isCompanyAdmin;

  // Fetch employees
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees', organization?.id],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!isAdmin && organization?.id) {
        query = query.eq('organization_id', organization.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch permissions for each employee
      const employeesWithPermissions = await Promise.all(
        (data || []).map(async (emp) => {
          const { data: perms } = await supabase
            .from('employee_permissions')
            .select('permission_type')
            .eq('profile_id', emp.id);
          
          return {
            ...emp,
            permissions: perms?.map(p => p.permission_type) || [],
          };
        })
      );

      return employeesWithPermissions as Employee[];
    },
    enabled: !!user,
  });

  // Add employee mutation
  const addEmployeeMutation = useMutation({
    mutationFn: async (data: typeof newEmployee) => {
      const response = await supabase.functions.invoke('register-employee', {
        body: {
          ...data,
          organization_id: organization?.id,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);
      
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'تم إضافة الموظف',
        description: 'تم تسجيل الموظف بنجاح',
      });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Toggle employee status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث حالة الموظف',
      });
    },
  });

  const resetForm = () => {
    setNewEmployee({
      full_name: '',
      email: '',
      password: '',
      phone: '',
      position: '',
      department: '',
      permissions: [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.full_name || !newEmployee.email || !newEmployee.password) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await addEmployeeMutation.mutateAsync(newEmployee);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePermission = (permission: string) => {
    setNewEmployee(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const filteredEmployees = employees.filter(emp =>
    emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.position?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDepartmentLabel = (value: string | null) => {
    return DEPARTMENTS.find(d => d.value === value)?.label || value || '-';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <BackButton />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-7 w-7 text-primary" />
              إدارة الموظفين
            </h1>
            <p className="text-muted-foreground mt-1">
              إدارة موظفي المنشأة وتحديد صلاحياتهم
            </p>
          </div>

          {canManageEmployees && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  إضافة موظف
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>إضافة موظف جديد</DialogTitle>
                  <DialogDescription>
                    أدخل بيانات الموظف الجديد وحدد صلاحياته
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">الاسم الكامل *</Label>
                      <Input
                        id="full_name"
                        value={newEmployee.full_name}
                        onChange={(e) => setNewEmployee(prev => ({ ...prev, full_name: e.target.value }))}
                        placeholder="أدخل الاسم الكامل"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">البريد الإلكتروني *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newEmployee.email}
                        onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="example@company.com"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">كلمة المرور *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={newEmployee.password}
                          onChange={(e) => setNewEmployee(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="أدخل كلمة المرور"
                          required
                          minLength={6}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute left-0 top-0 h-full"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">رقم الهاتف</Label>
                      <Input
                        id="phone"
                        value={newEmployee.phone}
                        onChange={(e) => setNewEmployee(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="05xxxxxxxx"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="position">المسمى الوظيفي</Label>
                      <Input
                        id="position"
                        value={newEmployee.position}
                        onChange={(e) => setNewEmployee(prev => ({ ...prev, position: e.target.value }))}
                        placeholder="مثال: مدير العمليات"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="department">القسم</Label>
                      <Select
                        value={newEmployee.department}
                        onValueChange={(value) => setNewEmployee(prev => ({ ...prev, department: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر القسم" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEPARTMENTS.map((dept) => (
                            <SelectItem key={dept.value} value={dept.value}>
                              {dept.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      الصلاحيات
                    </Label>
                    <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg bg-muted/50">
                      {PERMISSIONS.map((perm) => (
                        <div key={perm.value} className="flex items-center gap-2">
                          <Checkbox
                            id={perm.value}
                            checked={newEmployee.permissions.includes(perm.value)}
                            onCheckedChange={() => togglePermission(perm.value)}
                          />
                          <Label htmlFor={perm.value} className="cursor-pointer text-sm">
                            {perm.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'جاري الإضافة...' : 'إضافة الموظف'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{employees.length}</p>
                  <p className="text-sm text-muted-foreground">إجمالي الموظفين</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Check className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{employees.filter(e => e.is_active).length}</p>
                  <p className="text-sm text-muted-foreground">نشط</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <X className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{employees.filter(e => !e.is_active).length}</p>
                  <p className="text-sm text-muted-foreground">غير نشط</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Briefcase className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {new Set(employees.map(e => e.department).filter(Boolean)).size}
                  </p>
                  <p className="text-sm text-muted-foreground">أقسام</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث بالاسم أو البريد أو المسمى..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Employees List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredEmployees.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">لا يوجد موظفين</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'لا توجد نتائج للبحث' : 'ابدأ بإضافة موظفين جدد'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredEmployees.map((employee, index) => (
              <motion.div
                key={employee.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={cn(
                  "transition-all hover:shadow-md",
                  !employee.is_active && "opacity-60"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={employee.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {employee.full_name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{employee.full_name}</h3>
                          <Badge variant={employee.is_active ? 'default' : 'secondary'}>
                            {employee.is_active ? 'نشط' : 'غير نشط'}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            {employee.email}
                          </span>
                          {employee.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5" />
                              {employee.phone}
                            </span>
                          )}
                          {employee.position && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3.5 w-3.5" />
                              {employee.position}
                            </span>
                          )}
                          {employee.department && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" />
                              {getDepartmentLabel(employee.department)}
                            </span>
                          )}
                        </div>

                        {employee.permissions && employee.permissions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {employee.permissions.slice(0, 3).map((perm) => (
                              <Badge key={perm} variant="outline" className="text-xs">
                                {PERMISSIONS.find(p => p.value === perm)?.label || perm}
                              </Badge>
                            ))}
                            {employee.permissions.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{employee.permissions.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {canManageEmployees && employee.user_id !== user?.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-background">
                            <DropdownMenuItem
                              onClick={() => toggleStatusMutation.mutate({ 
                                id: employee.id, 
                                is_active: employee.is_active 
                              })}
                            >
                              {employee.is_active ? (
                                <>
                                  <X className="h-4 w-4 ml-2" />
                                  تعطيل الحساب
                                </>
                              ) : (
                                <>
                                  <Check className="h-4 w-4 ml-2" />
                                  تفعيل الحساب
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EmployeeManagement;
