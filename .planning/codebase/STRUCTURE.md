# Directory & File Structure

```
repolens/
├── app/                  # Next.js App Router root
│   ├── favicon.ico       # Application icon
│   ├── globals.css       # Tailwind CSS root styles
│   ├── layout.tsx        # Root layout with font imports
│   └── page.tsx          # Default home view
├── public/               # Static assets (SVGs, logos)
├── .planning/            # GSD planning directory
│   └── codebase/         # Codebase map artifacts
├── AGENTS.md             # Antigravity / Next.js agent operational rules
├── CLAUDE.md             # Reference to AGENTS.md
├── eslint.config.mjs     # Flat ESLint config
├── next.config.ts        # Next.js configuration
├── package.json          # Dependency declarations & scripts
├── postcss.config.mjs    # PostCSS config for Tailwind v4
├── README.md             # Standard Next.js quickstart documentation
└── tsconfig.json         # TypeScript compiler configuration
```

## Naming & Organization Patterns
- **Pages & Routes:** `app/**/page.tsx`
- **Layouts:** `app/**/layout.tsx`
- **Components:** Modular UI components in `components/` (recommended)
- **Utilities & Libs:** `lib/` or `utils/` (recommended)
- **Path Aliasing:** `@/*` resolves to root directory `./*`
