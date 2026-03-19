import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useUserPreferences } from '@/hooks/useUserPreferences';

export type BubbleStyle = 'rounded' | 'sharp' | 'minimal' | 'classic';

export interface ChatAppearance {
  fontSize: number; // 12-20
  bubbleStyle: BubbleStyle;
  showTimestamp: boolean;
  compactMode: boolean;
}

const DEFAULTS: ChatAppearance = {
  fontSize: 14,
  bubbleStyle: 'rounded',
  showTimestamp: true,
  compactMode: false,
};

interface ChatAppearanceContextValue extends ChatAppearance {
  setFontSize: (size: number) => void;
  setBubbleStyle: (style: BubbleStyle) => void;
  setShowTimestamp: (show: boolean) => void;
  setCompactMode: (compact: boolean) => void;
  /** CSS classes for the bubble container based on current style */
  getBubbleClasses: (isMine: boolean) => string;
  /** Inline style for message text */
  textStyle: React.CSSProperties;
}

const Ctx = createContext<ChatAppearanceContextValue | null>(null);

export function useChatAppearance() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Return defaults if not wrapped
    return {
      ...DEFAULTS,
      setFontSize: () => {},
      setBubbleStyle: () => {},
      setShowTimestamp: () => {},
      setCompactMode: () => {},
      getBubbleClasses: (isMine: boolean) =>
        isMine
          ? 'rounded-2xl px-3 py-2 bg-primary text-primary-foreground rounded-br-sm shadow-sm'
          : 'rounded-2xl px-3 py-2 bg-card border border-border rounded-bl-sm shadow-sm',
      textStyle: { fontSize: '14px' },
    };
  }
  return ctx;
}

const BUBBLE_STYLES: Record<BubbleStyle, { mine: string; theirs: string }> = {
  rounded: {
    mine: 'rounded-2xl px-3 py-2 bg-primary text-primary-foreground rounded-br-sm shadow-sm',
    theirs: 'rounded-2xl px-3 py-2 bg-card border border-border rounded-bl-sm shadow-sm',
  },
  sharp: {
    mine: 'rounded-md px-3 py-2 bg-primary text-primary-foreground shadow-sm',
    theirs: 'rounded-md px-3 py-2 bg-card border border-border shadow-sm',
  },
  minimal: {
    mine: 'rounded-lg px-3 py-1.5 bg-primary/10 text-foreground',
    theirs: 'rounded-lg px-3 py-1.5 bg-muted text-foreground',
  },
  classic: {
    mine: 'rounded-2xl rounded-br-none px-4 py-2.5 bg-primary text-primary-foreground shadow-md',
    theirs: 'rounded-2xl rounded-bl-none px-4 py-2.5 bg-card border border-border shadow-md',
  },
};

export function ChatAppearanceProvider({ children }: { children: ReactNode }) {
  const { getPref, setPref } = useUserPreferences();

  const fontSize = getPref('chat_font_size', DEFAULTS.fontSize) as number;
  const bubbleStyle = getPref('chat_bubble_style', DEFAULTS.bubbleStyle) as BubbleStyle;
  const showTimestamp = getPref('chat_show_timestamp', DEFAULTS.showTimestamp) as boolean;
  const compactMode = getPref('chat_compact_mode', DEFAULTS.compactMode) as boolean;

  const value = useMemo<ChatAppearanceContextValue>(() => ({
    fontSize,
    bubbleStyle,
    showTimestamp,
    compactMode,
    setFontSize: (size: number) => setPref('chat_font_size', Math.min(20, Math.max(12, size))),
    setBubbleStyle: (style: BubbleStyle) => setPref('chat_bubble_style', style),
    setShowTimestamp: (show: boolean) => setPref('chat_show_timestamp', show),
    setCompactMode: (compact: boolean) => setPref('chat_compact_mode', compact),
    getBubbleClasses: (isMine: boolean) => {
      const styles = BUBBLE_STYLES[bubbleStyle] || BUBBLE_STYLES.rounded;
      return isMine ? styles.mine : styles.theirs;
    },
    textStyle: { fontSize: `${fontSize}px`, lineHeight: fontSize > 16 ? '1.6' : '1.5' },
  }), [fontSize, bubbleStyle, showTimestamp, compactMode, setPref]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
