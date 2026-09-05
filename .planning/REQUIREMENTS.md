# Requirements: RepoLens

## 1. Functional Requirements

### FR-01: Repository Input & URL Parser
- Accept full GitHub URLs (`https://github.com/owner/repo`, `github.com/owner/repo`) or shorthand format (`owner/repo`).
- Validate and normalize inputs; support branch selection where applicable (defaulting to the repository's default branch).

### FR-02: Repository Overview
- Fetch live metadata via GitHub API:
  - Repository name, description, topics/tags, license.
  - Star count, fork count, watcher count, open issues.
  - Primary languages and percentage breakdown.
  - Default branch, latest commit timestamp, author, and commit message.

### FR-03: Live Repository File & Directory Tree
- Fetch and display the actual repository file tree using GitHub Git Trees API (`recursive=1`).
- Provide collapsible directory navigation, search/filter by filename, and file-type icons.
- Support viewing file contents (e.g. README.md, `package.json`, configuration files) directly in the dashboard with syntax formatting.

### FR-04: Architectural Connection Breakdown
- Identify how major components connect (e.g., frontend routing, backend API routes, database models, configuration layers).
- Detect framework conventions (e.g., Next.js, Vite, Django, Express, Rails) to surface key entry points.

### FR-05: "Where Should I Start?" Onboarding Guide
- Provide a curated "start here" pathway for developers new to the codebase.
- Highlight:
  - Key entry point files (e.g. `main.ts`, `app/page.tsx`, `src/index.js`).
  - Recommended reading order.
  - Essential configuration files (`package.json`, `tsconfig.json`, `.env.example`, `Dockerfile`).

### FR-06: AI Repository Summary & Engineering Observations
- Synthesize an AI analysis based on README, file tree, package manifests, and architectural structure.
- Generate:
  - High-level purpose & problem domain.
  - Architecture and design pattern observations.
  - Codebase maturity & quality observations (testing presence, CI/CD, documentation status).

### FR-07: "Ask the Repository" Interactive Q&A
- Interactive conversational interface allowing users to ask natural-language questions about the repository (e.g., *"How does authentication work in this project?"*, *"Where are API requests handled?"*).
- Ground AI answers in retrieved repo context (README, file manifests, directory map, key files).

### FR-08 (Future / Post-V1): Visual Architecture Map & Repo Comparison
- Interactive node-edge visual graph of directories and module connections.
- Side-by-side repository comparison (e.g. comparing two similar libraries or frameworks).

---

## 2. Non-Functional & Resilience Requirements

### NFR-01: Robust Error & State Handling
- **Loading States:** Skeleton screens and progressive indicators during GitHub API and AI streaming.
- **Empty States:** Clear messaging for brand-new or empty repositories.
- **404 / Invalid URL:** Friendly guidance when a repository is private, deleted, or mistyped.
- **Rate Limit Handling:** Dedicated UI for GitHub API rate limit exhaustion (HTTP 403) showing reset time and an optional user personal access token (PAT) input stored securely in session/client memory for higher rate limits.

### NFR-02: Security & Zero Secret Exposure
- Server-side environment variables (`GITHUB_TOKEN`, `AI_API_KEY`) must never be leaked to client bundles or browser responses.

### NFR-03: Performance & Caching
- Utilize Next.js App Router caching (`fetch` cache tags / revalidation) to prevent duplicate API hits for the same repository tree within short windows.

### NFR-04: UI/UX & Aesthetics
- Sleek, modern, dark-mode-first developer UI using Tailwind CSS v4.
- High visual polish with responsive desktop/tablet/mobile layouts.
