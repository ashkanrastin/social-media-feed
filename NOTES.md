# Notes

## At 10× the data

The list already asks for 50 posts at a time and only paints the rows on screen. That still works if the catalog grows. What would not is keeping every loaded page in memory and rebuilding one flat array of posts on each update.

- Drop pages that are far from the scroll position, and load them again from the cursor when the user scrolls back. React Query can hold onto every page it has fetched; at this size that becomes the whole session sitting in the tab.
- Index into the pages the query already has. Flattening them into one array on every like or key press copies data the screen is not showing.
- Give post images a smaller source for a phone, and do not decode pictures until the row is near the viewport. The card already reserves the image box, so the layout does not need the full file to stay stable.

Search and filters should stay on the request. Do not download a larger snapshot and filter it in the browser.

## What we skipped

We did not add a state library such as Zustand. Filters live on the address, pages live in React Query, and the search box, theme, and likes are local component state. A store would have been a second copy of those values.

We also left these out because they were not needed to browse, filter, and like the feed:

- Saving the theme or likes across a refresh. Likes are a stand-in for a server call, and the theme is only for the current visit.
- A client router. The address only has to remember the current filters.
- Responsive image sets and a cache limit on loaded pages. The snapshot is small enough that the simple virtual list is enough.
