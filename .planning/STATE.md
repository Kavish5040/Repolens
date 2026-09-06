# Project State: RepoLens

## Current Position
- **Milestone:** Milestone 1 — ✅ COMPLETE
- **Active Phase:** All Phases 1–6 Complete
- **Phase 6 Status:** Complete (optional GitHub PAT override with localStorage storage and security disclosure, GitHubAuthError for INVALID_PAT 401 handling across all 7 API routes, INVALID_PAT ErrorBanner variant, PAT-aware RateLimitBanner, vercel.json, improved .env.example, full README rewrite, poweredByHeader: false, 52/52 tests passing, tsc clean, production build verified).

## Key Architectural Decisions
1. **Full Real-World Integration:** Zero mock data. Real GitHub REST & Git Trees APIs with robust error/rate-limit handling.
2. **Deterministic Intelligence Layer:** Pure, evidence-backed classification algorithms run safely across trees up to 50,000+ items without full-file downloads.
3. **Bounded Context Grounding (No Vector DB):** Hard-budget context packing (24k tokens, max 10 files, 4k chars/file excerpt, 6-turn chat history) without full vector RAG or external embeddings dependencies.
4. **Citation Validation Decoupled:** Citation parsing and validation against supplied files is purely isolated from AI transport.
5. **Security Isolation:** GitHub tokens and AI keys remain strictly on the server runtime. Browser PAT stored only in localStorage, never forwarded to OmniRoute.
6. **Resilient State Handling:** First-class support for loading skeletons, 404s, 403 rate limits with live countdowns, 401 INVALID_PAT with Clear Token CTA, and missing API key instructions.
7. **Optional Browser PAT:** Users can supply their own GitHub PAT (stored in localStorage) for 5,000 req/hr. Format-validated client-side, runtime-validated via GitHubAuthError on 401.

## Next Step
- Milestone 1 is complete. Ready for Vercel deployment.
- Optional: Begin Milestone 2 planning (vector RAG, advanced search, team features).
