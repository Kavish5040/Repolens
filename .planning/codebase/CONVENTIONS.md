# Code Conventions & Best Practices

## Language & Types
- **TypeScript:** Strict type checking enabled (`"strict": true`). Avoid `any` types; prefer explicit interfaces and type definitions.
- **Imports:** Use `@/` alias for intra-project imports (e.g., `@/components/...`, `@/lib/...`).

## Next.js & React Guidelines
- Follow Next.js App Router conventions.
- Default to React Server Components unless client-side interactivity, hooks (`useState`, `useEffect`), or browser APIs are required.
- Place `'use client'` at the top of client component files.
- Adhere to the Next.js agent rules outlined in `AGENTS.md`.

## Styling Conventions
- Use Tailwind CSS utility classes following Tailwind v4 syntax.
- Maintain dark mode compatibility using dark variant classes (e.g. `dark:bg-black`).
- Keep UI accessible, semantic, and responsive across mobile and desktop viewports.
