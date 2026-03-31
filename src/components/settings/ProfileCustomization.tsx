import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, User, Pencil, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Color theme pairs (like Chrome's profile colors)
const colorThemes = [
  { id: 'teal-blue', colors: ['#4DB6AC', '#26A69A'], label: 'فيروزي' },
  { id: 'blue-indigo', colors: ['#64B5F6', '#42A5F5'], label: 'أزرق' },
  { id: 'light-blue', colors: ['#81D4FA', '#4FC3F7'], label: 'سماوي' },
  { id: 'steel-blue', colors: ['#78909C', '#607D8B'], label: 'رمادي أزرق' },
  { id: 'slate-gray', colors: ['#90A4AE', '#78909C'], label: 'رمادي' },
  { id: 'navy-dark', colors: ['#455A64', '#37474F'], label: 'كحلي' },
  { id: 'red-rose', colors: ['#EF5350', '#E53935'], label: 'أحمر' },
  { id: 'pink-rose', colors: ['#F48FB1', '#EC407A'], label: 'وردي' },
  { id: 'peach-warm', colors: ['#FFAB91', '#FF8A65'], label: 'خوخي' },
  { id: 'amber-gold', colors: ['#FFD54F', '#FFC107'], label: 'ذهبي' },
  { id: 'lime-fresh', colors: ['#AED581', '#9CCC65'], label: 'ليموني' },
  { id: 'green-mint', colors: ['#81C784', '#66BB6A'], label: 'أخضر' },
  { id: 'deep-purple', colors: ['#9575CD', '#7E57C2'], label: 'بنفسجي' },
  { id: 'lavender', colors: ['#CE93D8', '#BA68C8'], label: 'لافندر' },
  { id: 'mauve-pink', colors: ['#F48FB1', '#E91E63'], label: 'وردي غامق' },
  { id: 'brown-earth', colors: ['#A1887F', '#8D6E63'], label: 'بني' },
];

// Avatar presets
const avatarPresets = [
  { id: 'fox', emoji: '🦊', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  { id: 'cat', emoji: '🐱', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  { id: 'wolf', emoji: '🐺', bg: 'bg-gray-100 dark:bg-gray-900/30' },
  { id: 'tiger', emoji: '🐯', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  { id: 'bear', emoji: '🐻', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  { id: 'panda', emoji: '🐼', bg: 'bg-gray-100 dark:bg-gray-900/30' },
  { id: 'eagle', emoji: '🦅', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
  { id: 'dolphin', emoji: '🐬', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  { id: 'butterfly', emoji: '🦋', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  { id: 'dragon', emoji: '🐉', bg: 'bg-red-100 dark:bg-red-900/30' },
  { id: 'unicorn', emoji: '🦄', bg: 'bg-pink-100 dark:bg-pink-900/30' },
  { id: 'penguin', emoji: '🐧', bg: 'bg-sky-100 dark:bg-sky-900/30' },
  { id: 'owl', emoji: '🦉', bg: 'bg-stone-100 dark:bg-stone-900/30' },
  { id: 'bee', emoji: '🐝', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  { id: 'rocket', emoji: '🚀', bg: 'bg-violet-100 dark:bg-violet-900/30' },
  { id: 'star', emoji: '⭐', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  { id: 'gem', emoji: '💎', bg: 'bg-cyan-100 dark:bg-cyan-900/30' },
  { id: 'crown', emoji: '👑', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  { id: 'leaf', emoji: '🍃', bg: 'bg-green-100 dark:bg-green-900/30' },
  { id: 'flame', emoji: '🔥', bg: 'bg-red-100 dark:bg-red-900/30' },
];

export const getAvatarEmoji = (presetId: string): string => {
  return avatarPresets.find(a => a.id === presetId)?.emoji || '👤';
};

export const getColorTheme = (themeId: string): string[] => {
  return colorThemes.find(t => t.id === themeId)?.colors || ['#4DB6AC', '#26A69A'];
};

interface ProfileCustomizationProps {
  compact?: boolean;
}

const ProfileCustomization = ({ compact = false }: ProfileCustomizationProps) => {
  const { user, profile } = useAuth();
  const [selectedColor, setSelectedColor] = useState('teal-blue');
  const [selectedAvatar, setSelectedAvatar] = useState('default');
  const [displayName, setDisplayName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.full_name || '');
      setSelectedColor((profile as any).profile_color_theme || 'teal-blue');
      setSelectedAvatar((profile as any).avatar_preset || 'default');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: displayName,
          avatar_preset: selectedAvatar,
          profile_color_theme: selectedColor,
        })
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('تم حفظ التخصيصات بنجاح');
      setIsEditing(false);
    } catch (err) {
      toast.error('فشل في حفظ التخصيصات');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedThemeColors = getColorTheme(selectedColor);
  const selectedAvatarData = avatarPresets.find(a => a.id === selectedAvatar);

  return (
    <div className={cn('space-y-6', compact && 'space-y-4')}>
      {/* Profile Preview Card */}
      <Card className="overflow-hidden">
        <div 
          className="h-24 relative"
          style={{ 
            background: `linear-gradient(135deg, ${selectedThemeColors[0]}, ${selectedThemeColors[1]})` 
          }}
        />
        <CardContent className="relative pt-0 -mt-10">
          <div className="flex items-end gap-4">
            <motion.div
              key={selectedAvatar}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                'w-20 h-20 rounded-full border-4 border-background flex items-center justify-center text-3xl shadow-lg',
                selectedAvatarData?.bg || 'bg-muted'
              )}
            >
              {selectedAvatarData?.emoji || '👤'}
            </motion.div>
            <div className="pb-1 flex-1">
              {isEditing ? (
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="font-bold text-lg h-9"
                  placeholder="اسمك..."
                  dir="rtl"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">{displayName || 'المستخدم'}</h3>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 rounded-md hover:bg-muted transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              )}
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color Theme Selection */}
      <Card>
        <CardHeader className={compact ? 'pb-3' : undefined}>
          <CardTitle className="text-base">اختيار لون المظهر</CardTitle>
          {!compact && (
            <CardDescription>اختر لوناً يعبر عن شخصيتك</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {colorThemes.map((theme) => (
              <motion.button
                key={theme.id}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedColor(theme.id)}
                className="relative group"
                title={theme.label}
              >
                <div
                  className={cn(
                    'w-full aspect-square rounded-full overflow-hidden border-2 transition-all shadow-sm',
                    selectedColor === theme.id
                      ? 'border-primary ring-2 ring-primary/30 shadow-md'
                      : 'border-transparent hover:border-muted-foreground/30'
                  )}
                >
                  <div className="w-full h-full flex">
                    <div
                      className="w-1/2 h-full"
                      style={{ backgroundColor: theme.colors[0] }}
                    />
                    <div
                      className="w-1/2 h-full"
                      style={{ backgroundColor: theme.colors[1] }}
                    />
                  </div>
                </div>
                {selectedColor === theme.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-sm"
                  >
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Avatar Selection */}
      <Card>
        <CardHeader className={compact ? 'pb-3' : undefined}>
          <CardTitle className="text-base">اختيار أفاتار</CardTitle>
          {!compact && (
            <CardDescription>اختر رمزاً يمثلك في النظام</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
            {avatarPresets.map((avatar) => (
              <motion.button
                key={avatar.id}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedAvatar(avatar.id)}
                className="relative"
                title={avatar.id}
              >
                <div
                  className={cn(
                    'w-full aspect-square rounded-full flex items-center justify-center text-2xl border-2 transition-all',
                    avatar.bg,
                    selectedAvatar === avatar.id
                      ? 'border-primary ring-2 ring-primary/30 shadow-md'
                      : 'border-transparent hover:border-muted-foreground/20'
                  )}
                >
                  {avatar.emoji}
                </div>
                {selectedAvatar === avatar.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-sm"
                  >
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="min-w-[140px]"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 ml-2" />
              حفظ التخصيصات
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ProfileCustomization;
