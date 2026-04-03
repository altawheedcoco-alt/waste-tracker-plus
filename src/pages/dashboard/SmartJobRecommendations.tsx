import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, MapPin, Briefcase, Star, Clock, Building2, Heart } from "lucide-react";

const SmartJobRecommendations = () => {
  const [savedJobs, setSavedJobs] = useState<string[]>([]);

  const recommendations = [
    {
      id: "1", title: "سائق نقل مخلفات صناعية", company: "شركة النقل الآمن", location: "القاهرة - 6 أكتوبر",
      salary: "8,000 - 12,000 ج.م", match: 95, skills: ["رخصة مهنية", "ADR", "3 سنوات خبرة"],
      posted: "منذ يومين", type: "دوام كامل", reason: "يطابق خبرتك في نقل المخلفات الصناعية"
    },
    {
      id: "2", title: "فني فرز وتدوير", company: "مصنع إعادة التدوير المتقدم", location: "الجيزة - أبو رواش",
      salary: "5,000 - 7,000 ج.م", match: 88, skills: ["خبرة فرز", "معرفة أنواع المخلفات"],
      posted: "منذ 3 أيام", type: "دوام كامل", reason: "قريب من موقعك ويتطابق مع مهاراتك"
    },
    {
      id: "3", title: "مشرف عمليات جمع", company: "الشركة العربية للبيئة", location: "الإسكندرية",
      salary: "10,000 - 15,000 ج.م", match: 82, skills: ["إدارة فرق", "خبرة لوجستية", "5 سنوات"],
      posted: "منذ أسبوع", type: "دوام كامل", reason: "ترقية مناسبة لخبرتك الحالية"
    },
    {
      id: "4", title: "عامل نظافة صناعية", company: "المجموعة المصرية", location: "القاهرة - العاشر",
      salary: "4,000 - 5,500 ج.م", match: 75, skills: ["صحة وسلامة", "العمل الجماعي"],
      posted: "منذ يوم", type: "نظام ورديات", reason: "مطلوب عمال بشكل عاجل في منطقتك"
    },
  ];

  const skillGaps = [
    { skill: "شهادة ADR لنقل المواد الخطرة", importance: "عالية", courses: 2 },
    { skill: "إدارة المشاريع البيئية", importance: "متوسطة", courses: 3 },
    { skill: "تشغيل معدات الفرز الآلي", importance: "عالية", courses: 1 },
  ];

  const toggleSave = (id: string) => {
    setSavedJobs(prev => prev.includes(id) ? prev.filter(j => j !== id) : [...prev, id]);
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-primary" />
          التوصيات الذكية للوظائف
        </h1>
        <p className="text-muted-foreground mt-1">وظائف مقترحة بناءً على مهاراتك وخبراتك</p>
      </div>

      <Tabs defaultValue="recommendations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recommendations">الوظائف المقترحة</TabsTrigger>
          <TabsTrigger value="skills">تحليل المهارات</TabsTrigger>
          <TabsTrigger value="saved">المحفوظة ({savedJobs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          {recommendations.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-foreground text-lg">{job.title}</h3>
                      <Badge className="bg-primary/10 text-primary border-0">{job.match}% تطابق</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{job.company}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{job.posted}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => toggleSave(job.id)}>
                    <Heart className={`h-5 w-5 ${savedJobs.includes(job.id) ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
                  </Button>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline">{job.type}</Badge>
                  <Badge variant="outline" className="text-emerald-600">{job.salary}</Badge>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {job.skills.map((s, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-primary flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    {job.reason}
                  </p>
                  <Button size="sm">تقديم طلب</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">الفجوات في المهارات</CardTitle>
              <p className="text-sm text-muted-foreground">مهارات مطلوبة في سوق العمل يمكنك تطويرها</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {skillGaps.map((gap, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{gap.skill}</p>
                    <p className="text-xs text-muted-foreground">{gap.courses} دورة تدريبية متاحة</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={gap.importance === 'عالية' ? 'destructive' : 'outline'}>{gap.importance}</Badge>
                    <Button size="sm" variant="outline">ابدأ التعلم</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saved">
          {savedJobs.length === 0 ? (
            <Card><CardContent className="p-8 text-center">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">لم تحفظ أي وظائف بعد</p>
            </CardContent></Card>
          ) : (
            recommendations.filter(j => savedJobs.includes(j.id)).map(job => (
              <Card key={job.id} className="mb-3">
                <CardContent className="p-4">
                  <h3 className="font-bold text-foreground">{job.title}</h3>
                  <p className="text-sm text-muted-foreground">{job.company} • {job.location}</p>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm">تقديم طلب</Button>
                    <Button size="sm" variant="outline" onClick={() => toggleSave(job.id)}>إزالة</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
      </DashboardLayout>
  );
};

export default SmartJobRecommendations;
