import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  value: number | string;
  duration?: number;
  className?: string;
}

const AnimatedCounter = ({ value, duration = 800, className = '' }: AnimatedCounterProps) => {
  const [displayValue, setDisplayValue] = useState<string>('0');
  const prevValue = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numericValue)) {
      setDisplayValue(String(value));
      return;
    }

    const startValue = prevValue.current;
    const endValue = numericValue;
    const startTime = performance.now();
    const isDecimal = String(value).includes('.');

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * eased;

      setDisplayValue(isDecimal ? current.toFixed(1) : Math.round(current).toString());

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        prevValue.current = endValue;
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return <span className={className}>{displayValue}</span>;
};

export default AnimatedCounter;
