import React from "react";
import type { TechnologySignal } from "@/lib/github/intelligence-types.ts";

interface TechSignalsCardProps {
  technologies: TechnologySignal[];
}

const CATEGORY_NAMES: Record<TechnologySignal["category"], string> = {
  framework: "Frameworks & Libraries",
  language: "Languages & Runtimes",
  testing: "Testing & Verification",
  build_tool: "Build Systems & Bundlers",
  infrastructure: "Infrastructure & CI/CD",
  linter_formatter: "Linters & Code Quality",
  runtime: "Runtimes",
};

const CONFIDENCE_BADGES: Record<TechnologySignal["confidence"], { label: string; style: string }> = {
  high: {
    label: "High Confidence",
    style: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
  },
  medium: {
    label: "Moderate Signal",
    style: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
  },
  low: {
    label: "Inferred Signal",
    style: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
  },
};

export function TechSignalsCard({ technologies }: TechSignalsCardProps) {
  if (!technologies || technologies.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-zinc-400 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        No technology signals could be inferred from the repository tree.
      </div>
    );
  }

  // Group by category
  const grouped = technologies.reduce((acc, tech) => {
    if (!acc[tech.category]) acc[tech.category] = [];
    acc[tech.category].push(tech);
    return acc;
  }, {} as Record<TechnologySignal["category"], TechnologySignal[]>);

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-6 shadow-sm flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <span>⚡</span>
          <span>Detected Technologies & Tooling</span>
        </h3>
        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">
          {technologies.length} signals detected
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(grouped).map(([category, techs]) => (
          <div
            key={category}
            className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 flex flex-col gap-2.5"
          >
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {CATEGORY_NAMES[category as TechnologySignal["category"]] || category}
            </h4>

            <div className="flex flex-col gap-2">
              {techs.map((tech) => {
                const conf = CONFIDENCE_BADGES[tech.confidence];

                return (
                  <div
                    key={tech.name}
                    className="p-2.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col gap-1 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {tech.name}
                      </span>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${conf.style}`}>
                        {conf.label}
                      </span>
                    </div>

                    {tech.evidence.length > 0 && (
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-tight">
                        {tech.evidence[0]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
