"use client";

import React, { useEffect } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring, useReducedMotion } from "motion/react";

export function AmbientSpotlight() {
  const shouldReduceMotion = useReducedMotion();
  const mouseX = useMotionValue(-500);
  const mouseY = useMotionValue(-500);

  const springX = useSpring(mouseX, { damping: 30, stiffness: 200 });
  const springY = useSpring(mouseY, { damping: 30, stiffness: 200 });

  useEffect(() => {
    if (shouldReduceMotion) return;

    function handleMouseMove(e: MouseEvent) {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY, shouldReduceMotion]);

  const backgroundLight = useMotionTemplate`radial-gradient(650px circle at ${springX}px ${springY}px, rgba(59, 130, 246, 0.05), transparent 80%)`;
  const backgroundDark = useMotionTemplate`radial-gradient(750px circle at ${springX}px ${springY}px, rgba(99, 102, 241, 0.07), rgba(59, 130, 246, 0.04) 40%, transparent 80%)`;

  if (shouldReduceMotion) {
    return (
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[350px] bg-gradient-to-b from-blue-500/5 via-indigo-500/2 to-transparent blur-3xl rounded-full" />
      </div>
    );
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Dynamic interactive spotlight */}
      <motion.div
        className="absolute inset-0 dark:hidden"
        style={{ background: backgroundLight }}
      />
      <motion.div
        className="absolute inset-0 hidden dark:block"
        style={{ background: backgroundDark }}
      />
      {/* Top subtle fixed horizon accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[300px] bg-gradient-to-b from-blue-500/[0.04] dark:from-blue-600/[0.06] via-indigo-500/[0.02] to-transparent blur-3xl rounded-full pointer-events-none" />
    </div>
  );
}
