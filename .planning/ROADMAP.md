# Roadmap: RepoLens

## Milestone 1: Production GitHub Intelligence Dashboard

---

### [ ] Phase 1: Foundation, GitHub API Layer & Repository Overview
*Deliverable: A working, polished landing page and live repository overview dashboard with robust error and rate-limit handling.*
- **1.1 URL Parser & Validator:** Utility to parse and normalize any GitHub URL (`https://github.com/owner/repo`, `github.com/owner/repo`, `owner/repo`) with edge case protection.
- **1.2 Resilient GitHub API Client:** Server-side API wrapper handling repository metadata, languages, latest commits, and rate limit telemetry (`x-ratelimit-remaining`, `x-ratelimit-reset`).
- **1.3 UI Shell & State Architecture:** Polished dark-mode-first dashboard layout with robust states:
  - Input bar with quick-try example repos.
  - Loading skeleton states.
  - Error states (404 Not Found, Invalid URL, Empty Repo).
  - Rate Limit banner with live countdown to reset.
- **1.4 Repository Overview Component:** High-polish summary cards displaying stats (stars, forks, open issues, license, default branch), language distribution bar, and latest commit info.

---

### [ ] Phase 2: Live File Tree Explorer & File Viewer
*Deliverable: Interactive, searchable file tree backed by real GitHub Git Trees API with live file inspection.*
- **2.1 Recursive Tree Fetcher:** Fetch full repository tree via GitHub Git Trees API (`recursive=1`) with depth handling and caching.
- **2.2 File Tree UI Component:** Collapsible folders, file type icons, path filtering/search, and file size badges.
- **2.3 File Content Viewer:** In-app preview for selected files (e.g., `README.md`, `package.json`, configuration files) with formatted markdown and syntax highlighting.

---

### [ ] Phase 3: Architectural Piece Connections & "Where Should I Start?" Guide
*Deliverable: Intelligent repository topology and newcomer onboarding guide.*
- **3.1 Topology & Archetype Detector:** Heuristic analysis to identify framework/ecosystem (Next.js, Node, Python, Rust, Go, monorepo) and directory roles (frontend, backend, db, config, assets).
- **3.2 "Where Should I Start?" Guide:** Computed reading order, key entry point files, and environment setup checklist for developers onboarding to the codebase.
- **3.3 Architecture Breakdown View:** Visual representation of project layers and entry points.

---

### [ ] Phase 4: AI Intelligence & "Ask the Repository"
*Deliverable: AI-powered codebase summary and interactive natural-language Q&A.*
- **4.1 Context Packager:** Server-side engine to build token-efficient repository context from README, tree structure, package manifests, and entry files.
- **4.2 AI Repository Summary:** Streaming AI-generated summary covering project purpose, architectural design patterns, code quality, and engineering observations.
- **4.3 "Ask the Repository" Chat:** Interactive chat interface with streaming responses allowing users to ask specific questions about the codebase.

---

### [ ] Phase 5: Hardening, Rate-Limit PAT Override & Deployment
*Deliverable: Production-ready tool deployed on Vercel with optional client PAT support.*
- **5.1 User PAT Setting:** Optional client-provided GitHub Personal Access Token (stored only in browser localStorage) to grant 5,000 req/hr rate limits for heavy users.
- **5.2 End-to-End Verification:** Comprehensive testing of all error boundaries, responsiveness, and performance.
- **5.3 Production Build & Vercel Prep:** Lint verification, TypeScript check, and deployment configuration.
