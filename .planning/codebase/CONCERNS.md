# Technical Concerns & Considerations

## Version & Ecosystem Considerations
- **Next.js 16.3.4 & React 19:** Bleeding-edge versions. Certain third-party React libraries may require `--legacy-peer-deps` or compatibility flags if they strictly pin React 18 peer dependencies.
- **Tailwind CSS v4:** Uses CSS-first configuration via `@import "tailwindcss";` rather than legacy `tailwind.config.js`. Ensure plugins and customizations follow v4 directives.

## Performance & Security
- **API Security:** Any future server routes dealing with external tokens or repository keys should ensure environment variables are server-only (`process.env.SECRET_...` not prefixed with `NEXT_PUBLIC_`).
- **Rate Limits:** If querying GitHub/external APIs, implement caching, token rotation, or rate limit handlers.
