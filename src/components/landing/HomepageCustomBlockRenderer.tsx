import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface CustomBlock {
  id: string;
  block_type: string;
  title: string;
  title_en?: string | null;
  content?: string | null;
  content_en?: string | null;
  media_url?: string | null;
  link_url?: string | null;
  link_text?: string | null;
  background_color?: string | null;
  text_color?: string | null;
}

interface Props {
  block: CustomBlock;
}

const HomepageCustomBlockRenderer = memo(({ block }: Props) => {
  const bgStyle = block.background_color ? { backgroundColor: block.background_color } : {};
  const textStyle = block.text_color ? { color: block.text_color } : {};

  switch (block.block_type) {
    case 'banner':
    case 'promo':
      return (
        <section className="py-6 px-4" style={bgStyle}>
          <div className="container mx-auto max-w-5xl">
            <div className="rounded-2xl overflow-hidden shadow-lg relative">
              {block.media_url && (
                <img
                  src={block.media_url}
                  alt={block.title}
                  className="w-full h-48 sm:h-64 object-cover"
                  loading="lazy"
                />
              )}
              <div className={`${block.media_url ? 'absolute inset-0 bg-black/40 flex items-center justify-center' : 'p-8 text-center'}`}>
                <div className="text-center p-4" style={textStyle}>
                  <h3 className={`text-xl sm:text-2xl font-bold ${block.media_url ? 'text-white' : ''}`}>
                    {block.title}
                  </h3>
                  {block.content && (
                    <p className={`mt-2 text-sm sm:text-base ${block.media_url ? 'text-white/90' : 'text-muted-foreground'}`}>
                      {block.content}
                    </p>
                  )}
                  {block.link_url && (
                    <Button
                      className="mt-4 gap-2"
                      onClick={() => window.open(block.link_url!, '_blank')}
                    >
                      {block.link_text || 'اعرف المزيد'}
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      );

    case 'announcement':
      return (
        <section className="py-4 px-4" style={bgStyle}>
          <div className="container mx-auto max-w-5xl">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center" style={textStyle}>
              <p className="font-semibold">{block.title}</p>
              {block.content && <p className="text-sm text-muted-foreground mt-1">{block.content}</p>}
              {block.link_url && (
                <a href={block.link_url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm underline mt-2 inline-block">
                  {block.link_text || 'التفاصيل'}
                </a>
              )}
            </div>
          </div>
        </section>
      );

    case 'image':
      return (
        <section className="py-6 px-4">
          <div className="container mx-auto max-w-5xl">
            {block.media_url && (
              <img
                src={block.media_url}
                alt={block.title}
                className="w-full rounded-2xl shadow-lg"
                loading="lazy"
              />
            )}
          </div>
        </section>
      );

    case 'video':
      return (
        <section className="py-6 px-4">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold">{block.title}</h3>
            </div>
            {block.media_url && (
              <div className="aspect-video rounded-2xl overflow-hidden shadow-lg">
                <iframe
                  src={block.media_url}
                  className="w-full h-full"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </section>
      );

    case 'html':
      return (
        <section className="py-6 px-4" style={bgStyle}>
          <div className="container mx-auto max-w-5xl" style={textStyle}>
            {block.content && (
              <div dangerouslySetInnerHTML={{ __html: block.content }} className="prose max-w-none" />
            )}
          </div>
        </section>
      );

    case 'partner_logo':
      return (
        <section className="py-4 px-4">
          <div className="container mx-auto max-w-5xl flex items-center justify-center">
            {block.media_url && (
              <a href={block.link_url || '#'} target="_blank" rel="noopener noreferrer">
                <img
                  src={block.media_url}
                  alt={block.title}
                  className="h-16 sm:h-20 object-contain opacity-80 hover:opacity-100 transition-opacity"
                  loading="lazy"
                />
              </a>
            )}
          </div>
        </section>
      );

    case 'external_link':
      return (
        <section className="py-4 px-4" style={bgStyle}>
          <div className="container mx-auto max-w-5xl text-center" style={textStyle}>
            <h3 className="text-lg font-bold mb-2">{block.title}</h3>
            {block.content && <p className="text-sm text-muted-foreground mb-3">{block.content}</p>}
            {block.link_url && (
              <Button variant="outline" className="gap-2" onClick={() => window.open(block.link_url!, '_blank')}>
                <ExternalLink className="h-4 w-4" />
                {block.link_text || 'زيارة الرابط'}
              </Button>
            )}
          </div>
        </section>
      );

    default:
      return null;
  }
});

HomepageCustomBlockRenderer.displayName = 'HomepageCustomBlockRenderer';
export default HomepageCustomBlockRenderer;
