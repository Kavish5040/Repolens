# Project State: RepoLens

## Current Position
- **Milestone:** Milestone 1 (Production GitHub Intelligence & Exploration Platform)
- **Active Phase:** Phase 3 Complete ➔ Ready for Phase 4: AI Intelligence & "Ask RepoLens" Grounded Q&A (Pillar C)
- **Phase 3 Status:** Complete (Deterministic Repository Intelligence Engine, Directory Topology Classifier, Technology Signal Detector, Ranked Entry-Point Evaluator, Guided "Where Should I Start?" Onboarding Pipeline, Reading Order, Structural Insights Banner, and Intelligence Dashboard UI with 1-click explorer cross-linking built and verified with 25 unit/integration tests).

## Key Architectural Decisions
1. **Full Real-World Integration:** Zero mock data. Real GitHub REST & Git Trees APIs with robust error/rate-limit handling.
2. **Deterministic Intelligence Layer:** Pure, evidence-backed classification algorithms run safely across trees up to 50,000+ items without full-file downloads.
3. **Evidence-Backed Signals:** Every structural classification, framework detection, and entry point recommendation exposes concrete, observable path/file signals.
4. **Security Isolation:** GitHub tokens and AI provider keys remain strictly on the server runtime.
5. **Resilient State Handling:** First-class support for loading skeletons, 404s, 403 rate limits with live countdowns, and empty states.
6. **No Premature AI/Contributor Execution:** Phase 3 established pure deterministic structural intelligence without LLM overhead or contributor ranking.

## Next Step
- Plan Phase 4: AI Intelligence & "Ask RepoLens" Grounded Q&A (Pillar C).
