# Social feed

A feed of posts you can search, filter, and like. The list loads 50 posts at a time from a mock server and only draws the rows on screen, so a catalog of about 10,000 posts stays scrollable.

## Requirements

- Node.js 24 or newer

## Run

Install the app and the mock server, then start both with a single command.

```bash
npm install
npm install --prefix mock-server
npm run demo
```

This launches the mock server and the Vite dev server together. Open http://localhost:5173.

The app proxies `/posts`, `/images`, and `/avatars` to the mock server on http://127.0.0.1:4010. If you prefer separate terminals, run `npm run mock-server` and `npm run dev` instead.

## What you can do

- Scroll to load the next page. The first load shows skeleton cards.
- Search from the header. The query is kept on the address, so a refresh keeps it.
- Open Filters to narrow by tag, status, and date range. Slow loading delays the mock response so the loading state is visible.
- Like a post. The heart updates immediately. Some likes are rejected and then revert, with a short message.
- Move between posts with the keyboard.
- Switch light and dark mode with the lamp button at the bottom-right corner.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run demo` | Start both the app and mock server |
| `npm run dev` | Start the Vite app only |
| `npm run mock-server` | Start the mock server only |
| `npm test` | Run the tests |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Typecheck the app and the mock server |
| `npm run build` | Typecheck and build the static app into `dist/` |
| `npm run preview` | Serve the production build |
