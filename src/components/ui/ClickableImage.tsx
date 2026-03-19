import { useState } from 'react';
import ImageLightbox from '@/components/chat/ImageLightbox';

interface ClickableImageProps {
  src: string;
  alt?: string;
  className?: string;
  gallery?: string[];
  children?: React.ReactNode;
}

/**
 * Wraps any image (or children) with click-to-lightbox functionality.
 * Pass `gallery` for swipe navigation between multiple images.
 * If no children, renders an <img> with the given src/alt/className.
 */
const ClickableImage = ({ src, alt = '', className, gallery, children }: ClickableImageProps) => {
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
      >
        {children || (
          <img src={src} alt={alt} className={className} />
        )}
      </button>

      <ImageLightbox
        images={images}
        initialIndex={initialIndex >= 0 ? initialIndex : 0}
        isOpen={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
};

export default ClickableImage;
