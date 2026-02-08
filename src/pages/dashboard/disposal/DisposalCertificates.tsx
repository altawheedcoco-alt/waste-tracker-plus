import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileCheck, 
  Plus, 
  Search, 
  Download,
  Eye,
  Calendar,
  CheckCircle,
  AlertTriangle,
  QrCode,
  Printer
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const DisposalCertificates = () => {
  const navigate = useNavigate();
  const { organization } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch facility
  const { data: facility } = useQuery({
    queryKey: ['disposal-facility', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data } = await supabase
        .from('disposal_facilities')
        .select('*')
        .eq('organization_id', organization.id)
        .single();
      return data;
    },
    enabled: !!organization?.id
  });

  const { data: certificates, isLoading } = useQuery({
    queryKey: ['disposal-certificates', facility?.id],
    queryFn: async () => {
      if (!facility?.id) return [];
      
      const { data, error } = await supabase
        .from('disposal_certificates')
        .select(`
          *,
          organization:organizations(name)
        `)
        .eq('disposal_facility_id', facility.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!facility?.id
  });

  const filteredCertificates = certificates?.filter((cert: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      cert.certificate_number?.toLowerCase().includes(query) ||
      cert.waste_description?.toLowerCase().includes(query) ||
      cert.organization?.name?.toLowerCase().includes(query)
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6" dir="rtl">
        <BackButton />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <FileCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">شهادات التخلص</h1>
              <p className="text-muted-foreground text-sm">إصدار وإدارة شهادات التخلص الآمن من المخلفات</p>
            </div>
          </div>

          <Button 
            className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            onClick={() => navigate('/dashboard/disposal/certificates/new')}
          >
            <Plus className="w-4 h-4" />
            إصدار شهادة جديدة
          </Button>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث برقم الشهادة أو الجهة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </motion.div>

        {/* Certificates Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">سجل الشهادات ({filteredCertificates?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredCertificates && filteredCertificates.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">رقم الشهادة</TableHead>
                        <TableHead className="text-right">الجهة</TableHead>
                        <TableHead className="text-right">نوع المخلف</TableHead>
                        <TableHead className="text-right">الكمية</TableHead>
                        <TableHead className="text-right">تاريخ الإصدار</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-center">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCertificates.map((cert: any) => (
                        <TableRow key={cert.id}>
                          <TableCell className="font-mono font-medium">
                            {cert.certificate_number}
                          </TableCell>
                          <TableCell>{cert.organization?.name || '-'}</TableCell>
                          <TableCell>
                            <div>
                              <p>{cert.waste_description || cert.waste_type}</p>
                              <p className="text-xs text-muted-foreground">{cert.disposal_method}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {cert.quantity} {cert.unit}
                          </TableCell>
                          <TableCell>
                            {format(new Date(cert.issue_date), 'dd MMM yyyy', { locale: ar })}
                          </TableCell>
                          <TableCell>
                            {cert.verified ? (
                              <Badge className="bg-green-500/10 text-green-600 gap-1">
                                <CheckCircle className="w-3 h-3" />
                                موثقة
                              </Badge>
                            ) : (
                              <Badge variant="secondary">قيد التوثيق</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="icon" title="عرض">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" title="QR Code">
                                <QrCode className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" title="طباعة">
                                <Printer className="w-4 h-4" />
                              </Button>
                              {cert.pdf_url && (
                                <Button variant="ghost" size="icon" title="تحميل">
                                  <Download className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">لا توجد شهادات</h3>
                  <p className="text-muted-foreground mb-4">ابدأ بإصدار أول شهادة تخلص</p>
                  <Button onClick={() => navigate('/dashboard/disposal/certificates/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    إصدار شهادة جديدة
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default DisposalCertificates;
