'use client';

import { useRef, useState } from 'react';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  variant?: 'light' | 'dark';
  topAccentColor?: string;
}

export function SpotlightCard({
  children,
  className = '',
  glowColor,
  variant = 'light',
  topAccentColor,
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0, opacity: 0 });

  const resolvedGlow =
    glowColor ??
    (variant === 'dark' ? 'rgba(45, 212, 191, 0.22)' : 'rgba(15, 118, 110, 0.12)');

  const baseStyles =
    variant === 'dark'
      ? 'border-white/10 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-teal-950/30'
      : 'border-slate-200/80 bg-white/90 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-900/5';

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      opacity: 1,
    });
  }

  function handleMouseLeave() {
    setPos((prev) => ({ ...prev, opacity: 0 }));
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group relative overflow-hidden rounded-3xl border p-6 backdrop-blur-md transition duration-300 hover:-translate-y-1 ${baseStyles} ${className}`}
    >
      {topAccentColor && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-20 h-1"
          style={{ backgroundColor: topAccentColor }}
        />
      )}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-3xl transition-opacity duration-300"
        style={{
          opacity: pos.opacity,
          background: `radial-gradient(380px circle at ${pos.x}px ${pos.y}px, ${resolvedGlow}, transparent 70%)`,
        }}
      />
      <div className="relative z-10 flex h-full flex-col">{children}</div>
    </div>
  );
}
