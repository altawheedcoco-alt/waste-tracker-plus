import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface ChatWallpaper {
  type: 'color' | 'gradient' | 'pattern';
  value: string;
}

export const WALLPAPER_PRESETS: { label: string; type: ChatWallpaper['type']; value: string }[] = [
  // WhatsApp-style colors
  { label: 'كلاسيكي', type: 'color', value: '#e5ddd5' },
  { label: 'أخضر فاتح', type: 'color', value: '#dcf8c6' },
  { label: 'أزرق فاتح', type: 'color', value: '#d4e6f1' },
  { label: 'وردي فاتح', type: 'color', value: '#fce4ec' },
  { label: 'بنفسجي', type: 'color', value: '#ede7f6' },
  { label: 'رمادي', type: 'color', value: '#eceff1' },
  { label: 'داكن', type: 'color', value: '#1a1a2e' },
  { label: 'أزرق داكن', type: 'color', value: '#0d1b2a' },
  // Gradients
  { label: 'غروب', type: 'gradient', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { label: 'محيط', type: 'gradient', value: 'linear-gradient(135deg, #667eea 0%, #43e97b 100%)' },
  { label: 'ذهبي', type: 'gradient', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { label: 'سماوي', type: 'gradient', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  // Patterns
  { label: 'نقاط', type: 'pattern', value: 'dots' },
  { label: 'خطوط', type: 'pattern', value: 'lines' },
  { label: 'دوائر', type: 'pattern', value: 'circles' },
];

const getPatternCSS = (patternName: string): string => {
  switch (patternName) {
    case 'dots':
      return 'radial-gradient(circle, hsl(var(--muted-foreground) / 0.08) 1px, transparent 1px)';
    case 'lines':
      return 'repeating-linear-gradient(45deg, transparent, transparent 10px, hsl(var(--muted-foreground) / 0.05) 10px, hsl(var(--muted-foreground) / 0.05) 11px)';
    case 'circles':
      return 'radial-gradient(circle at 25% 25%, hsl(var(--muted-foreground) / 0.04) 0%, transparent 50%), radial-gradient(circle at 75% 75%, hsl(var(--muted-foreground) / 0.04) 0%, transparent 50%)';
    default:
      return '';
  }
};

export function useChatWallpaper(conversationId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: wallpaper } = useQuery({
    queryKey: ['chat-wallpaper', user?.id, conversationId],
    queryFn: async (): Promise<ChatWallpaper | null> => {
      if (!user) return null;

      // Try conversation-specific first
      if (conversationId) {
        const { data } = await supabase
          .from('chat_wallpapers')
          .select('wallpaper_type, wallpaper_value')
          .eq('user_id', user.id)
          .eq('conversation_id', conversationId)
          .maybeSingle();

        if (data) return { type: data.wallpaper_type as ChatWallpaper['type'], value: data.wallpaper_value };
      }

      // Fall back to default (null conversation_id)
      const { data } = await supabase
        .from('chat_wallpapers')
        .select('wallpaper_type, wallpaper_value')
        .eq('user_id', user.id)
        .is('conversation_id', null)
        .maybeSingle();

      if (data) return { type: data.wallpaper_type as ChatWallpaper['type'], value: data.wallpaper_value };
      return null;
    },
    enabled: !!user,
  });

  const setWallpaper = useCallback(async (wp: ChatWallpaper, forConversation?: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('chat_wallpapers')
      .upsert({
        user_id: user.id,
        wallpaper_type: wp.type,
        wallpaper_value: wp.value,
        conversation_id: forConversation || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,conversation_id' });

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['chat-wallpaper'] });
    }
  }, [user, queryClient]);

  const getWallpaperStyle = useCallback((): React.CSSProperties => {
    if (!wallpaper) return { backgroundColor: 'hsl(var(--muted) / 0.2)' };

    switch (wallpaper.type) {
      case 'color':
        return { backgroundColor: wallpaper.value };
      case 'gradient':
        return { background: wallpaper.value };
      case 'pattern':
        return {
          backgroundColor: 'hsl(var(--background))',
          backgroundImage: getPatternCSS(wallpaper.value),
          backgroundSize: wallpaper.value === 'dots' ? '20px 20px' : undefined,
        };
      default:
        return {};
    }
  }, [wallpaper]);

  return { wallpaper, setWallpaper, getWallpaperStyle };
}
