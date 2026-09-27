import { just, nothing, type Maybe } from 'true-myth/maybe';

export type ImageBytes = {
  readonly bytes: Uint8Array;
  readonly contentType: string;
};

const imageNamePattern = /^\d{2}\.(?:jpg|png|webp|gif)$/;

export function imageFilename(url: string): Maybe<string> {
  const { pathname } = new URL(url, 'http://127.0.0.1');
  if (!pathname.startsWith('/images/')) {
    return nothing();
  }
  const name = pathname.slice('/images/'.length);
  if (!imageNamePattern.test(name)) {
    return nothing();
  }
  return just(name);
}

export function contentTypeFor(filename: string): Maybe<string> {
  if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
    return just('image/jpeg');
  }
  if (filename.endsWith('.png')) {
    return just('image/png');
  }
  if (filename.endsWith('.webp')) {
    return just('image/webp');
  }
  if (filename.endsWith('.gif')) {
    return just('image/gif');
  }
  return nothing();
}
