# Project: RepoLens

## Overview
**RepoLens** is an AI-powered GitHub Repository Intelligence and Open Source Contributor platform.

RepoLens goes far beyond basic statistics (stars, forks, commit counts) to help developers:
1. **Understand unfamiliar codebases rapidly.**
2. **Navigate complex repository architecture and piece connections.**
3. **Ask technical questions grounded in the repository's actual code and structure.**
4. **Discover open-source repositories and contribution-worthy issues matched to their skills and interests.**
5. **Get guided contribution pathways with subsystem and file-level guidance.**

---

## The Four Core Product Pillars

### Pillar A: Repository Explorer (Foundation)
- **Recursive File & Directory Tree:** Fast, interactive tree navigation powered by GitHub Git Trees API.
- **File Search & Filtering:** Instant path and filename search across the entire codebase.
- **Key Project Documents Hub:** Automated detection, badging, and 1-click preview of critical onboarding documents (`README.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `LICENSE`, `SECURITY.md`, and package manifests).
- **Document & Code Viewer:** Formatted Markdown rendering and syntax-highlighted code inspection.

### Pillar B: Repository Intelligence
- **Architectural Topology:** Understand how major pieces connect (frontend, backend, API routes, database models, configuration layers).
- **Subsystem Identification:** Automatically identify core subsystems and directory roles (`src/`, `packages/`, `app/`, `docs/`, `tests/`).
- **"Where Should I Start?" Onboarding Guide:** Curated reading order, entry points, and environment setup checklist for developers new to the project.

### Pillar C: Ask RepoLens
- **Conversational Repository Q&A:** Natural language chat allowing developers to query the codebase (e.g. *"How does authentication work?"*, *"Where are API requests handled?"*).
- **Grounded Context Engine:** Answers grounded in actual repository structure, READMEs, package manifests, and relevant source files.
- **File-Level Evidence:** Cites specific files and line references to substantiate answers.

### Pillar D: Open Source Contributor Mode
- **Repository Discovery:** Match developers with suitable open-source projects based on language, domain, and experience.
- **Issue Recommendation Engine:** Find good first issues and contribution opportunities filtered by skill level and interest.
- **Issue Requirement Breakdown:** AI analysis explaining what an issue asks for and what technical prerequisites are needed.
- **Subsystem & File Localization:** Pinpoint the exact subsystems and files relevant to resolving an issue.
- **Guided Contribution Pathways:** Step-by-step guidance on reproducing, implementing, testing, and submitting a pull request.

---

## Core Tech Stack
- **Framework:** Next.js 16 (App Router with React Server Components & Route Handlers)
- **UI & Styling:** React 19, TypeScript (Strict Mode), Tailwind CSS v4
- **Integrations:** GitHub REST & Git Data APIs, AI API (Google Gemini / Vercel AI SDK)
- **Deployment:** Vercel

---

## Key Architectural Principles
1. **Zero Client Secret Exposure:** All GitHub tokens and AI provider keys remain strictly on the server runtime.
2. **Resilience First:** Robust handling for rate limits (unauthenticated 60 req/hr, authenticated 5,000 req/hr), 404s, empty repos, and large repositories.
3. **Data Layer First & Incremental Slices:** Build modular data foundations before assembling UI.
4. **Pedagogical Clarity:** Clean separation of concerns with clear modular boundaries, making the codebase maintainable and interview-grade.
