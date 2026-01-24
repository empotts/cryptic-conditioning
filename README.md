# Cryptic Conditioning

A cryptic crossword trainer built with TanStack Start and deployed to Cloudflare Workers.

🔗 **Live App**: https://cryptic-conditioning.ethanmpotts.workers.dev

## Features

- **Daily Cryptic**: One deterministic puzzle per day based on the local date
- **Endless Mode**: Random puzzles with shareable seed-based URLs
- **Timer**: Track your solving time (mm:ss format)
- **Check/Reveal**: Verify your answers or reveal the solution
- **Fast**: Server functions load only one clue at a time for snappy performance

## Getting Started

```sh
pnpm install
pnpm dev
```

This starts the app in development mode at http://localhost:3000

## Build

To build the app for production:

```sh
pnpm build
```

## Preview

To preview the production build locally:

```sh
pnpm preview
```

## Deploy to Cloudflare

To deploy your app to Cloudflare Workers:

```sh
pnpm run deploy
```

## Tech Stack

- [TanStack Router](https://tanstack.com/router) - Type-safe routing
- [TanStack Start](https://tanstack.com/start) - Full-stack React framework
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) - Edge deployment
- [Tailwind CSS](https://tailwindcss.com) - Styling
