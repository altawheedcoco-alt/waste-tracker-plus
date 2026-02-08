import { useState } from 'react';
import { useQuickReplies, QuickReply } from '@/hooks/useQuickReplies';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Edit2,
  Trash2,
  Zap,
  MessageSquare,
  Search,
  Loader2,
  Save,
} from 'lucide-react';

const defaultCategories = [
  'ترحيب',
  'استلام الطلب',
  'قيد المعالجة',
  'طلب معلومات',
  'حل المشكلة',
  'إغلاق التذكرة',
  'تقني',
  'مالي',
];

const QuickReplyManager = () => {
  const { 
    quickReplies, 
    repliesByCategory, 
    isLoading, 
    createReply, 
    updateReply, 
    deleteReply 
  } = useQuickReplies();

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingReply, setEditingReply] = useState<QuickReply | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'عام',
    shortcut: '',
    is_global: true,
  });

  const filteredReplies = quickReplies.filter(r => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return r.title.toLowerCase().includes(s) || r.content.toLowerCase().includes(s);
  });

  const handleCreate = () => {
    setEditingReply(null);
    setFormData({
      title: '',
      content: '',
      category: 'عام',
      shortcut: '',
      is_global: true,
    });
    setShowForm(true);
  };

  const handleEdit = (reply: QuickReply) => {
    setEditingReply(reply);
    setFormData({
      title: reply.title,
      content: reply.content,
      category: reply.category,
      shortcut: reply.shortcut || '',
      is_global: reply.is_global,
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return;

    if (editingReply) {
      await updateReply.mutateAsync({
        id: editingReply.id,
        updates: formData,
      });
    } else {
      await createReply.mutateAsync(formData as any);
    }
    setShowForm(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteReply.mutateAsync(deleteId);
    setDeleteId(null);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">إدارة الردود الجاهزة</CardTitle>
              <Badge variant="secondary">{quickReplies.length}</Badge>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة رد جديد
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث في الردود..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-6">
                {Object.entries(repliesByCategory).map(([category, replies]) => {
                  const filtered = replies.filter(r => {
                    if (!search.trim()) return true;
                    const s = search.toLowerCase();
                    return r.title.toLowerCase().includes(s) || r.content.toLowerCase().includes(s);
                  });
                  
                  if (filtered.length === 0) return null;

                  return (
                    <div key={category}>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        {category}
                        <Badge variant="outline" className="text-xs">
                          {filtered.length}
                        </Badge>
                      </h3>
                      <div className="grid gap-2">
                        {filtered.map((reply) => (
                          <div
                            key={reply.id}
                            className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">{reply.title}</span>
                                  {reply.shortcut && (
                                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                      {reply.shortcut}
                                    </code>
                                  )}
                                  {reply.usage_count > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                      استخدم {reply.usage_count} مرة
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {reply.content}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(reply)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive"
                                  onClick={() => setDeleteId(reply.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingReply ? 'تعديل الرد الجاهز' : 'إضافة رد جاهز جديد'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>العنوان *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="مثال: ترحيب بالعميل"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>التصنيف</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>الاختصار</Label>
                <Input
                  value={formData.shortcut}
                  onChange={(e) => setFormData(prev => ({ ...prev, shortcut: e.target.value }))}
                  placeholder="مثال: /hi"
                  className="font-mono"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>نص الرد *</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="اكتب نص الرد الجاهز هنا..."
                rows={5}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.title.trim() || !formData.content.trim() || createReply.isPending || updateReply.isPending}
            >
              {(createReply.isPending || updateReply.isPending) ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <Save className="h-4 w-4 ml-2" />
              )}
              {editingReply ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الرد الجاهز</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الرد؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default QuickReplyManager;
