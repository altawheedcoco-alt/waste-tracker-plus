import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Link2,
  Plus,
  Copy,
  QrCode,
  Trash2,
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Share2,
} from 'lucide-react';

interface DepositLink {
  id: string;
  organization_id: string;
  token: string;
  title: string | null;
  description: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

const generateToken = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

const DepositLinksManager = () => {
  const { profile } = useAuth();
  const [links, setLinks] = useState<DepositLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');

  const loadLinks = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('organization_deposit_links')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Error loading links:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, [profile?.organization_id]);

  const createLink = async () => {
    if (!profile?.organization_id) return;

    setCreating(true);
    try {
      const token = generateToken();
      
      const { error } = await supabase
        .from('organization_deposit_links')
        .insert({
          organization_id: profile.organization_id,
          token,
          title: newTitle || 'رابط إيداع سريع',
          description: newDescription || null,
          expires_at: hasExpiry && expiryDate ? new Date(expiryDate).toISOString() : null,
          created_by: profile.id,
        });

      if (error) throw error;

      toast.success('✅ تم إنشاء الرابط بنجاح');
      setDialogOpen(false);
      setNewTitle('');
      setNewDescription('');
      setHasExpiry(false);
      setExpiryDate('');
      loadLinks();
    } catch (error) {
      console.error('Error creating link:', error);
      toast.error('فشل في إنشاء الرابط');
    } finally {
      setCreating(false);
    }
  };

  const toggleLink = async (linkId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('organization_deposit_links')
        .update({ is_active: !isActive })
        .eq('id', linkId);

      if (error) throw error;
      
      loadLinks();
      toast.success(isActive ? 'تم إيقاف الرابط' : 'تم تفعيل الرابط');
    } catch (error) {
      console.error('Error toggling link:', error);
      toast.error('فشل في تحديث الرابط');
    }
  };

  const deleteLink = async (linkId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الرابط؟')) return;

    try {
      const { error } = await supabase
        .from('organization_deposit_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;
      
      loadLinks();
      toast.success('تم حذف الرابط');
    } catch (error) {
      console.error('Error deleting link:', error);
      toast.error('فشل في حذف الرابط');
    }
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/deposit/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('تم نسخ الرابط');
  };

  const shareLink = async (link: DepositLink) => {
    const url = `${window.location.origin}/deposit/${link.token}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: link.title || 'رابط إيداع سريع',
          text: link.description || 'أرسل إيداعك بسهولة',
          url,
        });
      } catch (error) {
        copyLink(link.token);
      }
    } else {
      copyLink(link.token);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              روابط الإيداع السريع
            </CardTitle>
            <CardDescription>
              أنشئ روابط قابلة للمشاركة لاستقبال الإيداعات بسهولة
            </CardDescription>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                إنشاء رابط جديد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إنشاء رابط إيداع جديد</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>عنوان الرابط</Label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="مثال: إيداعات شهر يناير"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>الوصف (اختياري)</Label>
                  <Textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="تعليمات أو معلومات للمودع..."
                    rows={2}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>تحديد تاريخ انتهاء</Label>
                  <Switch checked={hasExpiry} onCheckedChange={setHasExpiry} />
                </div>
                
                {hasExpiry && (
                  <div className="space-y-2">
                    <Label>تاريخ الانتهاء</Label>
                    <Input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                )}
                
                <Button 
                  onClick={createLink} 
                  disabled={creating}
                  className="w-full"
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  ) : (
                    <Plus className="h-4 w-4 ml-2" />
                  )}
                  إنشاء الرابط
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {links.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Link2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>لا توجد روابط حتى الآن</p>
            <p className="text-sm">أنشئ رابطاً جديداً لاستقبال الإيداعات</p>
          </div>
        ) : (
          <div className="space-y-3">
            {links.map((link, index) => {
              const isExpired = link.expires_at && new Date(link.expires_at) < new Date();
              const url = `${window.location.origin}/deposit/${link.token}`;
              
              return (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-lg border ${
                    link.is_active && !isExpired 
                      ? 'bg-emerald-50/50 border-emerald-200' 
                      : 'bg-muted/30 border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{link.title || 'رابط إيداع'}</h4>
                        {link.is_active && !isExpired ? (
                          <Badge className="bg-emerald-100 text-emerald-700 gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            نشط
                          </Badge>
                        ) : isExpired ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            منتهي
                          </Badge>
                        ) : (
                          <Badge variant="secondary">معطل</Badge>
                        )}
                      </div>
                      
                      {link.description && (
                        <p className="text-sm text-muted-foreground mb-2">{link.description}</p>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <code className="bg-muted px-2 py-1 rounded truncate max-w-[200px]">
                          {url}
                        </code>
                        {link.expires_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            ينتهي: {new Date(link.expires_at).toLocaleDateString('ar-EG')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => shareLink(link)}
                        title="مشاركة"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyLink(link.token)}
                        title="نسخ"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(`/deposit/${link.token}`, '_blank')}
                        title="فتح"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Switch
                        checked={link.is_active}
                        onCheckedChange={() => toggleLink(link.id, link.is_active)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteLink(link.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DepositLinksManager;
