import { useState } from 'react';
import { Play, Volume2, FileText, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { detectMediaType, type MediaType } from '@/lib/mediaUtils';
import UniversalMediaViewer from './UniversalMediaViewer';

interface MediaThumbnailProps {
  url: string;
  urls?: string[]; // gallery for images
  mimeType?: string | null;
  title?: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
  size?: 'sm' | 'md' | 'lg';
}

const OVERLAY_ICONS: Record<MediaType, React.ReactNode> = {
  video: <Play className="w-8 h-8 fill-white text-white drop-shadow-lg" />,
  audio: <Volume2 className="w-6 h-6 text-white drop-shadow-lg" />,
  pdf: <FileText className="w-6 h-6 text-white drop-shadow-lg" />,
  image: <Eye className="w-5 h-5 text-white drop-shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />,
  file: null,
};

const SIZE_CLASSES = {
  sm: 'w-16 h-16',
  md: 'w-32 h-32',
  lg: 'w-full',
};

const MediaThumbnail = ({ url, urls, mimeType, title, className, aspectRatio = 'auto', size = 'md' }: MediaThumbnailProps) => {
  const [viewerOpen, setViewerOpen] = useState(false);
  const type = detectMediaType(url, mimeType);

  if (!url) return null;

  const renderThumbnailContent = () => {
    switch (type) {
      case 'image':
        return <img src={url} alt={title || ''} className="w-full h-full object-cover" loading="lazy" />;
      case 'video':
        return (
          <video src={url} className="w-full h-full object-cover" preload="metadata" muted playsInline>
            <source src={`${url}#t=0.5`} />
          </video>
        );
      case 'audio':
        return (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Volume2 className="w-8 h-8 text-primary/60" />
          </div>
        );
      case 'pdf':
        return (
          <div className="w-full h-full bg-gradient-to-br from-destructive/10 to-destructive/5 flex items-center justify-center">
            <FileText className="w-8 h-8 text-destructive/60" />
          </div>
        );
      default:
        return null;
    }
  };

  const aspectClass = aspectRatio === 'square' ? 'aspect-square' : aspectRatio === 'video' ? 'aspect-video' : '';

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setViewerOpen(true); }}
        className={cn(
          'group relative rounded-lg overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring border border-border/30 hover:border-border/60 transition-all',
          size !== 'lg' && SIZE_CLASSES[size],
          aspectClass,
          className
        )}
      >
        {renderThumbnailContent()}

        {/* Overlay icon */}
        {OVERLAY_ICONS[type] && (
          <div className={cn(
            'absolute inset-0 flex items-center justify-center',
            type !== 'image' && 'bg-black/30'
          )}>
            {OVERLAY_ICONS[type]}
          </div>
        )}
      </button>

      <UniversalMediaViewer
        url={url}
        urls={urls}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        mimeType={mimeType}
        title={title}
      />
    </>
  );
};

export default MediaThumbnail;
