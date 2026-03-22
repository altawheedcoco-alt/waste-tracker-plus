import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  handler: (e: KeyboardEvent) => void;
  description?: string;
  category?: string;
  /** Priority: higher wins when multiple shortcuts match. Default 0 */
  priority?: number;
  /** If true, fires even when user is typing in an input */
  allowInInput?: boolean;
}

const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

function isTyping(e: KeyboardEvent): boolean {
  const target = e.target as HTMLElement;
  if (INPUT_TAGS.has(target.tagName)) return true;
  if (target.isContentEditable) return true;
  return false;
}

function matchesShortcut(e: KeyboardEvent, s: KeyboardShortcut): boolean {
  const key = s.key?.toLowerCase();
  if (!key) return false;
  const eventKey = e.key?.toLowerCase() ?? '';
  const eventCode = e.code?.toLowerCase() ?? '';
  if (eventKey !== key && eventCode !== key) return false;
  if (!!s.ctrl !== (e.ctrlKey || e.metaKey)) return false;
  if (!!s.alt !== e.altKey) return false;
  if (!!s.shift !== e.shiftKey) return false;
  return true;
}

/**
 * Register keyboard shortcuts. Returns a stable register/unregister pair.
 * Shortcuts are automatically cleaned up on unmount.
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      const sorted = [...shortcutsRef.current].sort(
        (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
      );

      for (const s of sorted) {
        if (matchesShortcut(e, s)) {
          if (!s.allowInInput && isTyping(e)) continue;
          e.preventDefault();
          e.stopPropagation();
          s.handler(e);
          return;
        }
      }
    };

    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [enabled]);
}

/**
 * Lightweight hook: single shortcut registration
 */
export function useShortcut(
  key: string,
  handler: () => void,
  opts?: { ctrl?: boolean; alt?: boolean; shift?: boolean; allowInInput?: boolean; enabled?: boolean }
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useKeyboardShortcuts(
    [
      {
        key,
        ctrl: opts?.ctrl,
        alt: opts?.alt,
        shift: opts?.shift,
        allowInInput: opts?.allowInInput,
        handler: () => handlerRef.current(),
      },
    ],
    opts?.enabled !== false
  );
}
