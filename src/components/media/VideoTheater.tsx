import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DialogTitle } from '@radix-ui/react-dialog';
import AdaptiveVideoPlayer from './AdaptiveVideoPlayer';

interface VideoTheaterProps {
  url: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

const VideoTheater = ({ url, isOpen, onClose, title }: VideoTheaterProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] p-0 bg-black border-none overflow-hidden">
        <DialogTitle className="sr-only">{title || 'مشغل الفيديو'}</DialogTitle>
        <AdaptiveVideoPlayer
          url={url}
          title={title}
          preloadStrategy="auto"
          showNetworkIndicator
        />
      </DialogContent>
    </Dialog>
  );
};

export default VideoTheater;
