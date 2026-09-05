# Technology Stack

## Core Technologies
- **Runtime Environment:** Node.js (v20+ recommended)
- **Framework:** [Next.js](https://nextjs.org/) `16.3.4` (App Router)
- **UI Library:** [React](https://react.dev/) `19.2.8` & [React DOM](https://react.dev/) `19.2.8`
- **Language:** [TypeScript](https://www.typescriptlang.org/) `^5` (Target: ES2017, Strict Mode enabled)

## Styling & Design System
- **CSS Framework:** [Tailwind CSS](https://tailwindcss.com/) `^4`
- **PostCSS Plugin:** `@tailwindcss/postcss` `^4`
- **Typography / Fonts:** `next/font` with Geist Sans and Geist Mono configured in root layout

## Tooling & Linting
- **Linter:** ESLint `^9` with `eslint-config-next` `16.3.4`
- **TypeScript Config:** `@/*` alias mapped to `./*`, `moduleResolution: bundler`, `strict: true`
- **Package Manager:** npm (with lockfile `package-lock.json`)

## Build & Scripts
- `npm run dev`: Starts Next.js development server (`next dev`)
- `npm run build`: Production build (`next build`)
- `npm run start`: Production server runner (`next start`)
- `npm run lint`: Runs ESLint check (`eslint`)
