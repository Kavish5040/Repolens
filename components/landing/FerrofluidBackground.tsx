'use client';

import React, { useState, useEffect } from 'react';
import { useReducedMotion } from 'motion/react';
import Ferrofluid from './Ferrofluid';

interface FerrofluidBackgroundProps {
  className?: string;
  opacity?: number;
}

export function FerrofluidBackground({
  className = '',
  opacity = 0.35,
}: FerrofluidBackgroundProps) {
  const prefersReducedMotion = useReducedMotion();
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setHasWebGL(Boolean(gl));
    } catch {
      setHasWebGL(false);
    }
  }, []);

  // Graceful fallback if WebGL is unsupported
  if (hasWebGL === false) {
    return (
      <div
        className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 via-zinc-950 to-zinc-950" />
      </div>
    );
  }

  // Clamped DPR for optimal performance on high-density displays and mobile
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 1.5) : 1;

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden z-0 select-none ${className}`}
      aria-hidden="true"
    >
      {/* React Bits Ferrofluid with RepoLens Dark Intelligence Palette */}
      <Ferrofluid
        dpr={dpr}
        paused={Boolean(prefersReducedMotion)}
        colors={['#070b14', '#0f172a', '#1e293b', '#0369a1', '#2563eb', '#6366f1']}
        speed={0.25}
        scale={1.5}
        turbulence={0.8}
        fluidity={0.08}
        rimWidth={0.25}
        sharpness={2.0}
        shimmer={1.2}
        glow={1.8}
        flowDirection="down"
        opacity={opacity}
        mouseInteraction={!prefersReducedMotion}
        mouseStrength={0.6}
        mouseRadius={0.3}
        className="w-full h-full"
      />

      {/* Ambient Dark Gradient Vignette for crisp text contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-zinc-950/40 to-zinc-950 pointer-events-none" />
    </div>
  );
}

export default FerrofluidBackground;
