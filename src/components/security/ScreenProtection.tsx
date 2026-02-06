import { useEffect, useCallback } from 'react';

interface ScreenProtectionProps {
  children: React.ReactNode;
  showWatermark?: boolean;
  watermarkText?: string;
}

export default function ScreenProtection({ 
  children, 
  showWatermark = true,
  watermarkText = 'iRecycle - Protected'
}: ScreenProtectionProps) {
  
  // Disable right-click context menu
  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
    return false;
  }, []);

  // Disable keyboard shortcuts for screenshots and dev tools
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // PrintScreen
    if (e.key === 'PrintScreen') {
      e.preventDefault();
      return false;
    }
    
    // Cmd/Ctrl + Shift + S (screenshot on some systems)
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      return false;
    }
    
    // Cmd/Ctrl + Shift + 3/4/5 (Mac screenshot)
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
      e.preventDefault();
      return false;
    }
    
    // Cmd/Ctrl + P (Print)
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      return false;
    }
    
    // F12 (Dev tools)
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }
    
    // Cmd/Ctrl + Shift + I (Dev tools)
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      return false;
    }
    
    // Cmd/Ctrl + U (View source)
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'u') {
      e.preventDefault();
      return false;
    }
    
    // Cmd/Ctrl + S (Save page)
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      return false;
    }
    
    return true;
  }, []);

  // Disable text selection and copy
  const handleCopy = useCallback((e: ClipboardEvent) => {
    e.preventDefault();
    return false;
  }, []);

  const handleCut = useCallback((e: ClipboardEvent) => {
    e.preventDefault();
    return false;
  }, []);

  const handleSelectStart = useCallback((e: Event) => {
    e.preventDefault();
    return false;
  }, []);

  // Disable drag
  const handleDragStart = useCallback((e: DragEvent) => {
    e.preventDefault();
    return false;
  }, []);

  useEffect(() => {
    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('dragstart', handleDragStart);

    // Add CSS to prevent selection
    const style = document.createElement('style');
    style.id = 'screen-protection-styles';
    style.textContent = `
      body {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
      
      /* Allow selection in input fields */
      input, textarea, [contenteditable="true"] {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
      
      /* Disable image dragging */
      img {
        -webkit-user-drag: none !important;
        user-drag: none !important;
        pointer-events: none;
      }
      
      /* Re-enable pointer events for clickable images */
      a img, button img {
        pointer-events: auto;
      }
    `;
    document.head.appendChild(style);

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('dragstart', handleDragStart);
      
      const existingStyle = document.getElementById('screen-protection-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [handleContextMenu, handleKeyDown, handleCopy, handleCut, handleSelectStart, handleDragStart]);

  return (
    <div className="relative">
      {children}
      
      {/* Watermark overlay */}
      {showWatermark && (
        <div 
          className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden select-none"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 100px,
              rgba(0, 0, 0, 0.02) 100px,
              rgba(0, 0, 0, 0.02) 200px
            )`,
          }}
          aria-hidden="true"
        >
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 300px,
                rgba(34, 197, 94, 0.03) 300px,
                rgba(34, 197, 94, 0.03) 600px
              )`,
            }}
          >
            {/* Repeating watermark pattern */}
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='14' fill='rgba(34,197,94,0.08)' text-anchor='middle' dominant-baseline='middle' transform='rotate(-30 150 100)'%3E${encodeURIComponent(watermarkText)}%3C/text%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
