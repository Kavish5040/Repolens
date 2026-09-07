'use client';

import React, { useState, useEffect } from 'react';
import WarpText from './WarpText';

interface RepoLensWarpHeadingProps {
  className?: string;
  text?: string;
}

export function RepoLensWarpHeading({
  className = '',
  text = 'Deep Repository Intelligence\nfor Developers',
}: RepoLensWarpHeadingProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={`relative w-full max-w-3xl mx-auto flex items-center justify-center ${className}`}>
      {mounted ? (
        <WarpText
          text={text}
          fontSize="clamp(28px, 4.2vw, 48px)"
          fontWeight={800}
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          color="#f8fafc"
          letterSpacing="-0.025em"
          lineHeight={1.15}
          warpStrength={0.28}
          warpScale={1.1}
          speed={0.3}
          pointerInfluence={0.25}
          pointerStrength={0.4}
          refraction={0.012}
          ripple={false}
          className="w-full h-32 sm:h-40 md:h-44 min-h-[120px]"
        />
      ) : (
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight text-center py-4">
          Deep Repository Intelligence
          <br />
          for Developers
        </h1>
      )}
    </div>
  );
}

export default RepoLensWarpHeading;
