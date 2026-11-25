'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  length: number;
  angle: number;
  color: string;
  alpha: number;
  phase: number;
}

// ETOOS 247 BI 컬러 팔레트 (Teal, Lime Green, Sky Cyan, Subtle Slate)
const BRAND_COLORS = ['#0F766E', '#65A30D', '#0284C7', '#14B8A6', '#94A3B8'];

export function AntigravityCanvas({ scoped = false }: { scoped?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId = 0;
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];

    const mouse = { x: -9999, y: -9999, active: false };

    function initParticles() {
      particles = [];
      const spacing = 46;
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const bx = c * spacing + (r % 2 === 0 ? 0 : spacing * 0.5);
          const by = r * spacing;
          particles.push({
            x: bx,
            y: by,
            baseX: bx,
            baseY: by,
            vx: 0,
            vy: 0,
            length: 4 + Math.random() * 5,
            angle: Math.random() * Math.PI * 2,
            color: BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)],
            alpha: 0.22 + Math.random() * 0.28,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    }

    function resize() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (scoped && canvas.parentElement) {
        const rect = canvas.parentElement.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
      } else {
        width = window.innerWidth;
        height = window.innerHeight;
      }
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles();
    }

    function handleMouseMove(e: MouseEvent) {
      if (scoped && canvas) {
        const rect = canvas.getBoundingClientRect();
        const relX = e.clientX - rect.left;
        const relY = e.clientY - rect.top;
        if (relX >= 0 && relX <= rect.width && relY >= 0 && relY <= rect.height) {
          mouse.x = relX;
          mouse.y = relY;
          mouse.active = true;
        } else {
          mouse.active = false;
        }
      } else {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.active = true;
      }
    }

    function handleMouseLeave() {
      mouse.active = false;
    }

    let time = 0;
    function animate() {
      if (!ctx) return;
      time += 0.018;
      ctx.clearRect(0, 0, width, height);

      const radius = 500;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        const floatX = Math.sin(time + p.phase) * 3.5;
        const floatY = Math.cos(time * 0.8 + p.phase) * 3.5;
        const targetX = p.baseX + floatX;
        const targetY = p.baseY + floatY;

        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.hypot(dx, dy);

          if (dist < radius && dist > 0.1) {
            const force = (1 - dist / radius) * 28;
            p.vx += (dx / dist) * force * 0.22;
            p.vy += (dy / dist) * force * 0.22;
            p.angle = Math.atan2(dy, dx);
          }
        }

        p.vx += (targetX - p.x) * 0.045;
        p.vy += (targetY - p.y) * 0.045;
        p.vx *= 0.86;
        p.vy *= 0.86;

        p.x += p.vx;
        p.y += p.vy;

        const distToMouse = mouse.active ? Math.hypot(p.x - mouse.x, p.y - mouse.y) : 9999;
        const proximity = distToMouse < radius ? 1 - distToMouse / radius : 0;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle + time * 0.25);
        ctx.globalAlpha = Math.min(0.95, p.alpha + proximity * 0.65);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.6 + proximity * 2.0;
        ctx.lineCap = 'round';
        ctx.beginPath();
        const len = p.length + proximity * 14;
        ctx.moveTo(-len * 0.5, 0);
        ctx.lineTo(len * 0.5, 0);
        ctx.stroke();
        ctx.restore();
      }

      animationId = requestAnimationFrame(animate);
    }

    resize();
    animate();

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [scoped]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none inset-0 z-0 opacity-85 ${scoped ? 'absolute' : 'fixed'}`}
    />
  );
}
