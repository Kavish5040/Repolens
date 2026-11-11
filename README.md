# RepoLens

> **GitHub shows you a repository. RepoLens teaches you how it works.**

RepoLens is an AI-powered GitHub repository intelligence platform. Paste any public GitHub repository URL and instantly get a deep understanding of its architecture, codebase, and contribution pathways — without cloning a single file.

---

## Features

### Pillar A — File Tree Explorer
Interactive, searchable file tree backed by the GitHub Git Trees API. One-click access to README, CONTRIBUTING, LICENSE, and other key documents with syntax-highlighted code viewing.

### Pillar B — Repository Intelligence
Deterministic, evidence-based codebase analysis. Subsystem classification, technology signal detection (Next.js, React, Rust, Python, Go, Docker, CI/CD, and 20+ more), entry point ranking, and a "Where Should I Start?" onboarding guide — no AI hallucination, no guesswork.

### Pillar C — Ask RepoLens (AI)
Streaming, grounded natural-language Q&A powered by an OpenAI-compatible AI gateway. Hard context budgets (24k tokens, max 10 files, 4k chars/excerpt) prevent hallucination. Every `[file:path]` citation is validated against files actually supplied to the model.

### Pillar D — Contributor Mode
Discover `good first issue` and `help wanted` GitHub issues with transparent Contribution Readiness scoring (0–100), evidence-based difficulty badges, ranked candidate file localization, manifest-verified test runner commands, and a streaming AI contribution guide.

---

## Local Setup

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- An **OmniRoute** (or any OpenAI-compatible) AI gateway running locally or remotely
- *(Optional)* A GitHub Personal Access Token (PAT) for higher API rate limits

### 1. Clone the repository

```bash
git clone https://github.com/Kavish5040/Repolens.git
cd Repolens
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your values:

| Variable | Required | Description |
|---|---|---|
| `GITHUB_TOKEN` | Optional | GitHub PAT with `public_repo` scope. Raises limit from 60 → 5,000 req/hr. |
| `OMNIROUTE_BASE_URL` | Required for AI | Base URL of your OpenAI-compatible gateway (e.g. `http://127.0.0.1:20128/v1`) |
| `OMNIROUTE_API_KEY` | Required for AI | Gateway API key (can be any string for local gateways) |
| `OMNIROUTE_MODEL` | Required for AI | Model name (e.g. `auto/best-free` for OmniRoute auto-routing) |

> **Security:** `.env.local` is already listed in `.gitignore`. Never commit it. All secrets stay server-side — they are never exposed to the browser or AI request bodies.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Optional: GitHub Personal Access Token (PAT)

Without a `GITHUB_TOKEN`, RepoLens falls back to unauthenticated GitHub API (60 requests/hour per IP).
Adding a PAT raises the rate limit to **5,000 requests/hour**.

RepoLens supports both **Classic** and **Fine-grained** Personal Access Tokens:

### 1. Fine-grained Personal Access Token (`github_pat_...`) [Recommended by GitHub]
* **Repository access:** Set to **"Public Repositories (read-only)"** or select specific repositories you want to inspect.
* **Repository permissions:**
  * **Contents:** `Read-only` *(required to view code, tree, and commit history)*
  * **Metadata:** `Read-only` *(mandatory, set automatically by GitHub)*
  * **Issues:** `Read-only` *(optional — only needed for Contributor Mode / issues analysis)*
* **User permissions:** None required.
* **Generate:** [GitHub Fine-grained PAT Settings](https://github.com/settings/personal-access-tokens/new)

### 2. Classic Personal Access Token (`ghp_...`)
* **Scopes:** Select only the `public_repo` scope (read-only access to public repositories).
* No write or administration scopes are needed.
* **Generate:** [GitHub Classic PAT Settings](https://github.com/settings/tokens/new?scopes=public_repo&description=RepoLens)

### Supplying a Token in the Browser
Users can supply their token directly in the UI without server configuration:
1. Click **"Add token"** in the top-right header.
2. Enter your token (`ghp_...` or `github_pat_...`).
3. Click **"Verify & Save Token"** — RepoLens validates credentials against GitHub API before storing.

The token is stored exclusively in your browser's `localStorage` under `rl_github_pat`. It is **never** sent to the AI service, logged, or exposed in error messages. If a token expires or is invalid, RepoLens preserves your view and allows falling back to public repository access.

---

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm test` | Run all unit tests |
| `npx tsc --noEmit` | TypeScript type-check |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | ESLint |

---

## Deploying to Vercel

### One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Kavish5040/Repolens)

### Manual deploy

1. Push this repository to GitHub.
2. Import the project in [Vercel Dashboard](https://vercel.com/new).
3. Set the following **Environment Variables** in the Vercel project settings:

| Variable | Value |
|---|---|
| `GITHUB_TOKEN` | Your GitHub PAT (optional but recommended) |
| `OMNIROUTE_BASE_URL` | URL of your AI gateway |
| `OMNIROUTE_API_KEY` | Your gateway API key |
| `OMNIROUTE_MODEL` | Model name |

4. Click **Deploy**. Vercel auto-detects Next.js — no build command overrides needed.

> **Note:** AI features require `OMNIROUTE_BASE_URL` to be a publicly accessible URL when deployed on Vercel (not `localhost`).

---

## Architecture Overview

```
Browser (Next.js client)
  │
  ├── GitHub API requests → /api/repo/* (server-side)
  │     ├── Uses x-github-token header (browser PAT, if set)
  │     └── Falls back to GITHUB_TOKEN env var
  │
  └── AI requests → /api/repo/ai/* (server-side)
        └── Forwards to OMNIROUTE_BASE_URL (OpenAI-compatible)
              └── OMNIROUTE_API_KEY + OMNIROUTE_MODEL (server-only)
```

**Key security invariants:**
- `GITHUB_TOKEN` and `OMNIROUTE_*` are read **only** in server-side API routes
- Browser PAT is **never** forwarded to the AI gateway
- No secrets appear in `NEXT_PUBLIC_*` variables or client bundles

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **AI:** Provider-agnostic (OpenAI-compatible gateway via OmniRoute)
- **Data:** GitHub REST API v3 (no GraphQL, no webhooks)
- **Testing:** Node.js built-in test runner (`node:test`)

---

## License

MIT
