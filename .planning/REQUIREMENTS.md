# Requirements: RepoLens

## 1. Pillar A: Repository Explorer (Foundation)

### REQ-A1: Repository URL Parsing & Overview
- Accept and normalize any GitHub URL (`https://github.com/owner/repo`, `owner/repo`, deep links, `.git` suffix).
- Fetch and display live metadata: stars, forks, watchers, open issues, license, default branch, primary languages breakdown, and latest commit info with relative timestamp. *(Implemented in Phase 1)*

### REQ-A2: Recursive File Tree Fetcher & Hierarchy Builder
- Query GitHub Git Trees API (`GET /repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=1`) to fetch full repository tree metadata.
- Transform flat GitHub tree items (`path`, `type`, `size`, `sha`) into a sorted nested tree structure (`TreeNode`) with directory child counts and aggregated folder sizes.
- Handle deep paths, hidden files (`.github`, `.env.example`), and prevent UI crashes on massive repositories (>10,000 files).

### REQ-A3: Key Project Documents Auto-Detection
- Automatically identify, categorize, and badge critical project documents from the tree:
  - **Onboarding & Community:** `README.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `LICENSE`.
  - **Architecture & Design:** `ARCHITECTURE.md`, `DESIGN.md`, `docs/`, `RFCs`.
  - **Package & Build Manifests:** `package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`, `pom.xml`, `Dockerfile`.
- Provide 1-click Quick Access tabs to view these documents immediately.

### REQ-A4: Safe File Content Fetching & Decoding
- Fetch file content on demand via GitHub Contents API or raw content endpoints.
- Provide safe Base64 decoding, UTF-8 normalization, and size guardrails (preventing client freeze on large binaries or lockfiles).
- Detect file type/format: Markdown, TypeScript/JavaScript, Python, Rust, Go, JSON/YAML/TOML, Shell, Plain Text, or Binary/Image.

### REQ-A5: Split-Pane Explorer & Document Viewer UI
- **Left Pane:** Searchable, collapsible directory tree with real-time path filtering, file-type icons, and breadcrumb navigation.
- **Right Pane:** Document and code viewer with formatted Markdown rendering (GitHub-flavored styling) and syntax-highlighted code inspection.
- Synchronize active file view with URL state (`/?repo=owner/repo&file=path/to/file.ts`).

---

## 2. Pillar B: Repository Intelligence (Phase 3)

### REQ-B1: Subsystem & Topology Analysis
- Automatically classify directory roles (`frontend`, `backend`, `api`, `database`, `config`, `assets`, `tests`, `docs`).
- Map high-level module connections and architecture patterns.

### REQ-B2: "Where Should I Start?" Onboarding Guide
- Algorithmic reading order for new developers.
- Highlight key entry points (e.g. `main.ts`, `app/page.tsx`, `index.js`, `src/lib.rs`).
- Environment prerequisites and configuration checklist (`.env.example`, build scripts).

---

## 3. Pillar C: Ask RepoLens (Phase 4)

### REQ-C1: Grounded AI Repository Summary
- Streaming AI analysis covering domain, architecture patterns, tech stack, and engineering observations.

### REQ-C2: Interactive Conversational Q&A
- Interactive chat grounded in repository context (README, package manifests, tree structure, key source files).
- Cites specific files and code references.

---

## 4. Pillar D: Open Source Contributor Mode (Phase 5+)

### REQ-D1: Repository Discovery & Fit Matching
- Match developers to repositories based on programming language, domain, and experience.

### REQ-D2: Issue Recommendation & Skill Tagging
- Fetch open issues labeled `good first issue`, `help wanted`, `bug`, or `enhancement`.
- Filter and recommend issues based on contributor skill level and interests.

### REQ-D3: Issue Requirement Analysis & Subsystem Localization
- AI-assisted explanation of issue requirements and acceptance criteria.
- Identification of likely files and subsystems that need modification to resolve the issue.

### REQ-D4: Guided Contribution Pathway
- Step-by-step contribution checklist: setup reproduction test, code modification guidelines, test verification, and PR template guidance.

---

## 5. Non-Functional & Resilience Requirements
- **NFR-01: Resilience First:** Complete state handling (Loading skeleton, Empty state, 404 Not Found, 403 Rate Limit with live countdown timer).
- **NFR-02: Zero Secret Exposure:** GitHub tokens and AI keys strictly isolated to the server runtime.
- **NFR-03: Performance & Caching:** Next.js ISR caching (`revalidate: 60`) on GitHub API calls.
- **NFR-04: Strict Typing & Test Coverage:** 100% TypeScript strict mode; verified with Node native unit and integration tests.
