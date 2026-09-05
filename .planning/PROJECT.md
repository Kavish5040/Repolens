# Project: RepoLens

## Overview
**RepoLens** is an AI-powered GitHub Repository Intelligence Dashboard. When a user pastes any public GitHub repository URL, RepoLens helps them deeply understand how the project works, how its pieces connect, where to start reading the code, and allows them to interactively ask questions about the repository.

Instead of only displaying surface-level vanity metrics (like star counts or raw commit counts), RepoLens provides actionable developer onboarding, architectural breakdown, and AI-driven codebase intelligence.

## Vision & Learning Goals
- **Product Vision:** A robust, genuinely working developer tool deployed on Vercel with resilient real-world API handling (rate limits, caching, error states, and zero credential leakage).
- **Engineering Mentorship Goal:** Build incrementally with clean architecture (RSC vs Client components, secure API routes, streaming AI responses, resilient external API consumption) while explaining interview-level design decisions and trade-offs.

## Core Tech Stack
- **Framework:** Next.js 16 (App Router with Server Components & Server Actions/Route Handlers)
- **UI & Styling:** React 19, TypeScript (Strict Mode), Tailwind CSS v4
- **Integrations:** GitHub REST / Git Trees API, AI API (e.g., Google Gemini / Vercel AI SDK)
- **Deployment:** Vercel

## Key Architectural Principles
1. **Zero Client Secret Exposure:** All GitHub tokens and AI provider keys remain strictly on the server runtime.
2. **Resilience First:** Robust handling for unauthenticated rate limits (60 req/hr), token-authenticated requests (5,000 req/hr), 404s, empty repos, and large repositories.
3. **Progressive Enhancement & Streaming:** Immediate UI response with streaming AI summaries and progressive file tree loading.
4. **Pedagogical Clarity:** Clean separation of concerns with clear modular boundaries (GitHub client, AI service, parser, UI components).
