import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Video, FileText, Image as ImageIcon, PenTool, Building2 } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import PostsGenerator from '@/components/content-generator/PostsGenerator';
import ImagesGenerator from '@/components/content-generator/ImagesGenerator';
import VideosGenerator from '@/components/content-generator/VideosGenerator';

interface Organization {
  id: string;
  name: string;
  organization_type: string;
  logo_url?: string | null;
}

const VideoGenerator = () => {
  const { organization, profile, roles } = useAuth();
  const isAdmin = roles.includes('admin');
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>('');
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  // Fetch all organizations for admin
  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!isAdmin) return;
      
      setLoadingOrgs(true);
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('id, name, organization_type, logo_url')
          .eq('is_active', true)
          .order('name');
        
        if (error) throw error;
        setOrganizations(data || []);
      } catch (error) {
        console.error('Error fetching organizations:', error);
      } finally {
        setLoadingOrgs(false);
      }
    };

    fetchOrganizations();
  }, [isAdmin]);

  // Get the target organization ID (selected for admin, or current for regular users)
  const targetOrganizationId = isAdmin ? selectedOrganizationId : organization?.id;
  const selectedOrg = isAdmin 
    ? organizations.find(o => o.id === selectedOrganizationId) 
    : organization;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <BackButton />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <PenTool className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">أنشئ منشورك بضغطة زر</h1>
              <p className="text-muted-foreground">أنشئ منشورات وصور وفيديوهات احترافية للترويج للجهة والمنصة والتوعية البيئية</p>
            </div>
          </div>
        </motion.div>

        {/* Content Type Tabs */}
        <Tabs defaultValue="posts" className="w-full" dir="rtl">
          <TabsList className="grid grid-cols-3 w-full max-w-lg">
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>منشورات</span>
            </TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              <span>صور</span>
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              <span>فيديوهات</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            <PostsGenerator 
              isAdmin={isAdmin}
              organizations={organizations}
              loadingOrgs={loadingOrgs}
              selectedOrganizationId={selectedOrganizationId}
              setSelectedOrganizationId={setSelectedOrganizationId}
              selectedOrg={selectedOrg}
              targetOrganizationId={targetOrganizationId}
              profile={profile}
            />
          </TabsContent>

          <TabsContent value="images" className="mt-6">
            <ImagesGenerator 
              isAdmin={isAdmin}
              organizations={organizations}
              loadingOrgs={loadingOrgs}
              selectedOrganizationId={selectedOrganizationId}
              setSelectedOrganizationId={setSelectedOrganizationId}
              selectedOrg={selectedOrg}
              targetOrganizationId={targetOrganizationId}
              profile={profile}
            />
          </TabsContent>

          <TabsContent value="videos" className="mt-6">
            <VideosGenerator 
              isAdmin={isAdmin}
              organizations={organizations}
              loadingOrgs={loadingOrgs}
              selectedOrganizationId={selectedOrganizationId}
              setSelectedOrganizationId={setSelectedOrganizationId}
              selectedOrg={selectedOrg}
              targetOrganizationId={targetOrganizationId}
              profile={profile}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default VideoGenerator;
