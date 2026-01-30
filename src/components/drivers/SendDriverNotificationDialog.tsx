import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Bell, AlertTriangle, Info, MessageCircle, Loader2 } from 'lucide-react';

interface Driver {
  id: string;
  profile: {
    full_name: string;
    avatar_url: string | null;
    user_id?: string;
  } | null;
  organization: {
    name: string;
  } | null;
}

interface SendDriverNotificationDialogProps {
  driver: Driver | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const notificationTypes = [
  { value: 'info', label: 'معلومات', icon: Info, color: 'text-blue-500' },
  { value: 'warning', label: 'تنبيه', icon: AlertTriangle, color: 'text-amber-500' },
  { value: 'urgent', label: 'عاجل', icon: Bell, color: 'text-destructive' },
  { value: 'message', label: 'رسالة', icon: MessageCircle, color: 'text-primary' },
];

const SendDriverNotificationDialog = ({
  driver,
  open,
  onOpenChange,
}: SendDriverNotificationDialogProps) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [sending, setSending] = useState(false);
  const { organization } = useAuth();
  const { toast } = useToast();

  const handleSend = async () => {
    if (!driver || !title.trim() || !message.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);

    try {
      // First get the driver's user_id from their profile
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('profile:profiles!drivers_profile_id_fkey(user_id)')
        .eq('id', driver.id)
        .single();

      if (driverError || !driverData?.profile?.user_id) {
        throw new Error('لم يتم العثور على بيانات السائق');
      }

      const driverUserId = driverData.profile.user_id;

      // Build notification title with type indicator
      let notificationTitle = title;
      if (type === 'urgent') {
        notificationTitle = '🚨 ' + title;
      } else if (type === 'warning') {
        notificationTitle = '⚠️ ' + title;
      } else if (type === 'info') {
        notificationTitle = 'ℹ️ ' + title;
      }

      // Add sender info to message
      const fullMessage = organization 
        ? `${message}\n\n— من: ${organization.name}`
        : message;

      // Insert notification
      const { error } = await supabase.from('notifications').insert({
        user_id: driverUserId,
        title: notificationTitle,
        message: fullMessage,
        type: 'partner_message',
      });

      if (error) throw error;

      toast({
        title: 'تم الإرسال',
        description: `تم إرسال الإشعار إلى ${driver.profile?.full_name}`,
      });

      // Reset form and close
      setTitle('');
      setMessage('');
      setType('info');
      onOpenChange(false);
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إرسال الإشعار',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const selectedType = notificationTypes.find(t => t.value === type);
  const TypeIcon = selectedType?.icon || Info;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 justify-end">
            <span>إرسال إشعار للسائق</span>
            <Send className="w-5 h-5 text-primary" />
          </DialogTitle>
        </DialogHeader>

        {driver && (
          <div className="space-y-4">
            {/* Driver Info */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 justify-end">
              <div className="text-right">
                <p className="font-medium">{driver.profile?.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {driver.organization?.name}
                </p>
              </div>
              <Avatar className="h-12 w-12">
                <AvatarImage src={driver.profile?.avatar_url || undefined} />
                <AvatarFallback>
                  {driver.profile?.full_name?.charAt(0) || 'S'}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Notification Type */}
            <div className="space-y-2">
              <Label className="text-right block">نوع الإشعار</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="text-right">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {notificationTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <div className="flex items-center gap-2">
                        <t.icon className={`w-4 h-4 ${t.color}`} />
                        <span>{t.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label className="text-right block">عنوان الإشعار *</Label>
              <div className="relative">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="أدخل عنوان الإشعار..."
                  className="text-right pr-10"
                  maxLength={100}
                />
                <TypeIcon className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${selectedType?.color}`} />
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label className="text-right block">نص الرسالة *</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="اكتب رسالتك للسائق..."
                className="text-right min-h-[100px] resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-left">
                {message.length}/500
              </p>
            </div>

            {/* Preview */}
            {(title || message) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg border bg-card"
              >
                <p className="text-xs text-muted-foreground mb-1 text-right">معاينة:</p>
                <div className="flex items-start gap-2 justify-end">
                  <div className="text-right">
                    <p className="font-medium text-sm">
                      {type === 'urgent' && '🚨 '}
                      {type === 'warning' && '⚠️ '}
                      {type === 'info' && 'ℹ️ '}
                      {title || 'عنوان الإشعار'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {message || 'نص الرسالة...'}
                    </p>
                  </div>
                  <Badge variant={type === 'urgent' ? 'destructive' : 'secondary'} className="shrink-0">
                    {selectedType?.label}
                  </Badge>
                </div>
              </motion.div>
            )}
          </div>
        )}

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={sending || !title.trim() || !message.trim()}
            className="gap-2"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                إرسال الإشعار
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendDriverNotificationDialog;
