# Nexus-Ai - feat/auth-backend

This branch adds an initial backend for authentication, database models and a basic chat API that proxies to an LLM provider (OpenAI by default).

What was added
- Prisma schema and models (User, Account, Session, Project, Task, Conversation, Message)
- lib/prisma.ts helper
- lib/openai.ts simple wrapper for OpenAI
- NextAuth config for Google + Email (pages/api/auth)
- Basic /api/chat endpoint that persists messages and responses
- Theme toggle component
- .env.example

How to run locally
1. Copy .env.example to .env and fill values
2. npm ci
3. npx prisma generate
4. npx prisma migrate dev --name init
5. npm run dev

Environment variables required
- DATABASE_URL
- NEXTAUTH_URL
- NEXTAUTH_SECRET
- GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (optional)
- EMAIL_SERVER and EMAIL_FROM (for email sign in)
- OPENAI_API_KEY
- REDIS_URL (optional - for rate limits)

Notes
- This is a first pass: more work is required to wire the frontend UI, add streaming, rate-limiting, tests and responsive UI fixes. I will continue iterating on this branch and push further commits.
