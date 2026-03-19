import { useState } from 'react';
import ImageLightbox from '@/components/chat/ImageLightbox';

interface ClickableImageProps {
  src: string;
  alt?: string;
  className?: string;
  gallery?: string[];
  children?: React.ReactNode;
  /** When true, disables download/save/drag and renders via Canvas */
  protected?: boolean;
}

const ClickableImage = ({ src, alt = '', className, gallery, children, protected: isProtected = false }: ClickableImageProps) => {
  const [open, setOpen] = useState(false);

  if (!src) return children ? <>{children}</> : null;

  const images = gallery?.filter(Boolean) || [src];
  const initialIndex = images.indexOf(src);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="cursor-pointer focus:outline-none"
        onContextMenu={isProtected ? (e) => e.preventDefault() : undefined}
      >
        {children || (
          <img 
            src={src} 
            alt={alt} 
            className={className} 
            draggable={!isProtected}
            style={isProtected ? { userSelect: 'none', WebkitUserSelect: 'none' } as React.CSSProperties : undefined}
          />
        )}
      </button>

      <ImageLightbox
        images={images}
        initialIndex={initialIndex >= 0 ? initialIndex : 0}
        isOpen={open}
        onClose={() => setOpen(false)}
        protected={isProtected}
      />
    </>
  );
};

export default ClickableImage;
