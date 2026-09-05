# Integrations & External Services: RepoLens

## 1. GitHub REST & Git Data APIs
- **Endpoint:** `https://api.github.com`
- **Authentication:**
  - Unauthenticated requests: 60 requests/hour per IP address.
  - Optional server `GITHUB_TOKEN` in `.env.local`: 5,000 requests/hour.
  - Optional client-provided PAT: Sent via request headers from client localStorage if configured by user.
- **Key Endpoints Used:**
  - `GET /repos/{owner}/{repo}`: Repository metadata (stars, forks, open issues, description, default branch, license).
  - `GET /repos/{owner}/{repo}/languages`: Language byte breakdown.
  - `GET /repos/{owner}/{repo}/commits`: Latest commits and author info.
  - `GET /repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=1`: Full recursive directory/file tree.
  - `GET /repos/{owner}/{repo}/contents/{path}` or raw content: Specific file inspection (README, package.json).
- **Rate Limit Tracking:**
  - Headers: `x-ratelimit-limit`, `x-ratelimit-remaining`, `x-ratelimit-reset`.

## 2. AI Intelligence Provider (Phase 4)
- **Candidate Providers:** Google Gemini API (via `@google/genai` or Vercel AI SDK) or OpenAI/Anthropic.
- **Invocation Pattern:** Next.js Route Handler (`/api/ai/...`) with server-side streaming responses.
- **Security:** AI API Key stored strictly in server environment variables (`GEMINI_API_KEY`), never exposed to browser.

## 3. Deployment Target
- **Platform:** Vercel
- **Edge / Node Runtime:** Node.js server runtime for Next.js App Router API route handlers.
