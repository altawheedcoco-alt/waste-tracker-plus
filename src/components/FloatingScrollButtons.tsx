import { useState, useEffect, useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const FloatingScrollButtons = () => {
  const [showUp, setShowUp] = useState(false);
  const [showDown, setShowDown] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setShowUp(scrollY > 300);
      setShowDown(scrollY < maxScroll - 100);
      setIsScrolling(true);
      clearTimeout(timer);
      timer = setTimeout(() => setIsScrolling(false), 1500);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(timer);
    };
  }, []);

  const scrollStep = useCallback((direction: 'up' | 'down') => {
    const vh = window.innerHeight;
    const offset = direction === 'down' ? vh * 0.85 : -(vh * 0.85);
    window.scrollBy({ top: offset, behavior: 'smooth' });
  }, []);

  const btnClass = cn(
    'flex items-center justify-center w-9 h-9 rounded-full',
    'bg-primary/20 backdrop-blur-md border border-primary/30',
    'text-primary hover:bg-primary/40 hover:scale-110',
    'transition-all duration-300 shadow-lg',
    isScrolling ? 'opacity-20 scale-75 pointer-events-none' : 'opacity-80'
  );

  return (
    <div className="fixed left-3 bottom-28 z-40 flex flex-col gap-2">
      {showUp && (
        <button onClick={() => scrollStep('up')} className={btnClass} aria-label="Scroll up">
          <ChevronUp className="w-4 h-4" />
        </button>
      )}
      {showDown && (
        <button onClick={() => scrollStep('down')} className={btnClass} aria-label="Scroll down">
          <ChevronDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default FloatingScrollButtons;
