import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Recycle, Truck, AlertTriangle, CheckCircle, Building2, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

const RegulatorDashboard = () => {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [stats, setStats] = useState({ totalCompanies: 0, compliant: 0, violations: 0, totalWaste: 0 });
  const [violations, setViolations] = useState<any[]>([]);

  useEffect(() => {
    if (!user) { navigate('/auth', { replace: true }); return; }
    // Only admin can access regulator dashboard
    if (!roles.includes('admin')) { navigate('/dashboard', { replace: true }); return; }
    fetchStats();
  }, [user, roles]);

  const fetchStats = async () => {
    const { count: totalCompanies } = await supabase.from('regulated_companies').select('*', { count: 'exact', head: true });
    const { count: compliant } = await supabase.from('regulated_companies').select('*', { count: 'exact', head: true }).eq('is_compliant', true);
    const { count: expired } = await supabase.from('regulated_companies').select('*', { count: 'exact', head: true }).eq('license_status', 'expired');

    setStats({
      totalCompanies: totalCompanies || 0,
      compliant: compliant || 0,
      violations: expired || 0,
      totalWaste: 0,
    });

    // Fetch violation records (expired licenses)
    const { data } = await supabase
      .from('regulated_companies')
      .select('*')
      .or('license_status.eq.expired,is_compliant.eq.false')
      .order('license_expiry_date', { ascending: true })
      .limit(20);
    setViolations(data || []);
  };

  const statCards = [
    { label: 'إجمالي الشركات المسجلة', value: stats.totalCompanies, icon: Building2, color: 'text-primary' },
    { label: 'شركات ملتزمة', value: stats.compliant, icon: CheckCircle, color: 'text-green-600' },
    { label: 'مخالفات / تراخيص منتهية', value: stats.violations, icon: AlertTriangle, color: 'text-destructive' },
    { label: 'معدل الامتثال', value: stats.totalCompanies > 0 ? `${Math.round((stats.compliant / stats.totalCompanies) * 100)}%` : '0%', icon: BarChart3, color: 'text-blue-600' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6">
        <BackButton />
        <div className="flex items-center gap-3">
          <Recycle className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">لوحة الرقابة البيئية</h1>
            <p className="text-muted-foreground text-sm">مراقبة الامتثال البيئي وتراخيص الشركات</p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Violations Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              المخالفات والتنبيهات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {violations.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">لا توجد مخالفات حالياً ✅</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-3">اسم الشركة</th>
                      <th className="text-right p-3">نوع الترخيص</th>
                      <th className="text-right p-3">المحافظة</th>
                      <th className="text-right p-3">تاريخ الانتهاء</th>
                      <th className="text-right p-3">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {violations.map((v) => (
                      <tr key={v.id} className="border-b hover:bg-muted/50">
                        <td className="p-3 font-medium">{v.company_name_ar || v.company_name}</td>
                        <td className="p-3">
                          <Badge variant="outline">{v.license_type}</Badge>
                        </td>
                        <td className="p-3">{v.governorate}</td>
                        <td className="p-3">{v.license_expiry_date || '-'}</td>
                        <td className="p-3">
                          <Badge variant={v.license_status === 'expired' ? 'destructive' : 'secondary'}>
                            {v.license_status === 'expired' ? 'منتهي' : 'غير ملتزم'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default RegulatorDashboard;
