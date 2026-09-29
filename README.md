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

## Assumptions

- AI tooling was used during development. The technology is moving toward developers making architectural and design decisions while AI handles implementation detail, and this project reflects that workflow.
- The mock server simulates a real backend closely enough that the feed behaves the same way it would against a production API: paginated responses, filtered queries, and random like rejections.

## What I would improve with more time

- Persist the theme choice across refreshes, and follow live system preference changes instead of only reading it once on load.
- Drop pages from React Query's cache when they scroll far off screen, and reload them from the cursor when the user returns. At large scale the current approach keeps every fetched page in memory for the session.
- Split `PostCard` so the image and text are memoized separately from the like controls, avoiding a full card diff when only the heart changes.
- Add responsive image sets so phones do not download full-size pictures.
- Write an integration test that scrolls the virtual list and asserts that the next page loads.

## What I intentionally left out

- **Next.js and server-side rendering.** The goal was to build a client-side SPA that fetches from an API, which is how most feed UIs work in production. A Next.js server could replace the mock server, but it would change the architecture into something the task was not asking for.
- **A state manager like Zustand.** Filters live on the URL, pages live in React Query, and the rest is local component state. A store would duplicate values that already have a home.
- **Saving likes and theme to storage.** Likes simulate a server call that does not persist, and the theme is for the current visit. Adding localStorage would imply durability the mock server does not support.

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
