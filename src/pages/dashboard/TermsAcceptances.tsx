import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import BackButton from '@/components/ui/back-button';
import {
  FileCheck,
  Search,
  Users,
  Factory,
  Truck,
  Recycle,
  Calendar,
  CheckCircle2,
  Clock,
  RefreshCcw,
  Building2,
  Shield,
  AlertTriangle,
  Eye,
  Printer,
  Download,
  MoreHorizontal,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { usePDFExport } from '@/hooks/usePDFExport';
import TermsDocumentDialog from '@/components/terms/TermsDocumentDialog';
import TermsDocumentPrint from '@/components/terms/TermsDocumentPrint';

interface TermsAcceptance {
  id: string;
  user_id: string;
  organization_id: string | null;
  organization_type: string;
  terms_version: string;
  accepted_at: string;
  ip_address: string | null;
  user_agent: string | null;
  full_name: string | null;
  organization_name: string | null;
  organization_logo_url?: string | null;
  profile_email?: string;
  profile_phone?: string;
  signer_national_id?: string | null;
  signer_phone?: string | null;
  signer_position?: string | null;
  signer_id_front_url?: string | null;
  signer_id_back_url?: string | null;
  signer_signature_url?: string | null;
  verified_match?: boolean;
}

interface AcceptanceStats {
  total: number;
  generators: number;
  transporters: number;
  recyclers: number;
  thisMonth: number;
  pendingOrganizations: number;
}

const CURRENT_TERMS_VERSION = '1.0.0';

const TermsAcceptances = () => {
  const [acceptances, setAcceptances] = useState<TermsAcceptance[]>([]);
  const [stats, setStats] = useState<AcceptanceStats>({
    total: 0,
    generators: 0,
    transporters: 0,
    recyclers: 0,
    thisMonth: 0,
    pendingOrganizations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedAcceptance, setSelectedAcceptance] = useState<TermsAcceptance | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { exportToPDF, printContent, isExporting } = usePDFExport({
    filename: 'terms-acceptance',
    orientation: 'portrait',
    format: 'a4',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch acceptances - the table already has full_name and organization_name
      const { data: acceptancesData, error } = await supabase
        .from('terms_acceptances')
        .select('*')
        .order('accepted_at', { ascending: false });

      if (error) throw error;

      // Fetch profile emails and organization logos for display
      const userIds = acceptancesData?.map(a => a.user_id).filter(Boolean) || [];
      const orgIds = acceptancesData?.map(a => a.organization_id).filter(Boolean) || [];
      let profilesMap: Record<string, { email: string; phone: string | null }> = {};
      let orgsMap: Record<string, { logo_url: string | null }> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, email, phone')
          .in('user_id', userIds);
        
        profiles?.forEach(p => {
          profilesMap[p.user_id] = { email: p.email, phone: p.phone };
        });
      }

      if (orgIds.length > 0) {
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id, logo_url')
          .in('id', orgIds);
        
        orgs?.forEach(o => {
          orgsMap[o.id] = { logo_url: o.logo_url };
        });
      }

      const enrichedData = acceptancesData?.map(a => ({
        ...a,
        profile_email: profilesMap[a.user_id]?.email,
        profile_phone: profilesMap[a.user_id]?.phone,
        organization_logo_url: a.organization_id ? orgsMap[a.organization_id]?.logo_url : null,
      })) || [];

      setAcceptances(enrichedData);

      // Calculate stats
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const generators = acceptancesData?.filter(a => a.organization_type === 'generator').length || 0;
      const transporters = acceptancesData?.filter(a => a.organization_type === 'transporter').length || 0;
      const recyclers = acceptancesData?.filter(a => a.organization_type === 'recycler').length || 0;
      const thisMonth = acceptancesData?.filter(a => new Date(a.accepted_at) >= startOfMonth).length || 0;

      // Fetch organizations that haven't accepted yet
      const { data: allOrgs } = await supabase
        .from('organizations')
        .select('id, organization_type')
        .eq('is_active', true);

      const acceptedOrgIds = new Set(acceptancesData?.map(a => a.organization_id).filter(Boolean));
      const pendingOrganizations = allOrgs?.filter(org => !acceptedOrgIds.has(org.id)).length || 0;

      setStats({
        total: acceptancesData?.length || 0,
        generators,
        transporters,
        recyclers,
        thisMonth,
        pendingOrganizations,
      });

    } catch (error) {
      console.error('Error fetching terms acceptances:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOrgTypeLabel = (type: string) => {
    switch (type) {
      case 'generator': return 'الجهة المولدة';
      case 'transporter': return 'الجهة الناقلة';
      case 'recycler': return 'الجهة المدورة';
      default: return type;
    }
  };

  const getOrgTypeIcon = (type: string) => {
    switch (type) {
      case 'generator': return Factory;
      case 'transporter': return Truck;
      case 'recycler': return Recycle;
      default: return Building2;
    }
  };

  const getOrgTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'generator': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'transporter': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      case 'recycler': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredAcceptances = acceptances.filter(acceptance => {
    const matchesSearch = 
      acceptance.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acceptance.profile_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acceptance.organization_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === 'all' || acceptance.organization_type === activeTab;
    
    return matchesSearch && matchesTab;
  });

  const handleViewDocument = (acceptance: TermsAcceptance) => {
    setSelectedAcceptance(acceptance);
    setDialogOpen(true);
  };

  const handlePrintDocument = (acceptance: TermsAcceptance) => {
    setSelectedAcceptance(acceptance);
    setTimeout(() => {
      if (printRef.current) {
        printContent(printRef.current);
      }
    }, 100);
  };

  const handleDownloadDocument = (acceptance: TermsAcceptance) => {
    setSelectedAcceptance(acceptance);
    setTimeout(() => {
      if (printRef.current) {
        exportToPDF(printRef.current, `موافقة-الشروط-${acceptance.organization_name || acceptance.id.slice(0, 8)}`);
      }
    }, 100);
  };

  const statCards = [
    { 
      title: 'إجمالي الموافقات', 
      value: stats.total, 
      icon: FileCheck, 
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    { 
      title: 'الجهات المولدة', 
      value: stats.generators, 
      icon: Factory, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    { 
      title: 'الجهات الناقلة', 
      value: stats.transporters, 
      icon: Truck, 
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    },
    { 
      title: 'الجهات المدورة', 
      value: stats.recyclers, 
      icon: Recycle, 
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
  ];

  return (
    <DashboardLayout>
      <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <BackButton />
          <div className="text-right">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-7 w-7 text-primary" />
              إدارة موافقات الشروط والأحكام
            </h1>
            <p className="text-muted-foreground">
              متابعة موافقات الجهات على السياسات والشروط القانونية
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Calendar className="h-3 w-3" />
            الإصدار الحالي: {CURRENT_TERMS_VERSION}
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCcw className="ml-2 h-4 w-4" />
            تحديث
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">موافقات هذا الشهر</p>
                <p className="text-3xl font-bold mt-1">{stats.thisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={stats.pendingOrganizations > 0 ? 'border-amber-500/50' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className={`w-12 h-12 rounded-xl ${stats.pendingOrganizations > 0 ? 'bg-amber-500/10' : 'bg-gray-500/10'} flex items-center justify-center`}>
                {stats.pendingOrganizations > 0 ? (
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                ) : (
                  <Clock className="w-6 h-6 text-gray-500" />
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">جهات لم توافق بعد</p>
                <p className="text-3xl font-bold mt-1">{stats.pendingOrganizations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acceptances Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-right">
              <CardTitle>سجل الموافقات</CardTitle>
              <CardDescription>جميع موافقات الشروط والأحكام المسجلة</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو البريد أو الشركة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 text-right"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
            <TabsList className="mb-4">
              <TabsTrigger value="all" className="gap-2">
                <Users className="h-4 w-4" />
                الكل ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="generator" className="gap-2">
                <Factory className="h-4 w-4" />
                المولدة ({stats.generators})
              </TabsTrigger>
              <TabsTrigger value="transporter" className="gap-2">
                <Truck className="h-4 w-4" />
                الناقلة ({stats.transporters})
              </TabsTrigger>
              <TabsTrigger value="recycler" className="gap-2">
                <Recycle className="h-4 w-4" />
                المدورة ({stats.recyclers})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredAcceptances.length === 0 ? (
                <div className="text-center py-12">
                  <FileCheck className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">لا توجد موافقات مسجلة</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    ستظهر الموافقات هنا عند قبول الجهات للشروط والأحكام
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">المستخدم</TableHead>
                        <TableHead className="text-right">الجهة</TableHead>
                        <TableHead className="text-right">النوع</TableHead>
                        <TableHead className="text-right">الإصدار</TableHead>
                        <TableHead className="text-right">تاريخ الموافقة</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAcceptances.map((acceptance) => {
                        const OrgIcon = getOrgTypeIcon(acceptance.organization_type);
                        return (
                          <TableRow key={acceptance.id}>
                            <TableCell className="text-right">
                              <div>
                                <p className="font-medium">{acceptance.full_name || 'غير معروف'}</p>
                                <p className="text-sm text-muted-foreground">{acceptance.profile_email}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <p className="font-medium">{acceptance.organization_name || 'غير محدد'}</p>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge className={`gap-1 ${getOrgTypeBadgeColor(acceptance.organization_type)}`}>
                                <OrgIcon className="h-3 w-3" />
                                {getOrgTypeLabel(acceptance.organization_type)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline">{acceptance.terms_version}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center gap-2 justify-end">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {format(new Date(acceptance.accepted_at), 'dd MMMM yyyy - hh:mm a', { locale: ar })}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge className="gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                <CheckCircle2 className="h-3 w-3" />
                                تمت الموافقة
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem onClick={() => handleViewDocument(acceptance)}>
                                    <Eye className="ml-2 h-4 w-4" />
                                    عرض الوثيقة
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handlePrintDocument(acceptance)}>
                                    <Printer className="ml-2 h-4 w-4" />
                                    طباعة الوثيقة
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDownloadDocument(acceptance)}>
                                    <Download className="ml-2 h-4 w-4" />
                                    تحميل PDF
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Document View Dialog - Admin sees signature */}
      <TermsDocumentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        acceptance={selectedAcceptance}
        showSignature={true}
      />

      {/* Hidden Print Component - Admin version with signature */}
      <div className="hidden">
        {selectedAcceptance && (
          <TermsDocumentPrint ref={printRef} acceptance={selectedAcceptance} showSignature={true} />
        )}
      </div>
    </motion.div>
  );
};

export default TermsAcceptances;
