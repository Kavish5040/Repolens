# Project State: RepoLens

## Current Position
- **Milestone:** Milestone 1 (Production GitHub Intelligence & Exploration Platform)
- **Active Phase:** Phase 5 Complete ➔ Ready for Phase 6: Hardening, Rate-Limit PAT Override & Deployment
- **Phase 5 Status:** Complete (GitHub Issues API integration, transparent Contribution Readiness scoring 0–100, evidence-based difficulty badges, ranked candidate file localization, manifest-verified test runner commands, streaming AI guidance, and interactive Contributor Mode dashboard tab).

## Key Architectural Decisions
1. **Full Real-World Integration:** Zero mock data. Real GitHub REST & Git Trees APIs with robust error/rate-limit handling.
2. **Deterministic Intelligence Layer:** Pure, evidence-backed classification algorithms run safely across trees up to 50,000+ items without full-file downloads.
3. **Bounded Context Grounding (No Vector DB):** Hard-budget context packing (24k tokens, max 10 files, 4k chars/file excerpt, 6-turn chat history) without full vector RAG or external embeddings dependencies.
4. **Citation Validation Decoupled:** Citation parsing and validation against supplied files is purely isolated from Gemini transport.
5. **Security Isolation:** GitHub tokens and Gemini AI keys remain strictly on the server runtime.
6. **Resilient State Handling:** First-class support for loading skeletons, 404s, 403 rate limits with live countdowns, and missing API key instructions.

## Next Step
- Plan Phase 5: Open Source Contributor Mode (Pillar D - Issue discovery, requirement analyzer, and guided contribution pathway).
