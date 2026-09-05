# Project State: RepoLens

## Current Position
- **Milestone:** Milestone 1 (Production GitHub Intelligence Dashboard)
- **Active Phase:** Ready for Phase 1 (Foundation, GitHub API Layer & Repository Overview)
- **Status:** Planning artifacts aligned with product vision; no code written yet.

## Key Architectural Decisions
1. **Full Real-World Integration:** No mock data. Live GitHub REST API for repo info and Git Trees API for file structures.
2. **Security Isolation:** GitHub tokens (if configured on server) and AI API keys exist purely on the server side in Next.js Server Components / Route Handlers.
3. **State Completeness:** Loading, empty, 404, rate-limit (403), and error states must be first-class citizens in every component.
4. **Learning & Interview Focus:** Architecture choices, Next.js server/client boundaries, caching strategies, and resilience patterns will be explained at every step.

## Next Step
- Plan and execute Phase 1: URL parser, GitHub API client, UI shell, and Repository Overview dashboard.
