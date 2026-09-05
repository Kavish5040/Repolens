# Project State: RepoLens

## Current Position
- **Milestone:** Milestone 1 (Production GitHub Intelligence & Exploration Platform)
- **Active Phase:** Ready for Phase 2: Live File Tree Explorer & Key Documents Hub (Pillar A)
- **Phase 1 Status:** Complete (URL parser, GitHub API client, overview API route, and polished overview dashboard built, tested, and verified).
- **Scope Alignment:** Planning documents fully updated to capture the 4 Product Pillars (Explorer, Intelligence, Ask RepoLens, Contributor Mode).

## Key Architectural Decisions
1. **Full Real-World Integration:** Zero mock data. Real GitHub REST & Git Trees APIs with robust error/rate-limit handling.
2. **Data Layer First:** Build pure transformation algorithms (flat-to-nested tree builder, key doc detector) with unit tests before building UI.
3. **Security Isolation:** GitHub tokens and AI provider keys remain strictly on the server runtime.
4. **Resilient State Handling:** First-class support for loading skeletons, 404s, 403 rate limits with live countdowns, and empty states.
5. **No Premature AI/Contributor Execution:** Phase 2 focuses purely on the repository exploration and data foundation that later features will depend on.

## Next Step
- Create the implementation plan for Phase 2 (Tree & Content Models, Git Trees API Client, Hierarchy Builder & Key Doc Detector, Explorer API Routes, File Tree UI, Document Viewer).
