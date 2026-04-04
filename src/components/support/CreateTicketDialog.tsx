import { useState } from 'react';
import { useSupportTickets, TicketCategory, TicketPriority } from '@/hooks/useSupportTickets';
import { usePartners } from '@/hooks/usePartners';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bug,
  Lightbulb,
  AlertTriangle,
  Banknote,
  HelpCircle,
  MessageSquare,
  Star,
  Loader2,
} from 'lucide-react';

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const categoryOptions: { value: TicketCategory; label: string; icon: React.ElementType }[] = [
  { value: 'bug', label: 'خطأ تقني', icon: Bug },
  { value: 'feature_request', label: 'طلب ميزة جديدة', icon: Lightbulb },
  { value: 'technical_issue', label: 'مشكلة تقنية', icon: AlertTriangle },
  { value: 'billing', label: 'فواتير ومدفوعات', icon: Banknote },
  { value: 'general', label: 'استفسار عام', icon: HelpCircle },
  { value: 'complaint', label: 'شكوى', icon: MessageSquare },
  { value: 'suggestion', label: 'اقتراح', icon: Star },
];

const priorityOptions: { value: TicketPriority; label: string; color: string }[] = [
  { value: 'low', label: 'منخفضة', color: 'text-muted-foreground' },
  { value: 'medium', label: 'متوسطة', color: 'text-blue-500' },
  { value: 'high', label: 'عالية', color: 'text-orange-500' },
  { value: 'urgent', label: 'عاجلة', color: 'text-red-500' },
];

const CreateTicketDialog = ({ open, onOpenChange, onSuccess }: CreateTicketDialogProps) => {
  const { createTicket } = useSupportTickets();
  const { partners } = usePartners();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general' as TicketCategory,
    priority: 'medium' as TicketPriority,
    partner_organization_id: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createTicket.mutateAsync({
      title: formData.title,
      description: formData.description,
      category: formData.category,
      priority: formData.priority,
      partner_organization_id: formData.partner_organization_id || undefined,
    });

    setFormData({
      title: '',
      description: '',
      category: 'general',
      priority: 'medium',
      partner_organization_id: '',
    });
    
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>إنشاء تذكرة دعم جديدة</DialogTitle>
          <DialogDescription>
            أخبرنا عن مشكلتك وسنقوم بالرد عليك في أقرب وقت
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">عنوان المشكلة *</Label>
            <Input
              id="title"
              placeholder="اكتب عنواناً واضحاً للمشكلة"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>نوع المشكلة *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as TicketCategory }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="w-4 h-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الأولوية *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as TicketPriority }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className={option.color}>{option.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {partners && partners.length > 0 && (
            <div className="space-y-2">
              <Label>شريك ذو علاقة (اختياري)</Label>
              <Select
                value={formData.partner_organization_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, partner_organization_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الشريك إن كان له علاقة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">بدون شريك</SelectItem>
                  {partners.map((partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">وصف المشكلة *</Label>
            <Textarea
              id="description"
              placeholder="اشرح المشكلة بالتفصيل... متى حدثت؟ ما الخطوات التي أدت إليها؟"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={5}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              إلغاء
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={createTicket.isPending || !formData.title || !formData.description}
            >
              {createTicket.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                'إرسال التذكرة'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTicketDialog;
