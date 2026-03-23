import { lazy, Suspense, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Newspaper,
  Building2,
  Users,
  Radio,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const OrganizationPosts = lazy(() => import('@/components/organization/OrganizationPosts'));
const BroadcastChannelView = lazy(() => import('@/components/chat/BroadcastChannelView'));

// Lightweight embedded versions for Partners Timeline & Platform Posts
import PartnersTimelineEmbed from './PostsHubPartners';
import PlatformPostsEmbed from './PostsHubPlatform';

const TAB_CONFIG = [
  { value: 'org-posts', label: 'منشورات جهتي', icon: Building2, color: 'text-primary' },
  { value: 'partners', label: 'تايم لاين الشركاء', icon: Users, color: 'text-violet-500' },
  { value: 'broadcast', label: 'قنوات البث', icon: Radio, color: 'text-amber-500' },
  { value: 'platform', label: 'منشورات المنصة', icon: Globe, color: 'text-emerald-500' },
] as const;

const PostsHub = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('org-posts');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-2 pt-3 px-3 sm:px-6">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Newspaper className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <span>مركز المنشورات</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
            <div className="px-2 sm:px-4 overflow-x-auto scrollbar-thin pb-1">
              <TabsList className="inline-flex w-max gap-0.5 h-auto p-1 bg-muted/40 backdrop-blur-sm rounded-xl border border-border/30 flex-row-reverse">
                {TAB_CONFIG.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="gap-1.5 rounded-lg px-2.5 sm:px-3.5 py-2 text-[11px] sm:text-xs whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {/* Organization Posts */}
            <TabsContent value="org-posts" className="mt-0 p-2 sm:p-4">
              <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
                {organization && (
                  <OrganizationPosts
                    organizationId={organization.id}
                    organizationName={organization.name}
                    organizationLogo={organization.logo_url}
                    isOwnOrganization={true}
                  />
                )}
              </Suspense>
              <LinkButton label="فتح في الملف التجاري" onClick={() => navigate('/dashboard/organization-profile?tab=posts')} />
            </TabsContent>

            {/* Partners Timeline */}
            <TabsContent value="partners" className="mt-0 p-2 sm:p-4">
              <div className="max-h-[70vh] overflow-y-auto">
                <PartnersTimelineEmbed />
              </div>
              <LinkButton label="فتح التايم لاين كاملاً" onClick={() => navigate('/dashboard/partners-timeline')} />
            </TabsContent>

            {/* Broadcast Channels */}
            <TabsContent value="broadcast" className="mt-0">
              <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
                <div className="h-[60vh] overflow-hidden rounded-lg">
                  <BroadcastChannelView onBack={() => setActiveTab('org-posts')} />
                </div>
              </Suspense>
            </TabsContent>

            {/* Platform Posts */}
            <TabsContent value="platform" className="mt-0 p-2 sm:p-4">
              <div className="max-h-[70vh] overflow-y-auto">
                <PlatformPostsEmbed />
              </div>
              <LinkButton label="فتح صفحة المنشورات" onClick={() => navigate('/posts')} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const LinkButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <div className="mt-3 text-center">
    <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground hover:text-foreground" onClick={onClick}>
      <ExternalLink className="h-3 w-3" />
      {label}
    </Button>
  </div>
);

export default PostsHub;
