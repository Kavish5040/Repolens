import React from "react";

interface StatBadgeProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  href?: string;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + "k";
  }
  return num.toLocaleString();
}

export function StatBadge({ icon, label, value, subValue, href }: StatBadgeProps) {
  const displayValue = typeof value === "number" ? formatNumber(value) : value;

  const content = (
    <div className="flex items-center gap-3 p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 hover:bg-zinc-100/60 dark:hover:bg-zinc-850/60 transition-all">
      <div className="text-zinc-500 dark:text-zinc-400 flex-shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider truncate">
          {label}
        </p>
        <div className="flex items-baseline gap-1.5">
          <p className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight truncate">
            {displayValue}
          </p>
          {subValue && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
              {subValue}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block group"
      >
        {content}
      </a>
    );
  }

  return content;
}
