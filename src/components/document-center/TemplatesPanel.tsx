/**
 * لوحة القوالب والنماذج
 */
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, FileSignature, FileText, Printer, PenTool, Stamp, Layout } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const TemplatesPanel = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const templateTypes = [
    { icon: FileText, title: t('templatesPanel.contractTemplates'), desc: t('templatesPanel.contractTemplatesDesc'), path: '/dashboard/contract-templates' },
    { icon: FileSignature, title: t('templatesPanel.multiSignTemplates'), desc: t('templatesPanel.multiSignTemplatesDesc'), path: '/dashboard/multi-sign-templates' },
    { icon: Printer, title: t('templatesPanel.printTemplates'), desc: t('templatesPanel.printTemplatesDesc'), path: '/dashboard/stationery' },
    { icon: Layout, title: t('templatesPanel.printPlans'), desc: t('templatesPanel.printPlansDesc'), path: '/dashboard/stationery-plans' },
    { icon: PenTool, title: t('templatesPanel.autoSignSettings'), desc: t('templatesPanel.autoSignSettingsDesc'), path: '/dashboard/signing-status' },
    { icon: Stamp, title: t('templatesPanel.docStamping'), desc: t('templatesPanel.docStampingDesc'), path: '/dashboard/admin-document-stamping' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templateTypes.map((tmpl) => {
        const Icon = tmpl.icon;
        return (
          <Card key={tmpl.path} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(tmpl.path)}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{tmpl.title}</p>
                <p className="text-xs text-muted-foreground">{tmpl.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default TemplatesPanel;