# <img src="./static/favicon-32x32.png" width="28" height="28" style="vertical-align:middle"> Mini Issues

Internal ticketing tool for non-technical teams. Describe a bug or feature request in plain language, get an AI-structured ticket, and send it directly to Trello — all in a few clicks.

## Features

- **AI-assisted reporting** — Chat with Gemini to structure your bug report or feature request
- **Trello integration** — Tickets are created as Trello cards automatically
- **Whitelist access control** — Only approved emails can sign in
- **History page** — Browse, search, and filter all your past reports
- **Admin panel** — Manage the email whitelist

## Tech Stack

- [SvelteKit 2](https://svelte.dev/docs/kit) + [Svelte 5](https://svelte.dev) — Frontend framework
- [Convex](https://convex.dev) — Backend database & serverless functions
- [Clerk](https://clerk.com) — Authentication (Google OAuth)
- [Tailwind CSS v4](https://tailwindcss.com) — Styling
- [Google Gemini](https://ai.google.dev) — AI chat for ticket structuring
- [Groq](https://groq.com) — AI fallback when Gemini hits rate limits (optional)
- [Trello API](https://developer.atlassian.com/cloud/trello/) — Card creation

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (package manager)
- A [Convex](https://convex.dev) project
- A [Clerk](https://clerk.com) application with Google OAuth enabled
- A [Trello](https://trello.com) board with API access
- A [Google AI Studio](https://aistudio.google.com) API key

### Installation

```sh
# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local
# Fill in the values — see .env.example for guidance

# Start the Convex dev server (in a separate terminal)
bunx convex dev

# Start the SvelteKit dev server
bun run dev
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in all values. The file includes comments explaining where to get each value.

> **Note:** Some variables (e.g. `CLERK_JWT_ISSUER_DOMAIN`, `ADMIN_EMAILS`) must also be set in your Convex Dashboard under **Settings → Environment Variables**.

## Development

```sh
bun run dev          # Start dev server
bun run check        # TypeScript + Svelte type check
bun run lint         # Prettier + ESLint
bun run format       # Auto-format all files
bun run build        # Production build
```

Git hooks (via [Lefthook](https://github.com/evilmartians/lefthook)):

- **pre-commit** — auto-formats staged files with Prettier
- **pre-push** — runs full lint check

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repo to [Vercel](https://vercel.com)
2. Set **Build Command** to:
   ```sh
   npx convex deploy --cmd 'vite build'
   ```
3. Add all environment variables from `.env.example` in the Vercel dashboard, including `CONVEX_DEPLOY_KEY` (from Convex Dashboard → Settings → Deploy Key)
4. Push to `main` — Vercel will auto-deploy both Convex functions and the SvelteKit app
