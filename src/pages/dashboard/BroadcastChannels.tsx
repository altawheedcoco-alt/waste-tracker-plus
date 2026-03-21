import BroadcastChannelView from '@/components/chat/BroadcastChannelView';
import { useNavigate } from 'react-router-dom';

export default function BroadcastChannels() {
  const navigate = useNavigate();
  return (
    <div className="h-[calc(100vh-4rem)] bg-background overflow-hidden">
      <BroadcastChannelView onBack={() => navigate('/dashboard')} />
    </div>
  );
}
