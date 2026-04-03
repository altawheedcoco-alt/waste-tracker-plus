import { useState } from 'react';
import { Video, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGlobalCall } from '@/providers/GlobalCallProvider';
import { toast } from 'sonner';

interface ChatVideoCallButtonProps {
  partnerName: string;
  partnerUserId?: string;
  partnerOrgId?: string;
  partnerLogo?: string | null;
}

const ChatVideoCallButton = ({ partnerName, partnerUserId, partnerOrgId, partnerLogo }: ChatVideoCallButtonProps) => {
  const { startCall } = useGlobalCall();
  const [starting, setStarting] = useState(false);

  const handleCall = async (type: 'voice' | 'video') => {
    if (!partnerOrgId) {
      toast.error('لا يمكن تحديد الطرف الآخر');
      return;
    }
    setStarting(true);
    try {
      await startCall(partnerOrgId, type, partnerName, partnerLogo, partnerUserId);
    } catch (err: any) {
      toast.error(err.message || 'فشل بدء المكالمة');
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleCall('voice')}
        disabled={starting}
        className="h-8 w-8 p-0 text-muted-foreground hover:text-emerald-600"
        title="مكالمة صوتية"
      >
        <Phone className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleCall('video')}
        disabled={starting}
        className="h-8 w-8 p-0 text-muted-foreground hover:text-emerald-600"
        title="مكالمة فيديو"
      >
        <Video className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default ChatVideoCallButton;
