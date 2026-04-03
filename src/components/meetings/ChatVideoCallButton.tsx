import { useState } from 'react';
import { Video, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGlobalCallSafe } from '@/providers/GlobalCallProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChatVideoCallButtonProps {
  partnerName: string;
  partnerUserId?: string;
  partnerOrgId?: string;
  partnerLogo?: string | null;
}

const ChatVideoCallButton = ({ partnerName, partnerUserId, partnerOrgId, partnerLogo }: ChatVideoCallButtonProps) => {
  const callCtx = useGlobalCallSafe();
  const [starting, setStarting] = useState(false);

  if (!callCtx) return null; // Not inside GlobalCallProvider — hide buttons

  const { startCall } = callCtx;

  const resolvePartnerOrgId = async () => {
    if (partnerOrgId) return partnerOrgId;
    if (!partnerUserId) return null;

    const { data: byUserId } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', partnerUserId)
      .maybeSingle();

    if (byUserId?.organization_id) return byUserId.organization_id;

    const { data: byProfileId } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', partnerUserId)
      .maybeSingle();

    return byProfileId?.organization_id || null;
  };

  const handleCall = async (type: 'voice' | 'video') => {
    setStarting(true);
    try {
      const resolvedOrgId = await resolvePartnerOrgId();
      if (!resolvedOrgId) {
        toast.error('لا يمكن تحديد الطرف الآخر');
        return;
      }

      await startCall(resolvedOrgId, type, partnerName, partnerLogo, partnerUserId);
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
