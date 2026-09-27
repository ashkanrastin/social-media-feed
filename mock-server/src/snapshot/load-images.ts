import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { isNothing } from 'true-myth/maybe';
import { isErr } from 'true-myth/result';
import { fromPromise } from 'true-myth/task';
import { contentTypeFor, type ImageBytes } from './image-file';

type LoadedImage =
  { readonly type: 'missing' } | { readonly type: 'ready'; readonly image: ImageBytes } | { readonly type: 'skipped' };

async function readImageFile(directory: string, name: string): Promise<LoadedImage> {
  const contentType = contentTypeFor(name);
  if (isNothing(contentType)) {
    return { type: 'skipped' };
  }
  const bytes = await fromPromise(readFile(join(directory, name)), function missing() {
    return 'missing' as const;
  });
  if (isErr(bytes)) {
    return { type: 'missing' };
  }
  return { type: 'ready', image: { bytes: new Uint8Array(bytes.value), contentType: contentType.value } };
}

async function collectImages(
  directory: string,
  names: readonly string[]
): Promise<ReadonlyMap<string, ImageBytes> | 'missing'> {
  const images = new Map<string, ImageBytes>();
  for (const name of names) {
    const loaded = await readImageFile(directory, name);
    if (loaded.type === 'missing') {
      return 'missing';
    }
    if (loaded.type === 'ready') {
      images.set(name, loaded.image);
    }
  }
  return images;
}

export async function loadImages(directory: string): Promise<ReadonlyMap<string, ImageBytes> | 'missing'> {
  const names = await fromPromise(readdir(directory), function missing() {
    return 'missing' as const;
  });
  if (isErr(names)) {
    return 'missing';
  }
  return collectImages(directory, names.value);
}
