import { isNothing, just, nothing, type Maybe } from 'true-myth/maybe';

export type ImageBytes = {
  readonly bytes: Uint8Array;
  readonly contentType: string;
};

const assetNamePattern = /^\d{2}\.(?:jpg|png|webp|gif|svg)$/;

function assetDirectory(pathname: string): Maybe<string> {
  if (pathname.startsWith('/images/')) {
    return just('/images/');
  }
  if (pathname.startsWith('/avatars/')) {
    return just('/avatars/');
  }
  return nothing();
}

export function imageFilename(url: string): Maybe<string> {
  const { pathname } = new URL(url, 'http://127.0.0.1');
  const directory = assetDirectory(pathname);
  if (isNothing(directory)) {
    return nothing();
  }
  const name = pathname.slice(directory.value.length);
  if (!assetNamePattern.test(name)) {
    return nothing();
  }
  return just(name);
}

const contentTypes = {
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
  webp: 'image/webp'
} as const;

type ImageExtension = keyof typeof contentTypes;

function isImageExtension(value: string): value is ImageExtension {
  return Object.hasOwn(contentTypes, value);
}

export function contentTypeFor(filename: string): Maybe<string> {
  const extension = filename.slice(filename.lastIndexOf('.') + 1);
  if (!isImageExtension(extension)) {
    return nothing();
  }
  return just(contentTypes[extension]);
}
