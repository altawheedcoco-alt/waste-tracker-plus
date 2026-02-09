import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Plus, Trash2, Lock, Unlock, Key, Eye, EyeOff } from 'lucide-react';
import { usePagePasswords, availablePages, recoveryTypeLabels } from '@/hooks/usePagePasswords';

const PagePasswordSettings = () => {
  const { passwords, loading, addPagePassword, removePagePassword, togglePagePassword } = usePagePasswords();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [recoveryConfig, setRecoveryConfig] = useState<Record<string, { enabled: boolean; data: Record<string, any> }>>({
    email: { enabled: true, data: {} },
    phone: { enabled: false, data: { phone: '' } },
    security_question: { enabled: false, data: { question: '', answer: '' } },
    backup_code: { enabled: true, data: {} },
    admin_reset: { enabled: true, data: {} },
    otp: { enabled: false, data: {} },
  });

  const protectedPaths = passwords.map(p => p.page_path);
  const availableForProtection = availablePages.filter(p => !protectedPaths.includes(p.path));

  const handleAdd = async () => {
    if (!selectedPage || !newPassword || newPassword !== confirmPassword) return;
    const page = availablePages.find(p => p.path === selectedPage);
    if (!page) return;

    await addPagePassword(selectedPage, page.name, newPassword, recoveryConfig);
    setAddDialogOpen(false);
    setSelectedPage('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const toggleRecovery = (type: string, enabled: boolean) => {
    setRecoveryConfig(prev => ({
      ...prev,
      [type]: { ...prev[type], enabled },
    }));
  };

  const updateRecoveryData = (type: string, data: Record<string, any>) => {
    setRecoveryConfig(prev => ({
      ...prev,
      [type]: { ...prev[type], data: { ...prev[type].data, ...data } },
    }));
  };

  const enabledRecoveryCount = Object.values(recoveryConfig).filter(r => r.enabled).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                حماية الصفحات بكلمة مرور
              </CardTitle>
              <CardDescription>
                تعيين كلمة مرور إضافية على أي صفحة في النظام مع 6 طرق لاسترجاع كلمة السر
              </CardDescription>
            </div>
            <Button onClick={() => setAddDialogOpen(true)} disabled={availableForProtection.length === 0}>
              <Plus className="h-4 w-4 ml-2" />
              حماية صفحة
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {passwords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Lock className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">لا توجد صفحات محمية</p>
              <p className="text-sm">اضغط "حماية صفحة" لتعيين كلمة مرور على أي صفحة</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {passwords.map((pp, i) => (
                  <motion.div
                    key={pp.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${pp.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {pp.is_active ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-medium">{pp.page_name}</p>
                        <p className="text-xs text-muted-foreground font-mono" dir="ltr">{pp.page_path}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={pp.is_active ? 'default' : 'secondary'}>
                        {pp.is_active ? 'مفعّل' : 'معطّل'}
                      </Badge>
                      <Badge variant="outline">
                        {pp.recovery_methods?.filter(r => r.is_enabled).length || 0} طرق استرجاع
                      </Badge>
                      <Switch
                        checked={pp.is_active}
                        onCheckedChange={(checked) => togglePagePassword(pp.id, checked)}
                      />
                      <Button variant="ghost" size="icon" onClick={() => removePagePassword(pp.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Page Password Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              إضافة حماية لصفحة
            </DialogTitle>
            <DialogDescription>
              اختر الصفحة وعيّن كلمة المرور مع طرق الاسترجاع
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="password" className="mt-4">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="password">كلمة المرور</TabsTrigger>
              <TabsTrigger value="recovery">
                طرق الاسترجاع ({enabledRecoveryCount}/6)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="password" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>اختر الصفحة</Label>
                <Select value={selectedPage} onValueChange={setSelectedPage}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر صفحة لحمايتها" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableForProtection.map(page => (
                      <SelectItem key={page.path} value={page.path}>
                        {page.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => setShowPassword(!showPassword)} className="gap-1 text-xs">
                  {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {showPassword ? 'إخفاء' : 'إظهار'}
                </Button>
              </div>

              <div className="space-y-2">
                <Label>كلمة المرور</Label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="أدخل كلمة مرور قوية"
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label>تأكيد كلمة المرور</Label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="أعد إدخال كلمة المرور"
                  className="text-right"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-destructive">كلمتا المرور غير متطابقتين</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="recovery" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                فعّل طرق الاسترجاع التي تريدها (يُنصح بتفعيل 3 على الأقل)
              </p>
              {Object.entries(recoveryTypeLabels).map(([type, info]) => (
                <motion.div
                  key={type}
                  className="p-4 rounded-xl border bg-card space-y-3"
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{info.icon}</span>
                      <div>
                        <p className="font-medium">{info.label}</p>
                        <p className="text-xs text-muted-foreground">{info.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={recoveryConfig[type]?.enabled || false}
                      onCheckedChange={(checked) => toggleRecovery(type, checked)}
                    />
                  </div>

                  {recoveryConfig[type]?.enabled && type === 'phone' && (
                    <Input
                      value={recoveryConfig.phone?.data?.phone || ''}
                      onChange={e => updateRecoveryData('phone', { phone: e.target.value })}
                      placeholder="رقم الهاتف للاسترجاع"
                      className="text-right"
                    />
                  )}

                  {recoveryConfig[type]?.enabled && type === 'security_question' && (
                    <div className="space-y-2">
                      <Input
                        value={recoveryConfig.security_question?.data?.question || ''}
                        onChange={e => updateRecoveryData('security_question', { question: e.target.value })}
                        placeholder="سؤال الأمان (مثال: ما اسم مدرستك الأولى؟)"
                        className="text-right"
                      />
                      <Input
                        type="password"
                        value={recoveryConfig.security_question?.data?.answer || ''}
                        onChange={e => updateRecoveryData('security_question', { answer: e.target.value })}
                        placeholder="الإجابة"
                        className="text-right"
                      />
                    </div>
                  )}

                  {recoveryConfig[type]?.enabled && type === 'email' && (
                    <Input
                      value={recoveryConfig.email?.data?.email || ''}
                      onChange={e => updateRecoveryData('email', { email: e.target.value })}
                      placeholder="البريد الإلكتروني للاسترجاع (اختياري - سيستخدم بريد الحساب)"
                      className="text-right"
                      type="email"
                    />
                  )}
                </motion.div>
              ))}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>إلغاء</Button>
            <Button
              onClick={handleAdd}
              disabled={!selectedPage || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
            >
              <Shield className="h-4 w-4 ml-2" />
              تفعيل الحماية
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PagePasswordSettings;
