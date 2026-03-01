import ReactMarkdown from 'react-markdown';
import { Calendar, User } from 'lucide-react';

interface SharedBlogViewProps {
  data: any;
}

const SharedBlogView = ({ data }: SharedBlogViewProps) => {
  return (
    <article className="space-y-6" dir="rtl">
      {/* Header */}
      {data.cover_image_url && (
        <img
          src={data.cover_image_url}
          alt={data.title_ar || data.title}
          className="w-full h-64 object-cover rounded-xl"
        />
      )}

      <div className="space-y-3">
        <h1 className="text-3xl font-bold leading-tight">{data.title_ar || data.title}</h1>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {data.author_name && (
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {data.author_name}
            </span>
          )}
          {data.published_at && (
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(data.published_at).toLocaleDateString('ar-EG')}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown>
          {data.content_ar || data.content || ''}
        </ReactMarkdown>
      </div>
    </article>
  );
};

export default SharedBlogView;
