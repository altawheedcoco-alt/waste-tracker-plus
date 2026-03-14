import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  FileText, Download, Eye, Clock, FolderOpen, FileCheck,
  FileSpreadsheet, Image, File, Loader2, ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMyPermissions } from '@/hooks/useMyPermissions';

const fileTypeConfig: Record<string, { icon: typeof FileText; color: string; bg: string }> = {
  pdf: { icon: FileText, color: 'text-rose-600', bg: 'bg-rose-500/10' },
  doc: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-500/10' },
  xls: { icon: FileSpreadsheet, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  img: { icon: Image, color: 'text-violet-600', bg: 'bg-violet-500/10' },
  default: { icon: File, color: 'text-muted-foreground', bg: 'bg-muted/50' },
};

const getFileType = (url: string): string => {
  if (!url) return 'default';
  const ext = url.split('.').pop()?.toLowerCase() || '';
  if (['pdf'].includes(ext)) return 'pdf';
  if (['doc', 'docx'].includes(ext)) return 'doc';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'xls';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'img';
  return 'default';
};

const MyDocumentsTab = () => {
  const { user, organization } = useAuth();
  const { hasPermission } = useMyPermissions();
  const navigate = useNavigate();

  // Recycling certificates
  const { data: certificates = [], isLoading: certsLoading } = useQuery({
    queryKey: ['my-documents-certs', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await (supabase.from('recycling_certificates') as any)
        .select('id, certificate_number, status, created_at, waste_type')
        .eq('generator_organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(20);
      return (data as any[]) || [];
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 5,
  });

  // Invoices
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['my-documents-invoices', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('invoices')
        .select('id, invoice_number, status, total_amount, created_at')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 5,
  });

  // Deposits
  const { data: deposits = [], isLoading: depositsLoading } = useQuery({
    queryKey: ['my-documents-deposits', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('deposits')
        .select('id, amount, status, created_at, receipt_url, reference_number')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!organization?.id && hasPermission('view_financials'),
    staleTime: 1000 * 60 * 5,
  });

  const isLoading = certsLoading || invoicesLoading || depositsLoading;

  const documentSections = [
    {
      id: 'certificates',
      title: 'الشهادات',
      icon: FileCheck,
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10',
      items: certificates.map((c: any) => ({
        id: c.id,
        title: `شهادة ${c.certificate_number || ''}`,
        subtitle: c.waste_type || 'شهادة تدوير',
        date: c.created_at,
        status: c.status,
        url: null,
      })),
      emptyText: 'لا توجد شهادات',
      link: '/dashboard/recycling-certificates',
    },
    {
      id: 'invoices',
      title: 'الفواتير',
      icon: FileSpreadsheet,
      color: 'text-blue-600',
      bg: 'bg-blue-500/10',
      items: invoices.map(inv => ({
        id: inv.id,
        title: `فاتورة ${inv.invoice_number || ''}`,
        subtitle: inv.total_amount ? `${inv.total_amount} ج.م` : '',
        date: inv.created_at,
        status: inv.status,
        url: null,
      })),
      emptyText: 'لا توجد فواتير',
      link: '/dashboard/partner-accounts',
    },
    {
      id: 'deposits',
      title: 'إيصالات الإيداع',
      icon: FileText,
      color: 'text-amber-600',
      bg: 'bg-amber-500/10',
      items: deposits.map(dep => ({
        id: dep.id,
        title: `إيداع ${dep.reference_number || ''}`,
        subtitle: dep.amount ? `${dep.amount} ج.م` : '',
        date: dep.created_at,
        status: dep.status,
        url: dep.receipt_url,
      })),
      emptyText: 'لا توجد إيداعات',
      link: '/dashboard/partner-accounts',
      hidden: !hasPermission('view_financials'),
    },
  ].filter(s => !s.hidden);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  const totalDocs = documentSections.reduce((sum, s) => sum + s.items.length, 0);

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {documentSections.map((section, i) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card className="border-border/30 hover:border-primary/20 transition-colors cursor-pointer" onClick={() => navigate(section.link)}>
                <CardContent className="p-3 text-center">
                  <div className={`w-10 h-10 rounded-xl ${section.bg} flex items-center justify-center mx-auto mb-2`}>
                    <Icon className={`w-5 h-5 ${section.color}`} />
                  </div>
                  <p className="text-xl font-bold">{section.items.length}</p>
                  <p className="text-[10px] text-muted-foreground">{section.title}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Document Sections */}
      {documentSections.map((section, si) => {
        const Icon = section.icon;
        return (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: si * 0.08 }}
          >
            <Card className="border-border/30">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm">
                    <Icon className={`w-4 h-4 ${section.color}`} />
                    {section.title}
                    <Badge variant="secondary" className="text-[10px]">{section.items.length}</Badge>
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1 text-xs h-7"
                    onClick={() => navigate(section.link)}
                  >
                    عرض الكل <ExternalLink className="w-3 h-3" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {section.items.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">{section.emptyText}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {section.items.slice(0, 5).map((item, i) => {
                      const fType = item.url ? getFileType(item.url) : 'default';
                      const fConfig = fileTypeConfig[fType] || fileTypeConfig.default;
                      const FIcon = fConfig.icon;
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="flex items-center gap-3 p-3 rounded-xl border border-border/20 hover:bg-muted/30 transition-colors"
                        >
                          <div className={`w-9 h-9 rounded-lg ${fConfig.bg} flex items-center justify-center shrink-0`}>
                            <FIcon className={`w-4 h-4 ${fConfig.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{item.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {item.subtitle && (
                                <span className="text-[10px] text-muted-foreground">{item.subtitle}</span>
                              )}
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {new Date(item.date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                          {item.status && (
                            <Badge variant="outline" className="text-[9px] shrink-0">{item.status}</Badge>
                          )}
                          {item.url && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-7 h-7 shrink-0"
                              onClick={(e) => { e.stopPropagation(); window.open(item.url, '_blank'); }}
                            >
                              <Download className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default MyDocumentsTab;
