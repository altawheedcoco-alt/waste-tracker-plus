import { useState } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Wand2, Loader2, Sparkles, Leaf, Recycle, Building2, CheckCircle2, Share2, Palette, Mountain, TreePine } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Organization {
  id: string;
  name: string;
  organization_type: string;
  logo_url?: string | null;
}

interface ImagesGeneratorProps {
  isAdmin: boolean;
  organizations: Organization[];
  loadingOrgs: boolean;
  selectedOrganizationId: string;
  setSelectedOrganizationId: (id: string) => void;
  selectedOrg: Organization | null | undefined;
  targetOrganizationId: string | undefined;
  profile: { id: string } | null;
}

const imageTemplates = [
  {
    id: 'recycling',
    title: 'صورة إعادة تدوير',
    description: 'صورة احترافية عن التدوير',
    icon: Recycle,
    prompt: 'صورة احترافية تعبر عن إعادة التدوير والاستدامة البيئية'
  },
  {
    id: 'nature',
    title: 'طبيعة خضراء',
    description: 'صورة بيئية طبيعية',
    icon: TreePine,
    prompt: 'صورة طبيعة خضراء جميلة تعبر عن الحفاظ على البيئة'
  },
  {
    id: 'infographic',
    title: 'إنفوجرافيك',
    description: 'تصميم معلوماتي',
    icon: Palette,
    prompt: 'تصميم إنفوجرافيك احترافي عن فوائد إعادة التدوير'
  },
  {
    id: 'earth',
    title: 'كوكب الأرض',
    description: 'صورة كوكب الأرض',
    icon: Mountain,
    prompt: 'صورة فنية لكوكب الأرض تعبر عن الحفاظ على البيئة'
  }
];

const ImagesGenerator = ({
  isAdmin,
  organizations,
  loadingOrgs,
  selectedOrganizationId,
  setSelectedOrganizationId,
  selectedOrg,
  targetOrganizationId,
  profile
}: ImagesGeneratorProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [imageStyle, setImageStyle] = useState('realistic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedCaption, setGeneratedCaption] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isPosting, setIsPosting] = useState(false);
  const [posted, setPosted] = useState(false);

  const handleGenerateImage = async () => {
    const template = imageTemplates.find(t => t.id === selectedTemplate);
    const basePrompt = template?.prompt || customPrompt;

    if (!basePrompt.trim()) {
      toast.error('يرجى اختيار نموذج أو كتابة وصف للصورة');
      return;
    }

    if (isAdmin && !selectedOrganizationId) {
      toast.error('يرجى اختيار الجهة أولاً');
      return;
    }

    setIsGenerating(true);
    setGeneratedImageUrl(null);
    setGeneratedCaption(null);
    setPosted(false);
    setGenerationProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 5, 90));
      }, 500);

      const { data, error } = await supabase.functions.invoke('generate-promo-image', {
        body: { 
          prompt: basePrompt,
          style: imageStyle,
          organizationName: selectedOrg?.name
        }
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (error) throw error;

      if (data.success) {
        setGeneratedImageUrl(data.imageUrl);
        setGeneratedCaption(data.caption);
        toast.success('🎨 تم إنشاء الصورة بنجاح!');
      } else {
        throw new Error(data.error || 'فشل في إنشاء الصورة');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('فشل في إنشاء الصورة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsGenerating(false);
      setTimeout(() => setGenerationProgress(0), 1000);
    }
  };

  const handlePostToOrganization = async () => {
    if (!generatedImageUrl || !targetOrganizationId || !profile?.id) {
      toast.error('يرجى إنشاء الصورة أولاً');
      return;
    }

    setIsPosting(true);
    
    try {
      const { error } = await supabase
        .from('organization_posts')
        .insert({
          organization_id: targetOrganizationId,
          author_id: profile.id,
          content: generatedCaption || '',
          media_urls: [generatedImageUrl],
          post_type: 'image',
        });

      if (error) throw error;

      setPosted(true);
      toast.success(`🎉 تم نشر الصورة في صفحة ${selectedOrg?.name || 'الجهة'}!`);
    } catch (error) {
      console.error('Error posting:', error);
      toast.error('فشل في نشر الصورة');
    } finally {
      setIsPosting(false);
    }
  };

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
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" />
                اختر نوع الصورة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {imageTemplates.map((template) => (
                  <motion.button
                    key={template.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedTemplate(template.id);
                      setCustomPrompt('');
                    }}
                    className={`p-4 rounded-xl border-2 text-right transition-all ${
                      selectedTemplate === template.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <template.icon className={`w-6 h-6 mb-2 ${
                      selectedTemplate === template.id ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                    <h4 className="font-medium text-sm">{template.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                  </motion.button>
                ))}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">أو</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>وصف مخصص للصورة</Label>
                <Textarea
                  value={customPrompt}
                  onChange={(e) => {
                    setCustomPrompt(e.target.value);
                    setSelectedTemplate('');
                  }}
                  placeholder="اكتب وصفاً للصورة التي تريد إنشاءها..."
                  className="min-h-[100px]"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label>نمط الصورة</Label>
                <Select value={imageStyle} onValueChange={setImageStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realistic">واقعي</SelectItem>
                    <SelectItem value="artistic">فني</SelectItem>
                    <SelectItem value="minimalist">بسيط</SelectItem>
                    <SelectItem value="vibrant">ملون ومشرق</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {generationProgress > 0 && (
                <div className="space-y-2">
                  <Progress value={generationProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">جاري إنشاء الصورة...</p>
                </div>
              )}

              <Button 
                onClick={handleGenerateImage}
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
                    إنشاء الصورة
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Preview Section */}
        <div className="space-y-4">
          {generatedImageUrl ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  الصورة الجاهزة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg overflow-hidden">
                  <img 
                    src={generatedImageUrl} 
                    alt="الصورة المولدة" 
                    className="w-full h-auto object-cover"
                  />
                </div>
                
                {generatedCaption && (
                  <p className="text-sm text-muted-foreground">{generatedCaption}</p>
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
                  <ImageIcon className="w-10 h-10 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">ابدأ إنشاء صورة جديدة</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    اختر نموذجاً أو اكتب وصفاً ثم اضغط على "إنشاء"
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

export default ImagesGenerator;
