import { useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Wand2, Loader2, Film, Building2, CheckCircle2, Share2, Eye, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import VideoPreviewPlayer from '@/components/video/VideoPreviewPlayer';
import TemplateSelector from './TemplateSelector';
import { videoCategories, VideoTemplate } from './templates/videoTemplates';

interface GeneratedContent {
  title: string;
  script: string;
  scenes: string[];
  hashtags: string[];
  callToAction: string;
  videoPrompt?: string;
}

interface Organization {
  id: string;
  name: string;
  organization_type: string;
  logo_url?: string | null;
}

interface VideosGeneratorProps {
  isAdmin: boolean;
  organizations: Organization[];
  loadingOrgs: boolean;
  selectedOrganizationId: string;
  setSelectedOrganizationId: (id: string) => void;
  selectedOrg: Organization | null | undefined;
  targetOrganizationId: string | undefined;
  profile: { id: string } | null;
}

const VideosGenerator = ({
  isAdmin,
  organizations,
  loadingOrgs,
  selectedOrganizationId,
  setSelectedOrganizationId,
  selectedOrg,
  targetOrganizationId,
  profile
}: VideosGeneratorProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<VideoTemplate | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [videoDuration, setVideoDuration] = useState('30');
  const [videoStyle, setVideoStyle] = useState('modern');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isPostingDirectly, setIsPostingDirectly] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [posted, setPosted] = useState(false);

  const handleSelectTemplate = (template: VideoTemplate) => {
    setSelectedTemplate(template);
    setCustomPrompt('');
  };

  const handleGenerateScript = async (postDirectly = false) => {
    const basePrompt = selectedTemplate?.prompt || customPrompt;

    if (!basePrompt.trim()) {
      toast.error('يرجى اختيار نموذج أو كتابة وصف للفيديو');
      return;
    }

    if (isAdmin && !selectedOrganizationId) {
      toast.error('يرجى اختيار الجهة أولاً');
      return;
    }

    setIsGenerating(true);
    setGeneratedContent(null);
    setGeneratedImageUrl(null);
    setGeneratedVideoUrl(null);
    setPosted(false);
    setGenerationProgress(0);

    if (postDirectly) {
      setIsPostingDirectly(true);
    }

    try {
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 5, 90));
      }, 800);

      const { data, error } = await supabase.functions.invoke('generate-promo-video', {
        body: { 
          prompt: basePrompt,
          duration: videoDuration,
          style: videoStyle,
          organizationId: targetOrganizationId,
          postDirectly
        }
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (error) throw error;

      if (data.success) {
        setGeneratedContent(data.content);
        setGeneratedImageUrl(data.imageUrl);
        setGeneratedVideoUrl(data.videoUrl);
        
        if (data.posted) {
          setPosted(true);
          toast.success(`🎬 تم إنشاء ونشر المحتوى في منشورات ${selectedOrg?.name || 'الجهة'}!`);
        } else if (data.videoUrl) {
          toast.success('🎥 تم إنشاء الفيديو بنجاح!');
        } else {
          toast.success('✅ تم إنشاء المحتوى والصورة بنجاح!');
        }
      } else {
        throw new Error(data.error || 'فشل في إنشاء المحتوى');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('فشل في إنشاء المحتوى. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsGenerating(false);
      setIsPostingDirectly(false);
      setTimeout(() => setGenerationProgress(0), 1000);
    }
  };

  const handlePostToOrganization = async () => {
    if (!generatedContent || !targetOrganizationId || !profile?.id) {
      toast.error('يرجى إنشاء المحتوى أولاً');
      return;
    }

    setIsPostingDirectly(true);
    
    try {
      const postContent = `🎬 ${generatedContent.title}\n\n${generatedContent.script}\n\n📢 ${generatedContent.callToAction}\n\n${generatedContent.hashtags.map((h: string) => `#${h}`).join(' ')}`;
      
      const mediaUrls = generatedVideoUrl ? [generatedVideoUrl] : (generatedImageUrl ? [generatedImageUrl] : []);
      const postType = generatedVideoUrl ? 'video' : (generatedImageUrl ? 'image' : 'text');

      const { error } = await supabase
        .from('organization_posts')
        .insert({
          organization_id: targetOrganizationId,
          author_id: profile.id,
          content: postContent,
          media_urls: mediaUrls,
          post_type: postType,
        });

      if (error) throw error;

      setPosted(true);
      toast.success(`🎉 تم نشر المحتوى في منشورات ${selectedOrg?.name || 'الجهة'}!`);
    } catch (error) {
      console.error('Error posting:', error);
      toast.error('فشل في نشر المحتوى');
    } finally {
      setIsPostingDirectly(false);
    }
  };

  const totalTemplates = videoCategories.reduce((acc, c) => acc + c.templates.length, 0);

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
            <CardDescription>
              حدد الجهة التي سيتم نشر المحتوى في صفحتها
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select 
              value={selectedOrganizationId} 
              onValueChange={setSelectedOrganizationId}
            >
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
            
            {selectedOrg && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-background rounded-lg border flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{selectedOrg.name}</p>
                  <p className="text-xs text-muted-foreground">
                    سيتم نشر المحتوى في صفحة هذه الجهة
                  </p>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column - Input */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Film className="w-5 h-5 text-primary" />
                  اختر نموذج الفيديو
                </span>
                <Badge variant="secondary">{totalTemplates} نموذج</Badge>
              </CardTitle>
              <CardDescription>
                اختر من النماذج الجاهزة أو أنشئ وصفك الخاص
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TemplateSelector
                categories={videoCategories}
                selectedTemplateId={selectedTemplate?.id || ''}
                onSelectTemplate={handleSelectTemplate}
                type="video"
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
                <Label>وصف مخصص للفيديو</Label>
                <Textarea
                  value={customPrompt}
                  onChange={(e) => {
                    setCustomPrompt(e.target.value);
                    setSelectedTemplate(null);
                  }}
                  placeholder="اكتب وصفاً تفصيلياً للفيديو الذي تريد إنشاءه..."
                  className="min-h-[80px]"
                  dir="rtl"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-primary" />
                إعدادات الفيديو
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>مدة الفيديو</Label>
                  <Select value={videoDuration} onValueChange={setVideoDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 ثانية</SelectItem>
                      <SelectItem value="30">30 ثانية</SelectItem>
                      <SelectItem value="60">60 ثانية</SelectItem>
                      <SelectItem value="90">90 ثانية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>نمط الفيديو</Label>
                  <Select value={videoStyle} onValueChange={setVideoStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">عصري وحديث</SelectItem>
                      <SelectItem value="corporate">احترافي رسمي</SelectItem>
                      <SelectItem value="creative">إبداعي وملفت</SelectItem>
                      <SelectItem value="minimal">بسيط ونظيف</SelectItem>
                      <SelectItem value="dynamic">ديناميكي وحيوي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {generationProgress > 0 && (
                <div className="space-y-2">
                  <Progress value={generationProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    {generationProgress < 50 ? 'جاري إنشاء السيناريو...' : 
                     generationProgress < 90 ? 'جاري توليد المحتوى البصري...' : 
                     'اكتمل التوليد!'}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => handleGenerateScript(false)}
                  disabled={isGenerating || (!selectedTemplate && !customPrompt.trim())}
                  className="w-full"
                  size="lg"
                  variant="outline"
                >
                  {isGenerating && !isPostingDirectly ? (
                    <>
                      <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                      جاري الإنشاء...
                    </>
                  ) : (
                    <>
                      <Eye className="w-5 h-5 ml-2" />
                      معاينة أولاً
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={() => handleGenerateScript(true)}
                  disabled={isGenerating || (!selectedTemplate && !customPrompt.trim()) || (isAdmin && !selectedOrganizationId)}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  size="lg"
                >
                  {isGenerating && isPostingDirectly ? (
                    <>
                      <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                      جاري الإنشاء والنشر...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 ml-2" />
                      إنشاء ونشر مباشرة
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Preview */}
        <div className="space-y-4">
          {generatedContent ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      {generatedContent.title}
                    </CardTitle>
                    {posted && (
                      <Badge className="bg-green-500">تم النشر ✓</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {generatedVideoUrl ? (
                    <div className="rounded-lg overflow-hidden bg-black">
                      <video 
                        src={generatedVideoUrl}
                        controls
                        className="w-full h-auto"
                      />
                    </div>
                  ) : generatedImageUrl ? (
                    <div className="rounded-lg overflow-hidden">
                      <img 
                        src={generatedImageUrl}
                        alt="صورة الفيديو"
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  ) : null}

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">السيناريو:</h4>
                    <p className="text-sm whitespace-pre-wrap">{generatedContent.script}</p>
                  </div>

                  {generatedContent.scenes && generatedContent.scenes.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">المشاهد:</h4>
                      <div className="space-y-2">
                        {generatedContent.scenes.map((scene, index) => (
                          <div key={index} className="p-2 bg-muted/50 rounded text-sm flex gap-2">
                            <Badge variant="outline" className="shrink-0">{index + 1}</Badge>
                            <span>{scene}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-primary/10 rounded-lg">
                    <p className="text-sm font-medium">📢 {generatedContent.callToAction}</p>
                  </div>

                  {generatedContent.hashtags && generatedContent.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {generatedContent.hashtags.map((tag, index) => (
                        <Badge key={index} variant="secondary">#{tag}</Badge>
                      ))}
                    </div>
                  )}

                  {!posted && (
                    <Button 
                      onClick={handlePostToOrganization}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500"
                      disabled={isPostingDirectly}
                    >
                      {isPostingDirectly ? (
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
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="h-full min-h-[400px] flex items-center justify-center">
              <div className="text-center space-y-4 p-8">
                <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
                  <Video className="w-10 h-10 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">ابدأ إنشاء فيديو جديد</h3>
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

export default VideosGenerator;
