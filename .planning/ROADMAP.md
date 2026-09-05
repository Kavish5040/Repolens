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

### [ ] Phase 2: Live File Tree Explorer & Key Documents Hub (Pillar A)
*Deliverable: Interactive, searchable file tree backed by real GitHub Git Trees API with automated key document detection and formatted document/code inspection.*
- **2.1 Tree & File Content Domain Models:** Strict TypeScript interfaces for `GitTreeItemDto`, `TreeNode` (nested hierarchy with sizes/child counts), `FileContentData`, and `KeyDocument` definitions.
- **2.2 Git Trees & File Content API Client:** Server-side fetchers for `/git/trees/{sha}?recursive=1` and `/contents/{path}` with base64 decoding, file type detection, and size guardrails.
- **2.3 Hierarchy Builder & Key Document Detector:** Pure algorithms to transform flat Git tree items into a sorted nested tree and identify critical onboarding/manifest files (`README`, `CONTRIBUTING`, `LICENSE`, `package.json`, `Cargo.toml`).
- **2.4 Explorer API Route Handlers:** Server endpoints `GET /api/repo/tree` and `GET /api/repo/content` with ISR caching and rate-limit telemetry.
- **2.5 Interactive File Tree UI:** Searchable, collapsible directory tree with real-time path filtering, file-type icons, size badges, and breadcrumbs.
- **2.6 Document & Code Viewer UI:** Split-pane layout with 1-click Quick Access tabs for Key Documents (`README`, `CONTRIBUTING`), formatted Markdown rendering, and syntax-highlighted code inspection.

---

### [ ] Phase 3: Repository Intelligence & "Where Should I Start?" Guide (Pillar B)
*Deliverable: Intelligent repository topology, subsystem classification, and newcomer onboarding guide.*
- **3.1 Subsystem & Topology Classifier:** Heuristic analysis to identify framework/archetype (Next.js, Node, Python, Rust, Go, monorepo) and directory roles (frontend, backend, db, config, assets).
- **3.2 "Where Should I Start?" Guide:** Computed reading order, key entry point files, and environment setup checklist for developers onboarding to the codebase.
- **3.3 Architecture Breakdown View:** Visual representation of project layers and entry points.

---

### [ ] Phase 4: AI Intelligence & "Ask RepoLens" Grounded Q&A (Pillar C)
*Deliverable: AI-powered codebase summary and interactive natural-language Q&A grounded in repository files.*
- **4.1 Context Packager:** Server-side engine to build token-efficient repository context from README, tree structure, package manifests, and entry files.
- **4.2 AI Repository Summary:** Streaming AI-generated summary covering project purpose, architectural design patterns, code quality, and engineering observations.
- **4.3 "Ask RepoLens" Interactive Chat:** Conversational interface with streaming responses and file/line citation evidence.

---

### [ ] Phase 5: Open Source Contributor Mode (Pillar D)
*Deliverable: Contributor discovery, issue recommendation engine, and guided contribution pathways.*
- **5.1 Contributor Issue Recommender:** GitHub Issues API integration filtering for `good first issue` / `help wanted` by skill level and language.
- **5.2 Issue Requirement Analyzer:** AI breakdown of what an issue requires and technical prerequisites.
- **5.3 Subsystem & File Localization:** Mapping issue scope to relevant repository files and subsystems.
- **5.4 Guided Contribution Pathway:** Actionable step-by-step checklist for reproducing, testing, and submitting a pull request.

---

### [ ] Phase 6: Hardening, Rate-Limit PAT Override & Deployment
*Deliverable: Production-ready tool deployed on Vercel with optional client PAT support.*
- **6.1 User PAT Setting:** Optional client-provided GitHub Personal Access Token (stored only in browser localStorage) to grant 5,000 req/hr rate limits for heavy users.
- **6.2 End-to-End Verification:** Comprehensive testing of all error boundaries, responsiveness, and performance.
- **6.3 Production Build & Vercel Prep:** Lint verification, TypeScript check, and deployment configuration.
