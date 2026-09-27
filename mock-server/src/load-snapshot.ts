import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { isErr } from 'true-myth/result';
import type { FeedPost } from './feed-post';
import type { ImageBytes } from './image-file';
import { loadImages } from './load-images';
import { loadPosts } from './load-posts';

const postsPath = fileURLToPath(new URL('../data/posts.json', import.meta.url));
const imagesDirectory = fileURLToPath(new URL('../data/images', import.meta.url));
const avatarsDirectory = fileURLToPath(new URL('../data/avatars', import.meta.url));

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

function mergeImages(
  photos: ReadonlyMap<string, ImageBytes>,
  avatars: ReadonlyMap<string, ImageBytes>
): ReadonlyMap<string, ImageBytes> {
  const images = new Map(photos);
  for (const [name, image] of avatars) {
    images.set(name, image);
  }
  return images;
}

function readySnapshot(
  posts: readonly FeedPost[],
  photos: ReadonlyMap<string, ImageBytes> | 'missing',
  avatars: ReadonlyMap<string, ImageBytes> | 'missing'
): Snapshot {
  if (photos === 'missing' || photos.size === 0) {
    return { type: 'failure', message: 'Could not read images.' };
  }
  if (avatars === 'missing' || avatars.size === 0) {
    return { type: 'failure', message: 'Could not read avatars.' };
  }
  return { type: 'ready', posts, images: mergeImages(photos, avatars) };
}

export async function loadSnapshot(): Promise<Snapshot> {
  const posts = await loadPosts(async function readText() {
    return readFile(postsPath, 'utf8');
  });
  if (isErr(posts)) {
    return { type: 'failure', message: postsFailureMessage(posts.error) };
  }
  const photos = await loadImages(imagesDirectory);
  const avatars = await loadImages(avatarsDirectory);
  return readySnapshot(posts.value, photos, avatars);
}
