# Next.js + TypeScript + shadcn/ui

A modern Next.js project with TypeScript, shadcn/ui components, and browser API utilities.

<!-- Trigger deployment -->

## Features

- ⚡ **Next.js 16** with App Router
- 🔷 **TypeScript** for type safety
- 🎨 **shadcn/ui** components (Button, Card, Input)
- 🌐 **Browser APIs** utilities and hooks:
  - Local Storage hook
  - Geolocation hook
  - Media Query hook
  - Clipboard API
  - Web Share API
  - File Download
  - Screen/Viewport dimensions

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
├── app/              # Next.js app directory
│   ├── page.tsx     # Main page with demos
│   └── globals.css  # Global styles
├── components/       # React components
│   └── ui/          # shadcn/ui components
├── hooks/           # Custom React hooks
│   ├── use-local-storage.ts
│   ├── use-geolocation.ts
│   └── use-media-query.ts
└── lib/             # Utility functions
    ├── utils.ts     # shadcn/ui utilities
    └── browser-utils.ts  # Browser API utilities
```

## Available Hooks

### `useLocalStorage<T>(key: string, initialValue: T)`
Persist data in browser localStorage with React state synchronization.

### `useGeolocation()`
Get user's current location using the Geolocation API.

### `useMediaQuery(query: string)`
React hook for CSS media queries.

## Browser Utilities

The `browserUtils` object provides:
- `copyToClipboard(text)` - Copy text to clipboard
- `readFromClipboard()` - Read text from clipboard
- `share(data)` - Use Web Share API
- `downloadFile(content, filename, mimeType)` - Download files
- `getUserAgent()` - Get browser user agent
- `isOnline()` - Check online status
- `getScreenDimensions()` - Get screen dimensions
- `getViewportDimensions()` - Get viewport dimensions

## Adding More shadcn/ui Components

To add more shadcn/ui components:

```bash
npx shadcn@latest add [component-name]
```

For example:
```bash
npx shadcn@latest add dialog dropdown-menu toast
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).
