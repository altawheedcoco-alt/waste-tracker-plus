import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Wand2, Loader2, Building2, CheckCircle2, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import TemplateSelector from './TemplateSelector';
import { postCategories, PostTemplate } from './templates/postTemplates';

interface Organization {
  id: string;
  name: string;
  organization_type: string;
  logo_url?: string | null;
}

interface PostsGeneratorProps {
  isAdmin: boolean;
  organizations: Organization[];
  loadingOrgs: boolean;
  selectedOrganizationId: string;
  setSelectedOrganizationId: (id: string) => void;
  selectedOrg: Organization | null | undefined;
  targetOrganizationId: string | undefined;
  profile: { id: string } | null;
}

const PostsGenerator = ({
  isAdmin,
  organizations,
  loadingOrgs,
  selectedOrganizationId,
  setSelectedOrganizationId,
  selectedOrg,
  targetOrganizationId,
  profile
}: PostsGeneratorProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<PostTemplate | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [postTone, setPostTone] = useState('professional');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<string | null>(null);
  const [generatedHashtags, setGeneratedHashtags] = useState<string[]>([]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isPosting, setIsPosting] = useState(false);
  const [posted, setPosted] = useState(false);

  const handleSelectTemplate = (template: PostTemplate) => {
    setSelectedTemplate(template);
    setCustomPrompt('');
  };

  const handleGeneratePost = async () => {
    const basePrompt = selectedTemplate?.prompt || customPrompt;

    if (!basePrompt.trim()) {
      toast.error('يرجى اختيار نموذج أو كتابة وصف للمنشور');
      return;
    }

    if (isAdmin && !selectedOrganizationId) {
      toast.error('يرجى اختيار الجهة أولاً');
      return;
    }

    setIsGenerating(true);
    setGeneratedPost(null);
    setGeneratedHashtags([]);
    setPosted(false);
    setGenerationProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 10, 90));
      }, 300);

      const { data, error } = await supabase.functions.invoke('generate-post-content', {
        body: { 
          prompt: basePrompt,
          tone: postTone,
          contentType: 'post',
          organizationName: selectedOrg?.name
        }
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (error) throw error;

      if (data.success) {
        setGeneratedPost(data.content);
        setGeneratedHashtags(data.hashtags || []);
        toast.success('✅ تم إنشاء المنشور بنجاح!');
      } else {
        throw new Error(data.error || 'فشل في إنشاء المنشور');
      }
    } catch (error) {
      console.error('Error generating post:', error);
      toast.error('فشل في إنشاء المنشور. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsGenerating(false);
      setTimeout(() => setGenerationProgress(0), 1000);
    }
  };

  const handlePostToOrganization = async () => {
    if (!generatedPost || !targetOrganizationId || !profile?.id) {
      toast.error('يرجى إنشاء المنشور أولاً');
      return;
    }

    setIsPosting(true);
    
    try {
      const postContent = `${generatedPost}\n\n${generatedHashtags.map(h => `#${h}`).join(' ')}`;

      const { error } = await supabase
        .from('organization_posts')
        .insert({
          organization_id: targetOrganizationId,
          author_id: profile.id,
          content: postContent,
          media_urls: [],
          post_type: 'text',
        });

      if (error) throw error;

      setPosted(true);
      toast.success(`🎉 تم نشر المنشور في صفحة ${selectedOrg?.name || 'الجهة'}!`);
    } catch (error) {
      console.error('Error posting:', error);
      toast.error('فشل في نشر المنشور');
    } finally {
      setIsPosting(false);
    }
  };

  const totalTemplates = postCategories.reduce((acc, c) => acc + c.templates.length, 0);

  return (
    <div className="space-y-6">
      {/* Organization Selection for Admin */}
      {isAdmin && (
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              اختر الجهة المستهدفة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedOrganizationId} onValueChange={setSelectedOrganizationId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={loadingOrgs ? "جاري التحميل..." : "اختر جهة..."} />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {org.organization_type === 'generator' ? 'مولد' : 
                         org.organization_type === 'transporter' ? 'ناقل' : 'مدور'}
                      </Badge>
                      <span>{org.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  اختر نوع المنشور
                </span>
                <Badge variant="secondary">{totalTemplates} نموذج</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <TemplateSelector
                categories={postCategories}
                selectedTemplateId={selectedTemplate?.id || ''}
                onSelectTemplate={handleSelectTemplate}
                type="post"
              />

              {selectedTemplate && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-primary/10 rounded-lg border border-primary/20"
                >
                  <p className="text-sm font-medium">النموذج المختار: {selectedTemplate.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{selectedTemplate.description}</p>
                </motion.div>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">أو اكتب وصفاً مخصصاً</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>وصف مخصص للمنشور</Label>
                <Textarea
                  value={customPrompt}
                  onChange={(e) => {
                    setCustomPrompt(e.target.value);
                    setSelectedTemplate(null);
                  }}
                  placeholder="اكتب وصفاً للمنشور الذي تريد إنشاءه..."
                  className="min-h-[80px]"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label>نبرة المنشور</Label>
                <Select value={postTone} onValueChange={setPostTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">احترافي</SelectItem>
                    <SelectItem value="friendly">ودي</SelectItem>
                    <SelectItem value="motivational">تحفيزي</SelectItem>
                    <SelectItem value="educational">تعليمي</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {generationProgress > 0 && (
                <div className="space-y-2">
                  <Progress value={generationProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">جاري إنشاء المنشور...</p>
                </div>
              )}

              <Button 
                onClick={handleGeneratePost}
                disabled={isGenerating || (!selectedTemplate && !customPrompt.trim())}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 ml-2" />
                    إنشاء المنشور
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Preview Section */}
        <div className="space-y-4">
          {generatedPost ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  المنشور الجاهز
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap text-sm">
                  {generatedPost}
                </div>
                
                {generatedHashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {generatedHashtags.map((tag, index) => (
                      <Badge key={index} variant="secondary">#{tag}</Badge>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  {!posted ? (
                    <Button 
                      onClick={handlePostToOrganization}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500"
                      disabled={isPosting}
                    >
                      {isPosting ? (
                        <>
                          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                          جاري النشر...
                        </>
                      ) : (
                        <>
                          <Share2 className="w-4 h-4 ml-2" />
                          نشر في صفحة الجهة
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button variant="outline" className="flex-1 text-green-600" disabled>
                      <CheckCircle2 className="w-4 h-4 ml-2" />
                      تم النشر بنجاح
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full min-h-[300px] flex items-center justify-center">
              <div className="text-center space-y-4 p-8">
                <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
                  <FileText className="w-10 h-10 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">ابدأ إنشاء منشور جديد</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    اختر من {totalTemplates} نموذج جاهز أو اكتب وصفاً مخصصاً
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostsGenerator;
