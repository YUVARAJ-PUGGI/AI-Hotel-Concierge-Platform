## Project Context
- Monorepo: frontend (React + Vite + Tailwind), backend (Node + Express + Mongoose + Socket.IO), ai-service (FastAPI), shared constants.
- Domain: Hotel discovery, booking, hotel-locked concierge chat, room service/ticket escalation.
- Database: MongoDB only.

## Naming and Contracts
- API base path: `/api`.
- Backend response shape:
  - success: `{ success: true, data }`
  - error: `{ success: false, error: { code, message } }`
- Socket events are defined in `shared/socket-events.json` and emitted through `src/socket/emitter.js` only.
- Route IDs must be validated with `mongoose.isValidObjectId` middleware.

## Coding Rules
- Always use async/await, never `.then()` chains.
- Wrap all async route handlers in try/catch and call `next(err)`.
- Never store secrets in code; use `process.env`.
- Use mongoose transactions for multi-document writes.
- AI service calls always have a 10s timeout and fallback.
- File uploads must validate MIME type and size server-side.
- Passwords use bcrypt with `saltRounds = 12`.
- React uses functional components + hooks only.
- Tailwind classes only, no inline styles.

## AI Guardrails
- For hotel-specific facts (timings, policies, amenities, pricing, availability), answer only from retrieved hotel context.
- If context is missing/low-confidence, return:
  - "I do not have that information right now. I will connect you with the front desk."
- Then create an escalation ticket.
- Never guess hotel-specific facts.

## What Not To Suggest
- No raw SQL.
- No class components.
- No `console.log` in production paths; use logger utility.
