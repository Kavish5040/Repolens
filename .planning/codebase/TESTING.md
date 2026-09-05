# Testing Infrastructure & Strategy

## Current Status
- No automated test framework (e.g. Vitest, Jest, Playwright) is currently installed in `package.json`.
- Static analysis and linting are performed via ESLint (`npm run lint`).
- Type verification is provided by `tsc` via Next.js build (`npm run build`).

## Recommended Testing Strategy
- **Unit / Component Testing:** Setup Vitest or Jest with React Testing Library for component unit tests.
- **E2E Testing:** Playwright for critical user workflow and browser verification.
- **Type / Lint Checks in CI:** Run `npm run lint` and `npm run build` as pre-commit / PR checks.
