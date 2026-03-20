import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BookOpen, Calendar, ArrowLeft, ArrowRight, Clock, User, Sparkles, Star, ArrowUp, ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PageNavBar from "@/components/ui/page-nav-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence, motion } from "framer-motion";

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

const Blog = () => {
  const { language } = useLanguage();
  usePageTitle(language === 'ar' ? 'المدونة' : 'Blog');
  const navigate = useNavigate();
  const isAr = language === 'ar';

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts' as any)
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  const featured = posts.filter((p: any) => p.is_featured);
  const regular = posts.filter((p: any) => !p.is_featured);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <main className="container mx-auto px-4 pt-32 pb-16 max-w-5xl">
        <PageNavBar className="mb-6" />
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-2 rounded-full text-sm font-bold mb-4 border border-primary/20">
            <Sparkles className="h-4 w-4" />
            {isAr ? 'مقالات ونصائح بيئية' : 'Environmental Articles & Tips'}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 text-foreground">
            <BookOpen className="inline-block w-8 h-8 ml-2 text-primary" />
            {isAr ? 'مدونة iRecycle' : 'iRecycle Blog'}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {isAr ? 'مقالات ونصائح حول إدارة النفايات وإعادة التدوير في مصر' : 'Articles and tips on waste management and recycling in Egypt'}
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
          </div>
        )}

        {/* Featured */}
        {featured.length > 0 && (
          <div className="mb-10">
            {featured.map((article: any) => (
              <div
                key={article.id}
                onClick={() => navigate(`/blog/${article.slug}`)}
                className="group relative rounded-2xl overflow-hidden cursor-pointer hover:shadow-2xl transition-shadow"
              >
                <div className={`w-full h-64 sm:h-80 bg-gradient-to-br ${article.cover_gradient} flex items-center justify-center relative`}>
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="relative z-10 text-center text-white px-6">
                    <Badge className="bg-amber-500 text-amber-950 border-0 mb-3 gap-1">
                      <Star className="w-3 h-3 fill-amber-950" />مقال مميز
                    </Badge>
                    <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">
                      {isAr ? article.title : (article.title_en || article.title)}
                    </h2>
                    <p className="text-white/80 max-w-2xl mx-auto text-sm sm:text-base">
                      {isAr ? article.excerpt : (article.excerpt_en || article.excerpt)}
                    </p>
                    <div className="flex items-center justify-center gap-4 mt-4 text-white/70 text-xs">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(article.published_at || article.created_at)}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{article.reading_time_minutes} د</span>
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{article.author_name}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Regular Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {regular.map((article: any) => (
            <article
              key={article.id}
              onClick={() => navigate(`/blog/${article.slug}`)}
              className="group border border-border/50 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow bg-card cursor-pointer"
            >
              <div className={`h-32 bg-gradient-to-br ${article.cover_gradient} flex items-center justify-center`}>
                <BookOpen className="w-10 h-10 text-white/70" />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="secondary" className="text-xs">
                    {isAr ? article.category : (article.category_en || article.category)}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(article.published_at || article.created_at)}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {article.reading_time_minutes} د
                  </span>
                </div>
                <h2 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors leading-tight">
                  {isAr ? article.title : (article.title_en || article.title)}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">
                  {isAr ? article.excerpt : (article.excerpt_en || article.excerpt)}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" />{article.author_name}
                  </span>
                  <span className="text-sm font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                    {isAr ? 'اقرأ المزيد' : 'Read More'}
                    {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {!isLoading && posts.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">{isAr ? 'لا توجد مقالات حالياً' : 'No articles yet'}</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
