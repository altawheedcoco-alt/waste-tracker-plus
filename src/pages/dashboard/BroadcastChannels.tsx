import BroadcastChannelView from '@/components/chat/BroadcastChannelView';
import { useNavigate } from 'react-router-dom';

export default function BroadcastChannels() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <BroadcastChannelView onBack={() => navigate('/dashboard')} />
    </div>
  );
}
