/**
 * useSoundSystem — هوك مركزي لنظام الأصوات
 * يربط الأصوات تلقائياً بأحداث toast والتنقل
 */
import { useEffect, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { soundEngine, type SoundName } from '@/lib/soundEngine';

export function useSoundSystem() {
  const location = useLocation();
  const [enabled, setEnabled] = useState(soundEngine.enabled);
  const [volume, setVolume] = useState(soundEngine.volume);

  // صوت عند تغيير الصفحة
  useEffect(() => {
    soundEngine.play('navigate');
  }, [location.pathname]);

  const play = useCallback((name: SoundName) => {
    soundEngine.play(name);
  }, []);

  const toggle = useCallback(() => {
    const next = !soundEngine.enabled;
    soundEngine.enabled = next;
    setEnabled(next);
    if (next) soundEngine.play('toggle');
  }, []);

  const changeVolume = useCallback((v: number) => {
    soundEngine.volume = v;
    setVolume(v);
  }, []);

  return { play, enabled, toggle, volume, changeVolume };
}

/**
 * Wrapper around sonner toast that auto-plays sounds
 */
import { toast as sonnerToast } from 'sonner';

export const soundToast = {
  success: (msg: string, opts?: Parameters<typeof sonnerToast.success>[1]) => {
    soundEngine.play('success');
    return sonnerToast.success(msg, opts);
  },
  error: (msg: string, opts?: Parameters<typeof sonnerToast.error>[1]) => {
    soundEngine.play('error');
    return sonnerToast.error(msg, opts);
  },
  warning: (msg: string, opts?: Parameters<typeof sonnerToast.warning>[1]) => {
    soundEngine.play('warning');
    return sonnerToast.warning(msg, opts);
  },
  info: (msg: string, opts?: Parameters<typeof sonnerToast>[1]) => {
    soundEngine.play('notification');
    return sonnerToast(msg, opts);
  },
  message: (msg: string, opts?: Parameters<typeof sonnerToast>[1]) => {
    return sonnerToast(msg, opts);
  },
};
