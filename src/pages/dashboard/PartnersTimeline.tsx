import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building2, 
  ImageIcon, 
  Video, 
  FileText, 
  Images,
  RefreshCw,
  BadgeCheck,
  Clock,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PostInteractions from '@/components/organization/PostInteractions';
import { getOrganizationTypeLabel } from '@/lib/shipmentStatusConfig';

interface Post {
  id: string;
  content: string | null;
  media_urls: string[] | null;
  post_type: string;
  is_pinned: boolean;
  likes_count: number;
  created_at: string;
  organization_id: string;
  author_id: string | null;
  organization?: {
    id: string;
    name: string;
    logo_url: string | null;
    organization_type: string;
    is_verified: boolean;
  };
  author?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

const PartnersTimeline = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string>('all');
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  const handleVideoPlay = (postId: string, videoElement: HTMLVideoElement) => {
    if (activeVideoId && activeVideoId !== postId) {
      const previousVideo = videoRefs.current.get(activeVideoId);
      if (previousVideo) {
        previousVideo.pause();
      }
    }
    setActiveVideoId(postId);
  };

  // Get partner organization IDs
  const { data: partnerIds = [] } = useQuery({
    queryKey: ['partner-ids', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data: shipments } = await supabase
        .from('shipments')
        .select('generator_id, transporter_id, recycler_id')
        .or(`generator_id.eq.${organization.id},transporter_id.eq.${organization.id},recycler_id.eq.${organization.id}`);

      if (!shipments) return [];

      const ids = new Set<string>();
      shipments.forEach(s => {
        if (s.generator_id && s.generator_id !== organization.id) ids.add(s.generator_id);
        if (s.transporter_id && s.transporter_id !== organization.id) ids.add(s.transporter_id);
        if (s.recycler_id && s.recycler_id !== organization.id) ids.add(s.recycler_id);
      });

      return Array.from(ids);
    },
    enabled: !!organization?.id,
  });

  // Fetch posts from partners AND current organization
  const { data: posts = [], isLoading, refetch } = useQuery({
    queryKey: ['partners-timeline', partnerIds, organization?.id, selectedType],
    queryFn: async () => {
      if (!organization?.id) return [];

      // Include both partner IDs and current organization ID
      const allOrgIds = [...partnerIds, organization.id];

      let query = supabase
        .from('organization_posts')
        .select('*')
        .in('organization_id', allOrgIds)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (selectedType !== 'all') {
        query = query.eq('post_type', selectedType);
      }

      const { data: postsData, error } = await query;
      if (error) throw error;

      // Fetch organizations data
      const { data: orgsData } = await supabase
        .from('organizations')
        .select('id, name, logo_url, organization_type, is_verified')
        .in('id', allOrgIds);

      const orgsMap = new Map(orgsData?.map(org => [org.id, org]) || []);

      // Fetch author profiles (exclude drivers)
      const authorIds = [...new Set((postsData || []).map(p => p.author_id).filter(Boolean))];
      let authorsMap = new Map<string, { id: string; full_name: string | null; avatar_url: string | null }>();
      
      if (authorIds.length > 0) {
        // Get driver user IDs to exclude
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
      })) as Post[];
    },
    enabled: !!organization?.id,
  });

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'gallery': return <Images className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  // getOrgTypeLabel now uses centralized utility
  const getOrgTypeLabel = getOrganizationTypeLabel;

  const getOrgTypeColor = (type: string) => {
    switch (type) {
      case 'generator': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'transporter': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
      case 'recycler': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filterTypes = [
    { value: 'all', label: 'الكل' },
    { value: 'text', label: 'نصي' },
    { value: 'image', label: 'صور' },
    { value: 'video', label: 'فيديو' },
    { value: 'gallery', label: 'معرض' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <BackButton />
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">تايم لاين الجهات المرتبطة</h1>
            <p className="text-muted-foreground">آخر منشورات جهاتك المرتبطة في مكان واحد</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 ml-2" />
            تحديث
          </Button>
        </div>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {filterTypes.map((type) => (
            <Button
              key={type.value}
              variant={selectedType === type.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType(type.value)}
            >
              {type.label}
            </Button>
          ))}
        </div>

        {/* Posts Feed */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">لا توجد منشورات</h3>
              <p className="text-muted-foreground">
                لم تنشر أي جهة محتوى بعد. ابدأ بنشر أول منشور من ملف منظمتك.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`${post.is_pinned ? 'border-primary/50 bg-primary/5' : ''} ${post.organization_id === organization?.id ? 'ring-2 ring-primary/30' : ''}`}>
                  <CardContent className="p-4">
                    {/* Post Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div 
                        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => navigate(`/dashboard/organization/${post.organization_id}`)}
                      >
                        <Avatar className="h-12 w-12 ring-2 ring-border">
                          <AvatarImage src={post.organization?.logo_url || ''} />
                          <AvatarFallback className="bg-primary/10">
                            <Building2 className="w-6 h-6 text-primary" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold hover:underline">
                              {post.organization?.name || 'جهة'}
                            </span>
                            {post.organization?.is_verified && (
                              <BadgeCheck className="w-4 h-4 text-primary" />
                            )}
                            {post.organization_id === organization?.id && (
                              <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30">
                                منشورك
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className={`text-[10px] ${getOrgTypeColor(post.organization?.organization_type || '')}`}>
                              {getOrgTypeLabel(post.organization?.organization_type || '')}
                            </Badge>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ar })}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {post.is_pinned && (
                          <Badge variant="secondary" className="text-xs">مثبت</Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {getPostTypeIcon(post.post_type)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => navigate(`/dashboard/organization/${post.organization_id}`)}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Post Content */}
                    {post.content && (
                      <p className="text-foreground whitespace-pre-wrap mb-3 leading-relaxed">
                        {post.content}
                      </p>
                    )}

                    {/* Media */}
                    {post.media_urls && post.media_urls.length > 0 && (
                      <div className={`grid gap-2 ${
                        post.media_urls.length === 1 ? 'grid-cols-1' : 
                        post.media_urls.length === 2 ? 'grid-cols-2' : 
                        'grid-cols-2 md:grid-cols-3'
                      }`}>
                        {post.media_urls.map((url, idx) => (
                          <div key={idx} className="relative rounded-lg overflow-hidden bg-muted aspect-video">
                            {post.post_type === 'video' ? (
                              <video 
                                ref={(el) => {
                                  if (el) videoRefs.current.set(`${post.id}-${idx}`, el);
                                }}
                                src={url} 
                                controls
                                playsInline
                                preload="metadata"
                                className="w-full h-full object-cover"
                                onPlay={(e) => handleVideoPlay(`${post.id}-${idx}`, e.currentTarget)}
                              />
                            ) : (
                              <img 
                                src={url} 
                                alt="" 
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                                onClick={() => window.open(url, '_blank')}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Interactions */}
                    <PostInteractions postId={post.id} likesCount={post.likes_count || 0} />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PartnersTimeline;
