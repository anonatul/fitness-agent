# Deployment

This is intentionally a single-user deployment: one Node API instance, one managed PostgreSQL database, and a static frontend. A low-cost Render web service plus managed Postgres and Vercel static hosting are sufficient; no Redis or worker is needed.

## Backend

`render.yaml` defines the backend commands. Set these server-side environment variables before enabling deployment:

- `DATABASE_URL`
- `AGENTROUTER_API_KEY`, `AGENTROUTER_BASE_URL`, `AGENT_MODEL`
- `ATHLETE_ID` (a private stable value such as `personal-athlete`)
- `AUTH_PASSWORD`
- `AUTH_SESSION_SECRET` (generate with `openssl rand -base64 32`)
- `FRONTEND_ORIGINS` (the exact deployed frontend URL; comma-separate additional origins)
- `COOKIE_SECURE=true`

Optional: `PORT` is supplied by the host, and `CHAT_RATE_LIMIT`, `CHAT_RATE_WINDOW_MS`, `AGENT_HISTORY_DAYS`, `CONTEXT_MAX_CHARS`, and `AGENT_MAX_TOOL_ROUNDS` have safe defaults.

The host runs `npm run db:deploy` before each release. It applies committed Prisma migrations without creating new ones. `/health` only confirms the process is running; `/health/ready` returns 503 until database, AgentRouter, and authentication configuration are all available.

## Frontend

Deploy `frontend/` as a static Vercel project using `frontend/vercel.json` (or any static host with `npm run build` and `dist/`). Set only `VITE_API_BASE_URL` to the public API URL. Do not define secrets in frontend variables.

Add the resulting exact frontend URL to backend `FRONTEND_ORIGINS`, then use HTTPS for both services. The app login sets an HttpOnly session cookie; the athlete ID, database URL, and AgentRouter key never reach the frontend.
