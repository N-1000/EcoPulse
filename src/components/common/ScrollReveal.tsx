// ===================================================
// ECOPULSE 2026 - components/common/ScrollReveal.tsx
// Efecto fade/slide al scrollear inspirado en Apple.
// Soporta 4 direcciones: up, down, left, right.
// ===================================================
import { useEffect, useRef, useState, ReactNode } from 'react';

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  direction?: Direction;
  className?: string;
}

const getInitialTransform = (direction: Direction) => {
  switch (direction) {
    case 'up': return 'translate-y-12';
    case 'down': return '-translate-y-12';
    case 'left': return 'translate-x-12';
    case 'right': return '-translate-x-12';
    case 'none': return '';
  }
};

export const ScrollReveal = ({
  children,
  delay = 0,
  direction = 'up',
  className = ''
}: ScrollRevealProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const initialTransform = getInitialTransform(direction);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-x-0 translate-y-0' : `opacity-0 ${initialTransform}`
      } ${className}`}
    >
      {children}
    </div>
  );
};
