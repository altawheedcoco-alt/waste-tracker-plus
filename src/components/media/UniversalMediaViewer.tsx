import { useState } from 'react';
import { detectMediaType, type MediaType } from '@/lib/mediaUtils';
import ImageLightbox from '@/components/chat/ImageLightbox';
import VideoTheater from './VideoTheater';
import StandaloneAudioPlayer from './StandaloneAudioPlayer';
import GoogleDocsPdfViewer from '@/components/shared/GoogleDocsPdfViewer';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface UniversalMediaViewerProps {
  url: string;
  urls?: string[]; // gallery for images
  isOpen: boolean;
  onClose: () => void;
  mimeType?: string | null;
  title?: string;
}

const UniversalMediaViewer = ({ url, urls, isOpen, onClose, mimeType, title }: UniversalMediaViewerProps) => {
  const type = detectMediaType(url, mimeType);

  if (!isOpen) return null;

  if (type === 'image') {
    const images = urls?.filter(Boolean) || [url];
    const idx = images.indexOf(url);
    return (
      <ImageLightbox
        images={images}
        initialIndex={idx >= 0 ? idx : 0}
        isOpen={isOpen}
        onClose={onClose}
      />
    );
  }

  if (type === 'video') {
    return <VideoTheater url={url} isOpen={isOpen} onClose={onClose} title={title} />;
  }

  if (type === 'audio') {
    return (
      <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-md">
          <DialogTitle className="text-base font-semibold">{title || 'تسجيل صوتي'}</DialogTitle>
          <StandaloneAudioPlayer url={url} title={title} />
        </DialogContent>
      </Dialog>
    );
  }

  if (type === 'pdf') {
    return (
      <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogTitle className="sr-only">{title || 'مستند PDF'}</DialogTitle>
          <GoogleDocsPdfViewer url={url} title={title} height="75vh" showFooter />
        </DialogContent>
      </Dialog>
    );
  }

  return null;
};

export default UniversalMediaViewer;
