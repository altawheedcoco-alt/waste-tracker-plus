import { useState } from 'react';
import { useApprovalRequests } from '@/hooks/useApprovalRequests';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Send, Loader2 } from 'lucide-react';

interface CreateRequestButtonProps {
  defaultType?: string;
  defaultTitle?: string;
  defaultDescription?: string;
  buttonText?: string;
  buttonVariant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
}

const REQUEST_TYPES = [
  { value: 'waste_register', label: 'طلب سجل نفايات' },
  { value: 'document_upload', label: 'طلب رفع وثيقة' },
  { value: 'profile_update', label: 'طلب تحديث بيانات' },
  { value: 'data_change', label: 'طلب تغيير بيانات' },
  { value: 'shipment_create', label: 'طلب إنشاء شحنة' },
  { value: 'technical_support', label: 'دعم فني' },
  { value: 'inquiry', label: 'استفسار' },
  { value: 'complaint', label: 'شكوى' },
  { value: 'suggestion', label: 'اقتراح' },
  { value: 'general', label: 'طلب عام' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'منخفضة' },
  { value: 'normal', label: 'عادية' },
  { value: 'high', label: 'عالية' },
  { value: 'urgent', label: 'عاجلة' },
];

const CreateRequestButton = ({
  defaultType = 'general',
  defaultTitle = '',
  defaultDescription = '',
  buttonText = 'إرسال طلب للإدارة',
  buttonVariant = 'outline',
  buttonSize = 'default',
  className = '',
  children,
}: CreateRequestButtonProps) => {
  const { createRequest } = useApprovalRequests();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requestType, setRequestType] = useState(defaultType);
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');

  const handleSubmit = async () => {
    if (!title.trim()) return;

    setLoading(true);
    const result = await createRequest({
      request_type: requestType,
      request_title: title,
      request_description: description || undefined,
      priority,
    });

    setLoading(false);

    if (result.success) {
      setOpen(false);
      setTitle(defaultTitle);
      setDescription(defaultDescription);
      setPriority('normal');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant={buttonVariant} size={buttonSize} className={className}>
            <Send className="h-4 w-4 ml-2" />
            {buttonText}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>إرسال طلب للإدارة</DialogTitle>
          <DialogDescription>
            سيتم إرسال طلبك لمدير النظام للمراجعة والموافقة
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>نوع الطلب</Label>
            <Select value={requestType} onValueChange={setRequestType}>
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع الطلب" />
              </SelectTrigger>
              <SelectContent>
                {REQUEST_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>عنوان الطلب *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="أدخل عنوان واضح للطلب"
              className="text-right"
            />
          </div>

          <div className="space-y-2">
            <Label>تفاصيل الطلب</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اشرح تفاصيل طلبك بوضوح..."
              rows={4}
              className="text-right"
            />
          </div>

          <div className="space-y-2">
            <Label>الأولوية</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !title.trim()}>
            {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            إرسال الطلب
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRequestButton;
