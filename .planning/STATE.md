# Project State: RepoLens

## Current Position
- **Milestone:** Milestone 1 (Production GitHub Intelligence & Exploration Platform)
- **Active Phase:** Phase 2 Complete ➔ Ready for Phase 3: Repository Intelligence & "Where Should I Start?" Guide (Pillar B)
- **Phase 2 Status:** Complete (Recursive Git tree, flat-to-nested tree transformation, Key Documents auto-detector, safe Base64 file decoding, split-pane FileTree UI, Markdown/Code viewer, and tab switcher built and verified).

## Key Architectural Decisions
1. **Full Real-World Integration:** Zero mock data. Real GitHub REST & Git Trees APIs with robust error/rate-limit handling.
2. **Data Layer First:** Build pure transformation algorithms (flat-to-nested tree builder, key doc detector) with unit tests before building UI.
3. **Security Isolation:** GitHub tokens and AI provider keys remain strictly on the server runtime.
4. **Resilient State Handling:** First-class support for loading skeletons, 404s, 403 rate limits with live countdowns, and empty states.
5. **No Premature AI/Contributor Execution:** Phase 2 focuses purely on the repository exploration and data foundation that later features will depend on.

## Next Step
- Create the implementation plan for Phase 2 (Tree & Content Models, Git Trees API Client, Hierarchy Builder & Key Doc Detector, Explorer API Routes, File Tree UI, Document Viewer).
