import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { isErr } from 'true-myth/result';
import type { FeedPost } from './feed-post';
import type { ImageBytes } from './image-file';
import { loadImages } from './load-images';
import { loadPosts } from './load-posts';

const postsPath = fileURLToPath(new URL('../data/posts.json', import.meta.url));
const imagesDirectory = fileURLToPath(new URL('../data/images', import.meta.url));

export type Snapshot =
  | { readonly type: 'failure'; readonly message: string }
  | {
      readonly type: 'ready';
      readonly posts: readonly FeedPost[];
      readonly images: ReadonlyMap<string, ImageBytes>;
    };

function postsFailureMessage(reason: 'invalid' | 'unreadable'): string {
  if (reason === 'unreadable') {
    return 'Could not read posts.';
  }
  return 'Posts file is invalid.';
}

export async function loadSnapshot(): Promise<Snapshot> {
  const posts = await loadPosts(async function readText() {
    return readFile(postsPath, 'utf8');
  });
  if (isErr(posts)) {
    return { type: 'failure', message: postsFailureMessage(posts.error) };
  }
  const images = await loadImages(imagesDirectory);
  if (images === 'missing' || images.size === 0) {
    return { type: 'failure', message: 'Could not read images.' };
  }
  return { type: 'ready', posts: posts.value, images };
}
