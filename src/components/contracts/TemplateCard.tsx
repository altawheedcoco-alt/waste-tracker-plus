import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Building2, 
  Recycle,
  Trash2,
  Edit,
  Eye,
  Copy,
  FileSignature,
  Stamp,
  Image as ImageIcon,
  Users,
  Printer,
  FileDown,
  MoreVertical,
  Calendar,
  Hash
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ContractTemplate, partnerTypeLabels, contractCategoryLabels } from '@/hooks/useContractTemplates';

interface TemplateCardProps {
  template: ContractTemplate;
  onView: (template: ContractTemplate) => void;
  onEdit: (template: ContractTemplate) => void;
  onDuplicate: (template: ContractTemplate) => void;
  onDelete: (id: string) => void;
  onPrint?: (template: ContractTemplate) => void;
  onExportPDF?: (template: ContractTemplate) => void;
}

const TemplateCard = ({ 
  template, 
  onView, 
  onEdit, 
  onDuplicate, 
  onDelete,
  onPrint,
  onExportPDF 
}: TemplateCardProps) => {
  const getPartnerIcon = () => {
    switch (template.partner_type) {
      case 'generator':
        return <Building2 className="w-4 h-4" />;
      case 'recycler':
        return <Recycle className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getPartnerColor = () => {
    switch (template.partner_type) {
      case 'generator':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'recycler':
        return 'bg-accent/30 text-accent-foreground border-accent/30';
      default:
        return 'bg-secondary text-secondary-foreground border-secondary';
    }
  };

  const getCategoryColor = () => {
    switch (template.contract_category) {
      case 'collection':
        return 'bg-muted text-muted-foreground';
      case 'transport':
        return 'bg-secondary text-secondary-foreground';
      case 'collection_transport':
        return 'bg-primary/10 text-primary';
      case 'recycling':
        return 'bg-accent/30 text-accent-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group hover:shadow-lg hover:border-primary/30 transition-all duration-300 overflow-hidden">
        {/* Color Strip */}
        <div className={`h-1.5 ${template.partner_type === 'generator' ? 'bg-primary' : template.partner_type === 'recycler' ? 'bg-primary/70' : 'bg-secondary'}`} />
        
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`p-3 rounded-xl shrink-0 ${getPartnerColor()} border`}>
              {getPartnerIcon()}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Badges Row */}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge 
                  variant={template.template_type === 'system' ? 'secondary' : 'default'}
                  className="text-xs"
                >
                  {template.template_type === 'system' ? 'نظام' : 'مخصص'}
                </Badge>
                <Badge variant="outline" className={`text-xs ${getCategoryColor()}`}>
                  {contractCategoryLabels[template.contract_category]}
                </Badge>
              </div>

              {/* Title */}
              <h3 className="font-bold text-base truncate group-hover:text-primary transition-colors">
                {template.name}
              </h3>
              
              {/* Description */}
              {template.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1.5">
                  {template.description}
                </p>
              )}

              {/* Meta Row */}
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${getPartnerColor()}`}>
                  {getPartnerIcon()}
                  {partnerTypeLabels[template.partner_type]}
                </span>
                
                <div className="flex items-center gap-3">
                  {template.include_stamp && (
                    <span className="flex items-center gap-1 text-primary">
                      <Stamp className="w-3.5 h-3.5" />
                    </span>
                  )}
                  {template.include_signature && (
                    <span className="flex items-center gap-1 text-primary">
                      <FileSignature className="w-3.5 h-3.5" />
                    </span>
                  )}
                  {template.include_header_logo && (
                    <span className="flex items-center gap-1 text-primary">
                      <ImageIcon className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  استخدام: {template.usage_count}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(template.updated_at).toLocaleDateString('ar-EG')}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-1 shrink-0">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8"
                onClick={() => onView(template)}
              >
                <Eye className="w-4 h-4" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onView(template)} className="gap-2">
                    <Eye className="w-4 h-4" />
                    عرض القالب
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate(template)} className="gap-2">
                    <Copy className="w-4 h-4" />
                    نسخ القالب
                  </DropdownMenuItem>
                  
                  {onPrint && (
                    <DropdownMenuItem onClick={() => onPrint(template)} className="gap-2">
                      <Printer className="w-4 h-4" />
                      طباعة
                    </DropdownMenuItem>
                  )}
                  {onExportPDF && (
                    <DropdownMenuItem onClick={() => onExportPDF(template)} className="gap-2">
                      <FileDown className="w-4 h-4" />
                      حفظ PDF
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onEdit(template)} className="gap-2">
                    <Edit className="w-4 h-4" />
                    تعديل
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete(template.id)} 
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TemplateCard;
