"use client";

/**
 * RepoLensMascot
 * A crisp inline SVG mascot: a small robot/explorer character whose head
 * IS the magnifying lens — the circular lens forms the face, with a handle
 * extending down-right. Electric-blue palette, works on dark and light backgrounds.
 *
 * Animation surface:
 *  - Entrance: fade + slide-up (via motion/react)
 *  - Hover on the whole mascot: tiny upward nudge
 *  - Hover: lens circle gets a highlight sweep (CSS clip-path animation)
 *  - prefers-reduced-motion: all animations suppressed
 */

import { motion, useReducedMotion, type Variants } from "motion/react";

interface RepoLensMascotProps {
  /** Rendered size (both width and height). Default 36px. */
  size?: number;
  className?: string;
}

export function RepoLensMascot({ size = 36, className = "" }: RepoLensMascotProps) {
  const reduced = useReducedMotion();

  const enterVariants: Variants = {
    hidden: { opacity: 0, y: reduced ? 0 : 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: "easeOut" },
    },
  };

  const hoverVariants: Variants = {
    rest: { y: 0 },
    hover: { y: reduced ? 0 : -2, transition: { duration: 0.2, ease: "easeOut" } },
  };

  return (
    <motion.div
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      variants={enterVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
    >
      <motion.svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: size, height: size }}
        variants={hoverVariants}
        aria-hidden="true"
        focusable="false"
      >
        {/* ── Defs ─────────────────────────────────────────────── */}
        <defs>
          {/* Gradient fill for the lens circle */}
          <radialGradient id="rl-lens-grad" cx="38%" cy="35%" r="62%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#1e3a5f" stopOpacity="0.55" />
          </radialGradient>

          {/* Gradient for the body */}
          <linearGradient id="rl-body-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Clip path: limits highlight sweep to lens area */}
          <clipPath id="rl-lens-clip">
            <circle cx="14.5" cy="13.5" r="9.5" />
          </clipPath>

          {/* Highlight sweep gradient (animates on hover via CSS) */}
          <linearGradient id="rl-sweep-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.28" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* ── Body / torso ──────────────────────────────────────── */}
        {/* Small rounded rectangle body below the lens */}
        <rect
          x="8"
          y="23"
          width="13"
          height="8"
          rx="3"
          fill="url(#rl-body-grad)"
          stroke="#2563eb"
          strokeWidth="0.9"
          strokeOpacity="0.7"
        />

        {/* Chest panel / visor strip */}
        <rect
          x="10"
          y="25.5"
          width="9"
          height="2.5"
          rx="1"
          fill="#1d4ed8"
          fillOpacity="0.6"
        />

        {/* Tiny indicator dot */}
        <circle cx="14.5" cy="29.5" r="0.9" fill="#38bdf8" fillOpacity="0.9" />

        {/* Antenna */}
        <line
          x1="14.5"
          y1="23"
          x2="14.5"
          y2="20.5"
          stroke="#60a5fa"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <circle cx="14.5" cy="19.8" r="1" fill="#38bdf8" />

        {/* ── Magnifying lens (the face / head) ─────────────────── */}
        {/* Outer ring */}
        <circle
          cx="14.5"
          cy="13.5"
          r="9.5"
          fill="url(#rl-lens-grad)"
          stroke="#2563eb"
          strokeWidth="1.4"
        />

        {/* Inner iris ring */}
        <circle
          cx="14.5"
          cy="13.5"
          r="6.5"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="0.7"
          strokeOpacity="0.6"
        />

        {/* Eye highlight dot — top-left of lens */}
        <circle cx="11.5" cy="10.8" r="1.6" fill="#bae6fd" fillOpacity="0.18" />

        {/* Eyes: two small circles for the robot face */}
        <circle cx="12.2" cy="13" r="1.5" fill="#0ea5e9" />
        <circle cx="16.8" cy="13" r="1.5" fill="#0ea5e9" />

        {/* Eye shine dots */}
        <circle cx="12.6" cy="12.5" r="0.5" fill="#ffffff" fillOpacity="0.85" />
        <circle cx="17.2" cy="12.5" r="0.5" fill="#ffffff" fillOpacity="0.85" />

        {/* Mouth: a small curved path suggesting a smile */}
        <path
          d="M12.2 15.6 Q14.5 17.2 16.8 15.6"
          stroke="#38bdf8"
          strokeWidth="0.9"
          strokeLinecap="round"
          fill="none"
        />

        {/* ── Handle ────────────────────────────────────────────── */}
        <line
          x1="21.8"
          y1="21.2"
          x2="27"
          y2="26.8"
          stroke="#2563eb"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Handle cap */}
        <circle cx="27.3" cy="27.1" r="1.4" fill="#1d4ed8" />

        {/* ── Hover highlight sweep (CSS animated) ──────────────── */}
        <rect
          className="rl-sweep"
          x="-20"
          y="-20"
          width="20"
          height="60"
          fill="url(#rl-sweep-grad)"
          clipPath="url(#rl-lens-clip)"
          style={{ transformOrigin: "14.5px 13.5px" }}
        />
      </motion.svg>
    </motion.div>
  );
}
