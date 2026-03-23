import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, RefreshCw, BadgeCheck, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import PostInteractions from '@/components/organization/PostInteractions';
import { getOrganizationTypeLabel } from '@/lib/shipmentStatusConfig';
import { fetchLinkedPartnerIds } from '@/hooks/useLinkedPartnerIds';

const PartnersTimelineEmbed = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string>('all');

  const { data: partnerIds = [] } = useQuery({
    queryKey: ['partner-ids', organization?.id],
    queryFn: () => fetchLinkedPartnerIds(organization!.id),
    enabled: !!organization?.id,
  });

  const { data: posts = [], isLoading, refetch } = useQuery({
    queryKey: ['partners-timeline-embed', partnerIds, organization?.id, selectedType],
    queryFn: async () => {
      if (!organization?.id) return [];
      const allIds = [...partnerIds, organization.id];
      if (allIds.length === 0) return [];

      let query = supabase
        .from('organization_posts')
        .select('*, organization:organizations(id, name, logo_url, organization_type, is_verified)')
        .in('organization_id', allIds)
        .order('created_at', { ascending: false })
        .limit(20);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id && partnerIds.length > 0,
  });

  if (isLoading) {
    return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>;
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Building2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">لا توجد منشورات من الشركاء حالياً</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{posts.length} منشور</span>
        <Button variant="ghost" size="sm" onClick={() => refetch()} className="h-7 text-xs gap-1">
          <RefreshCw className="h-3 w-3" /> تحديث
        </Button>
      </div>
      {posts.map((post: any) => (
        <Card key={post.id} className="border-border/40">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={post.organization?.logo_url} />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {post.organization?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium truncate">{post.organization?.name}</span>
                  {post.organization?.is_verified && <BadgeCheck className="h-3 w-3 text-primary flex-shrink-0" />}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-2.5 w-2.5" />
                  {formatDistanceToNow(new Date(post.created_at), { locale: ar, addSuffix: true })}
                </div>
              </div>
              <Badge variant="outline" className="text-[9px] h-5">
                {getOrganizationTypeLabel(post.organization?.organization_type)}
              </Badge>
            </div>
            {post.content && <p className="text-xs text-foreground leading-relaxed line-clamp-3">{post.content}</p>}
            {post.media_urls?.length > 0 && (
              <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
                {post.media_urls.slice(0, 4).map((url: string, i: number) => (
                  <img key={i} src={url} alt="" className="w-full h-24 object-cover rounded" loading="lazy" />
                ))}
              </div>
            )}
            <PostInteractions postId={post.id} likesCount={post.likes_count || 0} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PartnersTimelineEmbed;
