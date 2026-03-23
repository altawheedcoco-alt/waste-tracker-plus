import { useState } from 'react';
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

  const { data: partnerIds = [] } = useQuery({
    queryKey: ['partner-ids', organization?.id],
    queryFn: () => fetchLinkedPartnerIds(organization!.id),
    enabled: !!organization?.id,
  });

  const { data: posts = [], isLoading, refetch } = useQuery({
    queryKey: ['partners-timeline-embed', partnerIds, organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const allIds = [...partnerIds, organization.id];
      if (allIds.length === 0) return [];

      const { data: postsData, error } = await supabase
        .from('organization_posts')
        .select('*')
        .in('organization_id', allIds)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Fetch orgs
      const { data: orgsData } = await supabase
        .from('organizations')
        .select('id, name, logo_url, organization_type, is_verified')
        .in('id', allIds);
      const orgsMap = new Map(orgsData?.map(org => [org.id, org]) || []);

      // Fetch author profiles (exclude drivers)
      const authorIds = [...new Set((postsData || []).map(p => p.author_id).filter(Boolean))];
      let authorsMap = new Map<string, { id: string; full_name: string | null; avatar_url: string | null }>();
      
      if (authorIds.length > 0) {
        const { data: driverRoles } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'driver')
          .in('user_id', authorIds);
        
        const driverIds = new Set((driverRoles || []).map(r => r.user_id));
        const nonDriverIds = authorIds.filter(id => !driverIds.has(id));

        if (nonDriverIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', nonDriverIds);
          authorsMap = new Map((profilesData || []).map(p => [p.id, p]));
        }
      }

      return (postsData || []).map(post => ({
        ...post,
        media_urls: post.media_urls as string[] | null,
        organization: orgsMap.get(post.organization_id),
        author: post.author_id ? authorsMap.get(post.author_id) || null : null,
      }));
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
                <AvatarImage src={post.author?.avatar_url || post.organization?.logo_url} />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {(post.author?.full_name || post.organization?.name)?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 flex-wrap">
                  {post.author?.full_name && (
                    <span className="text-xs font-medium">{post.author.full_name}</span>
                  )}
                  <span className={`text-xs ${post.author?.full_name ? 'text-muted-foreground' : 'font-medium'} truncate`}>
                    {post.author?.full_name ? `· ${post.organization?.name}` : post.organization?.name}
                  </span>
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
