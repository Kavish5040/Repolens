# Roadmap: RepoLens

## Milestone 1: Production GitHub Intelligence & Exploration Platform

---

### [x] Phase 1: Foundation, GitHub API Layer & Repository Overview
*Deliverable: A working, polished landing page and live repository overview dashboard with robust error and rate-limit handling.*
- [x] **1.1 URL Parser & Validator:** Utility to parse and normalize any GitHub URL (`https://github.com/owner/repo`, `github.com/owner/repo`, `owner/repo`) with edge case protection.
- [x] **1.2 Resilient GitHub API Client:** Server-side API wrapper handling repository metadata, languages, latest commits, and rate limit telemetry (`x-ratelimit-remaining`, `x-ratelimit-reset`).
- [x] **1.3 UI Shell & State Architecture:** Polished dark-mode-first dashboard layout with robust states (loading skeleton, 404 error, rate limit banner, empty state).
- [x] **1.4 Repository Overview Component:** High-polish summary cards displaying stats, language distribution bar, and latest commit info.

---

### [x] Phase 2: Live File Tree Explorer & Key Documents Hub (Pillar A)
*Deliverable: Interactive, searchable file tree backed by real GitHub Git Trees API with automated key document detection and formatted document/code inspection.*
- [x] **2.1 Tree & File Content Domain Models:** Strict TypeScript interfaces for `GitTreeItemDto`, `TreeNode` (nested hierarchy with sizes/child counts), `FileContentData`, and `KeyDocument` definitions.
- [x] **2.2 Git Trees & File Content API Client:** Server-side fetchers for `/git/trees/{sha}?recursive=1` and `/contents/{path}` with base64 decoding, file type detection, and size guardrails.
- [x] **2.3 Hierarchy Builder & Key Document Detector:** Pure algorithms to transform flat Git tree items into a sorted nested tree and identify critical onboarding/manifest files (`README`, `CONTRIBUTING`, `LICENSE`, `package.json`, `Cargo.toml`).
- [x] **2.4 Explorer API Route Handlers:** Server endpoints `GET /api/repo/tree` and `GET /api/repo/content` with ISR caching and rate-limit telemetry.
- [x] **2.5 Interactive File Tree UI:** Searchable, collapsible directory tree with real-time path filtering, file-type icons, size badges, and breadcrumbs.
- [x] **2.6 Document & Code Viewer UI:** Split-pane layout with 1-click Quick Access tabs for Key Documents (`README`, `CONTRIBUTING`), formatted Markdown rendering, and syntax-highlighted code inspection.

---

### [x] Phase 3: Repository Intelligence & "Where Should I Start?" Guide (Pillar B)
*Deliverable: Intelligent repository topology, subsystem classification, and newcomer onboarding guide.*
- [x] **3.1 Subsystem & Topology Classifier:** Deterministic heuristic analysis to classify directory roles (application, components, source, tests, docs, tooling, config, infra, monorepo workspaces) and detect technology signals (Next.js, React, FastAPI, Django, Vite, Tailwind, Rust, Python, Go, Java, Jest, Vitest, Playwright, Pytest, GitHub Actions, Docker, ESLint, Prettier) with observable evidence.
- [x] **3.2 "Where Should I Start?" Guide:** Computed sequential reading order and ranked entry point candidate detection with signal confidence and 1-click navigation to inspect files/folders in the explorer.
- [x] **3.3 Architecture Breakdown View:** Responsive dashboard tab with structural insights banner (documentation, testing, CI/CD, monorepo, scale), onboarding sequence card, tech signals grid, entry points list, and structural topology matrix.

---

### [x] Phase 4: AI Intelligence & "Ask RepoLens" Grounded Q&A (Pillar C)
*Deliverable: Bounded AI-powered codebase summary and interactive natural-language Q&A grounded in repository files with validated citations.*
- [x] **4.1 Context Packager & Hard Budgets:** Bounded context packager enforcing hard ceilings (24k tokens, max 10 files, 4k chars/file excerpt, 6-turn history cap) with distinct Summary vs. Chat context strategies.
- [x] **4.2 AI Repository Summary:** Streaming AI-generated summary covering project purpose, system design, key subsystems, tooling observations, and engineering caveats.
- [x] **4.3 "Ask RepoLens" Interactive Chat & Citations:** Conversational interface with streaming responses, suggested questions, explicit uncertainty enforcement, and citation validation (`[file:path]`) with 1-click navigation to the File Explorer.

---

### [x] Phase 5: Open Source Contributor Mode (Pillar D)
*Deliverable: Contributor discovery, issue recommendation engine, and guided contribution pathways.*
- [x] **5.1 Contributor Issue Recommender:** GitHub Issues API integration filtering for `good first issue` / `help wanted` with transparent difficulty badges and readiness score (0–100).
- [x] **5.2 Issue Requirement Analyzer:** AI breakdown of what an issue requires, root cause explanation, and testable acceptance criteria.
- [x] **5.3 Subsystem & File Localization:** Evidence-based candidate file ranking (`High`, `Medium`, `Low`) with 1-click jump to the File Explorer.
- [x] **5.4 Guided Contribution Pathway:** Actionable step-by-step checklist, manifest-verified test runner commands, and PR submission tips.

---

### [x] Phase 6: Hardening, Rate-Limit PAT Override & Deployment
*Deliverable: Production-ready tool deployed on Vercel with optional client PAT support.*
- [x] **6.1 User PAT Setting:** Optional client-provided GitHub Personal Access Token (stored only in browser localStorage, never sent to AI service) with format validation, masked display, security disclosure, and clear INVALID_PAT error handling.
- [x] **6.2 End-to-End Verification:** All 7 API routes handle 401 → INVALID_PAT. All error states (NOT_FOUND, RATE_LIMITED, INVALID_PAT, NETWORK_ERROR) have dedicated UI variants. ErrorBanner and RateLimitBanner updated with PAT-aware messaging.
- [x] **6.3 Production Build & Vercel Prep:** 52/52 tests pass, tsc --noEmit clean, npm run build succeeds. vercel.json created. .env.example improved. README fully rewritten with setup, deployment, and security documentation. poweredByHeader: false in next.config.ts.
