# Architecture & Data Flow

## Architecture Overview
RepoLens is built on the Next.js App Router architecture utilizing React 19 Server and Client Components.

## Component Hierarchy & Layout
- **Root Layout (`app/layout.tsx`):**
  - Defines HTML wrapper, font variable bindings (`GeistSans`, `GeistMono`), and global styles.
  - Server Component by default.
- **Root Page (`app/page.tsx`):**
  - Main landing view showcasing template layout.
- **Global Styles (`app/globals.css`):**
  - Tailwind v4 import (`@import "tailwindcss";`) and CSS variables for theming.

## State Management & Boundaries
- Server-First rendering by default with React Server Components (RSC).
- Interactive client components marked with `'use client'` directive.
- API route handlers can be added under `app/api/...` for backend endpoints.
