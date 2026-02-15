import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  FileText,
  Download,
  Eye,
  Search,
  Building2,
  Filter,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Recycle,
  Factory,
  ExternalLink,
  Check,
  X,
  AlertTriangle,
  History,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import BackButton from '@/components/ui/back-button';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface OrganizationDocument {
  id: string;
  organization_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  created_at: string;
  organization?: {
    id: string;
    name: string;
    organization_type: string;
    is_verified: boolean;
    email: string;
    phone: string;
  };
}

interface Organization {
  id: string;
  name: string;
  organization_type: string;
  is_verified: boolean;
  is_active: boolean;
  email: string;
  phone: string;
  commercial_register: string | null;
  environmental_license: string | null;
  representative_name: string | null;
  delegate_name: string | null;
  created_at: string;
}

interface ApprovalLog {
  id: string;
  organization_id: string;
  action: 'approved' | 'rejected';
  reason: string | null;
  performed_by: string;
  created_at: string;
  organization?: {
    name: string;
    organization_type: string;
  };
  performer?: {
    full_name: string;
    email: string;
  };
}

const OrganizationDocuments = () => {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<OrganizationDocument[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterOrgType, setFilterOrgType] = useState<string>('all');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [orgDocuments, setOrgDocuments] = useState<OrganizationDocument[]>([]);
  const [viewingDocument, setViewingDocument] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<Organization | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [approvalLogs, setApprovalLogs] = useState<ApprovalLog[]>([]);

  const isAdmin = roles.includes('admin');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!isAdmin) {
      navigate('/dashboard');
      toast.error('غير مصرح لك بالوصول لهذه الصفحة');
      return;
    }
    fetchData();
  }, [user, isAdmin]);

  const fetchData = async () => {
    try {
      // Fetch all organizations
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (orgsError) throw orgsError;
      setOrganizations(orgsData || []);

      // Fetch all documents with organization info
      const { data: docsData, error: docsError } = await supabase
        .from('organization_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (docsError) throw docsError;

      // Map organization info to documents
      const docsWithOrg = (docsData || []).map(doc => {
        const org = orgsData?.find(o => o.id === doc.organization_id);
        return { ...doc, organization: org };
      });

      setDocuments(docsWithOrg);

      // Fetch approval logs
      await fetchApprovalLogs(orgsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovalLogs = async (orgsData: Organization[]) => {
    try {
      const { data: logsData, error: logsError } = await supabase
        .from('organization_approval_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) throw logsError;

      // Get performer info
      const performerIds = [...new Set((logsData || []).map(l => l.performed_by))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', performerIds);

      // Map additional info to logs
      const logsWithInfo: ApprovalLog[] = (logsData || []).map(log => {
        const org = orgsData?.find(o => o.id === log.organization_id);
        const performer = profilesData?.find(p => p.user_id === log.performed_by);
        return {
          ...log,
          action: log.action as 'approved' | 'rejected',
          organization: org ? { name: org.name, organization_type: org.organization_type } : undefined,
          performer: performer ? { full_name: performer.full_name, email: performer.email } : undefined,
        };
      });

      setApprovalLogs(logsWithInfo);
    } catch (error) {
      console.error('Error fetching approval logs:', error);
    }
  };

  const fetchOrgDocuments = async (orgId: string) => {
    try {
      const { data, error } = await supabase
        .from('organization_documents')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrgDocuments(data || []);
    } catch (error) {
      console.error('Error fetching org documents:', error);
    }
  };

  const handleViewOrganization = async (org: Organization) => {
    setSelectedOrg(org);
    await fetchOrgDocuments(org.id);
  };

  const handleDownloadDocument = async (doc: OrganizationDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('organization-documents')
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('حدث خطأ في تحميل الملف');
    }
  };

  const handlePreviewDocument = async (doc: OrganizationDocument) => {
    try {
      setViewingDocument(doc.id);
      const { data, error } = await supabase.storage
        .from('organization-documents')
        .createSignedUrl(doc.file_path, 3600); // 1 hour expiry

      if (error) throw error;
      setPreviewUrl(data.signedUrl);
    } catch (error) {
      console.error('Error previewing document:', error);
      toast.error('حدث خطأ في عرض الملف');
      setViewingDocument(null);
    }
  };

  const handleApproveOrganization = async (orgId: string) => {
    setProcessing(true);
    try {
      // Update organization
      const { error: orgError } = await supabase
        .from('organizations')
        .update({ is_verified: true, is_active: true })
        .eq('id', orgId);

      if (orgError) throw orgError;

      // Activate all profiles in this organization
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_active: true })
        .eq('organization_id', orgId);

      if (profileError) throw profileError;

      // Log the approval action
      const { error: logError } = await supabase
        .from('organization_approval_logs')
        .insert({
          organization_id: orgId,
          action: 'approved',
          performed_by: user!.id,
        });

      if (logError) console.error('Error logging approval:', logError);

      toast.success('تم قبول الجهة وتفعيلها بنجاح');
      
      // Update local state
      setOrganizations(prev => prev.map(org => 
        org.id === orgId ? { ...org, is_verified: true, is_active: true } : org
      ));
      
      if (selectedOrg?.id === orgId) {
        setSelectedOrg({ ...selectedOrg, is_verified: true, is_active: true });
      }
      
      // Refresh logs
      fetchApprovalLogs(organizations);
      
      setApproving(null);
    } catch (error) {
      console.error('Error approving organization:', error);
      toast.error('حدث خطأ في قبول الجهة');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectOrganization = async () => {
    if (!rejecting) return;
    
    setProcessing(true);
    try {
      // Deactivate organization (don't delete, keep for records)
      const { error: orgError } = await supabase
        .from('organizations')
        .update({ is_verified: false, is_active: false })
        .eq('id', rejecting.id);

      if (orgError) throw orgError;

      // Deactivate all profiles in this organization
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('organization_id', rejecting.id);

      if (profileError) throw profileError;

      // Log the rejection action
      const { error: logError } = await supabase
        .from('organization_approval_logs')
        .insert({
          organization_id: rejecting.id,
          action: 'rejected',
          reason: rejectionReason || null,
          performed_by: user!.id,
        });

      if (logError) console.error('Error logging rejection:', logError);

      toast.success('تم رفض الجهة');
      
      // Update local state
      setOrganizations(prev => prev.map(org => 
        org.id === rejecting.id ? { ...org, is_verified: false, is_active: false } : org
      ));
      
      if (selectedOrg?.id === rejecting.id) {
        setSelectedOrg(null);
      }
      
      // Refresh logs
      fetchApprovalLogs(organizations);
      
      setRejecting(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting organization:', error);
      toast.error('حدث خطأ في رفض الجهة');
    } finally {
      setProcessing(false);
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      commercial_register: 'السجل التجاري',
      environmental_license: 'الترخيص البيئي',
      representative_id: 'هوية الممثل القانوني',
      delegate_authorization: 'تفويض المفوض',
      other: 'مستند آخر',
    };
    return labels[type] || type;
  };

  const getOrgTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      generator: 'الجهة المولدة',
      transporter: 'الجهة الناقلة',
      recycler: 'الجهة المدورة',
    };
    return labels[type] || type;
  };

  const getOrgTypeIcon = (type: string) => {
    switch (type) {
      case 'generator': return Factory;
      case 'transporter': return Truck;
      case 'recycler': return Recycle;
      default: return Building2;
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.organization?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || doc.document_type === filterType;
    const matchesOrgType = filterOrgType === 'all' || doc.organization?.organization_type === filterOrgType;
    return matchesSearch && matchesType && matchesOrgType;
  });

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOrgType = filterOrgType === 'all' || org.organization_type === filterOrgType;
    return matchesSearch && matchesOrgType;
  });

  // Stats
  const totalDocs = documents.length;
  const verifiedOrgs = organizations.filter(o => o.is_verified).length;
  const pendingOrgs = organizations.filter(o => !o.is_verified).length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <BackButton />

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">إدارة وثائق الجهات</h1>
          <p className="text-muted-foreground">عرض ومراجعة وثائق جميع الجهات المسجلة</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{organizations.length}</p>
                  <p className="text-sm text-muted-foreground">إجمالي الجهات</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{verifiedOrgs}</p>
                  <p className="text-sm text-muted-foreground">جهات موثقة</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-yellow-500/10">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingOrgs}</p>
                  <p className="text-sm text-muted-foreground">قيد المراجعة</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <FileText className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalDocs}</p>
                  <p className="text-sm text-muted-foreground">إجمالي الوثائق</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="البحث عن مؤسسة أو وثيقة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={filterOrgType} onValueChange={setFilterOrgType}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="w-4 h-4 ml-2" />
                  <SelectValue placeholder="نوع الجهة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="generator">الجهة المولدة</SelectItem>
                  <SelectItem value="transporter">الجهة الناقلة</SelectItem>
                  <SelectItem value="recycler">الجهة المدورة</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <FileText className="w-4 h-4 ml-2" />
                  <SelectValue placeholder="نوع الوثيقة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الوثائق</SelectItem>
                  <SelectItem value="commercial_register">السجل التجاري</SelectItem>
                  <SelectItem value="environmental_license">الترخيص البيئي</SelectItem>
                  <SelectItem value="representative_id">هوية الممثل</SelectItem>
                  <SelectItem value="delegate_authorization">تفويض المفوض</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="organizations" className="space-y-4" dir="rtl">
          <TabsList>
            <TabsTrigger value="organizations">
              <Building2 className="w-4 h-4 ml-2" />
              المؤسسات ({filteredOrganizations.length})
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="w-4 h-4 ml-2" />
              الوثائق ({filteredDocuments.length})
            </TabsTrigger>
            <TabsTrigger value="logs">
              <History className="w-4 h-4 ml-2" />
              سجل الموافقات ({approvalLogs.length})
            </TabsTrigger>
          </TabsList>

          {/* Organizations Tab */}
          <TabsContent value="organizations">
            <Card>
              <CardHeader>
                <CardTitle>قائمة المؤسسات</CardTitle>
                <CardDescription>جميع المؤسسات المسجلة في النظام</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الجهة</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>الممثل القانوني</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>تاريخ التسجيل</TableHead>
                      <TableHead>إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrganizations.map((org) => {
                      const OrgIcon = getOrgTypeIcon(org.organization_type);
                      const orgDocs = documents.filter(d => d.organization_id === org.id);
                      return (
                        <TableRow key={org.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-muted">
                                <OrgIcon className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-medium">{org.name}</p>
                                <p className="text-xs text-muted-foreground">{org.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{getOrgTypeLabel(org.organization_type)}</Badge>
                          </TableCell>
                          <TableCell>
                            {org.representative_name || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={org.is_verified ? 'default' : 'secondary'}>
                              {org.is_verified ? (
                                <>
                                  <CheckCircle className="w-3 h-3 ml-1" />
                                  موثقة
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 ml-1" />
                                  قيد المراجعة
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(org.created_at), 'dd MMM yyyy', { locale: ar })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewOrganization(org)}
                              >
                                <Eye className="w-4 h-4 ml-1" />
                                عرض
                              </Button>
                              {!org.is_verified && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={() => handleApproveOrganization(org.id)}
                                    disabled={processing}
                                    title="قبول"
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => setRejecting(org)}
                                    disabled={processing}
                                    title="رفض"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {filteredOrganizations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد مؤسسات مطابقة للبحث
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>جميع الوثائق</CardTitle>
                <CardDescription>الوثائق المرفوعة من جميع المؤسسات</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم الملف</TableHead>
                      <TableHead>نوع الوثيقة</TableHead>
                      <TableHead>الجهة</TableHead>
                      <TableHead>الحجم</TableHead>
                      <TableHead>تاريخ الرفع</TableHead>
                      <TableHead>إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            <span className="truncate max-w-[200px]">{doc.file_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getDocumentTypeLabel(doc.document_type)}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{doc.organization?.name || '-'}</span>
                        </TableCell>
                        <TableCell>
                          {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : '-'}
                        </TableCell>
                        <TableCell>
                          {format(new Date(doc.created_at), 'dd MMM yyyy', { locale: ar })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handlePreviewDocument(doc)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownloadDocument(doc)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredDocuments.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد وثائق مطابقة للبحث
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Approval Logs Tab */}
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  سجل عمليات الموافقة والرفض
                </CardTitle>
                <CardDescription>تتبع جميع عمليات قبول ورفض المؤسسات</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الجهة</TableHead>
                      <TableHead>الإجراء</TableHead>
                      <TableHead>السبب</TableHead>
                      <TableHead>بواسطة</TableHead>
                      <TableHead>التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvalLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{log.organization?.name || 'مؤسسة محذوفة'}</p>
                              <p className="text-xs text-muted-foreground">
                                {log.organization?.organization_type && getOrgTypeLabel(log.organization.organization_type)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.action === 'approved' ? (
                            <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                              <CheckCircle className="w-3 h-3 ml-1" />
                              قبول
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="w-3 h-3 ml-1" />
                              رفض
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {log.reason || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{log.performer?.full_name || 'مستخدم غير معروف'}</p>
                            <p className="text-xs text-muted-foreground">{log.performer?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {format(new Date(log.created_at), 'dd MMM yyyy - hh:mm a', { locale: ar })}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {approvalLogs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>لا توجد عمليات موافقة أو رفض حتى الآن</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Organization Details Dialog */}
        <Dialog open={!!selectedOrg} onOpenChange={() => setSelectedOrg(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                {selectedOrg?.name}
              </DialogTitle>
              <DialogDescription>
                تفاصيل الجهة والوثائق المرفقة
              </DialogDescription>
            </DialogHeader>

            {selectedOrg && (
              <div className="space-y-6">
                {/* Organization Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">نوع الجهة</p>
                    <p className="font-medium">{getOrgTypeLabel(selectedOrg.organization_type)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">الحالة</p>
                    <Badge variant={selectedOrg.is_verified ? 'default' : 'secondary'}>
                      {selectedOrg.is_verified ? 'موثقة' : 'قيد المراجعة'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">البريد الإلكتروني</p>
                    <p className="font-medium">{selectedOrg.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">الهاتف</p>
                    <p className="font-medium" dir="ltr">{selectedOrg.phone}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">السجل التجاري</p>
                    <p className="font-medium">{selectedOrg.commercial_register || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">الترخيص البيئي</p>
                    <p className="font-medium">{selectedOrg.environmental_license || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">الممثل القانوني</p>
                    <p className="font-medium">{selectedOrg.representative_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">المفوض</p>
                    <p className="font-medium">{selectedOrg.delegate_name || '-'}</p>
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    الوثائق المرفقة ({orgDocuments.length})
                  </h4>
                  {orgDocuments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">لا توجد وثائق مرفقة</p>
                  ) : (
                    <div className="divide-y rounded-lg border">
                      {orgDocuments.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-primary" />
                            <div>
                              <p className="font-medium text-sm">{doc.file_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {getDocumentTypeLabel(doc.document_type)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handlePreviewDocument(doc)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownloadDocument(doc)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {!selectedOrg.is_verified && (
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <Button
                      className="flex-1"
                      onClick={() => handleApproveOrganization(selectedOrg.id)}
                      disabled={processing}
                    >
                      {processing ? (
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 ml-2" />
                      )}
                      قبول وتفعيل الجهة
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        setSelectedOrg(null);
                        setRejecting(selectedOrg);
                      }}
                      disabled={processing}
                    >
                      <X className="w-4 h-4 ml-2" />
                      رفض الجهة
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Document Preview Dialog */}
        <Dialog open={!!viewingDocument} onOpenChange={() => { setViewingDocument(null); setPreviewUrl(null); }}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>معاينة الوثيقة</DialogTitle>
            </DialogHeader>
            {previewUrl && (
              <div className="w-full h-[70vh]">
                <iframe
                  src={previewUrl}
                  className="w-full h-full rounded-lg border"
                  title="Document Preview"
                />
              </div>
            )}
            {previewUrl && (
              <div className="flex justify-end gap-2">
                <Button variant="outline" asChild>
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 ml-2" />
                    فتح في نافذة جديدة
                  </a>
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Rejection Confirmation Dialog */}
        <AlertDialog open={!!rejecting} onOpenChange={() => { setRejecting(null); setRejectionReason(''); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                رفض الجهة
              </AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من رفض جهة "{rejecting?.name}"؟ سيتم إلغاء تفعيل الجهة وجميع المستخدمين المرتبطين بها.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2 py-4">
              <Label>سبب الرفض (اختياري)</Label>
              <Textarea
                placeholder="أدخل سبب الرفض..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel disabled={processing}>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRejectOrganization}
                disabled={processing}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                ) : (
                  <X className="w-4 h-4 ml-2" />
                )}
                تأكيد الرفض
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default OrganizationDocuments;
