import { isNothing, just, nothing, type Maybe } from 'true-myth/maybe';
import { err, ok, tryOrElse, type Result } from 'true-myth/result';
import { fromPromise, fromResult, type Task } from 'true-myth/task';
import { isFeedStatus, type FeedPost } from './feed-post';
import { isRecord, readString } from './unknown-record';

function readTags(value: unknown): Maybe<readonly string[]> {
  if (!Array.isArray(value)) {
    return nothing();
  }
  const tags: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') {
      return nothing();
    }
    tags.push(item);
  }
  return just(tags);
}

type RequiredPostText = {
  readonly id: string;
  readonly authorName: string;
  readonly title: string;
  readonly content: string;
  readonly createdAt: string;
};

function readRequiredPostText(value: Readonly<Record<string, unknown>>): Maybe<RequiredPostText> {
  const id = readString(value, 'id');
  const authorName = readString(value, 'authorName');
  const title = readString(value, 'title');
  const content = readString(value, 'content');
  const createdAt = readString(value, 'createdAt');
  if (isNothing(id) || isNothing(authorName) || isNothing(title) || isNothing(content) || isNothing(createdAt)) {
    return nothing();
  }
  return just({
    id: id.value,
    authorName: authorName.value,
    title: title.value,
    content: content.value,
    createdAt: createdAt.value
  });
}

type PostDetails = {
  readonly tags: readonly string[];
  readonly image: string;
  readonly status: FeedPost['status'];
};

function readPostDetails(value: Readonly<Record<string, unknown>>): Maybe<PostDetails> {
  const tags = readTags(value.tags);
  const image = readString(value, 'image');
  const statusText = readString(value, 'status');
  if (isNothing(tags) || isNothing(image) || isNothing(statusText)) {
    return nothing();
  }
  if (!isFeedStatus(statusText.value)) {
    return nothing();
  }
  if (!image.value.startsWith('/images/')) {
    return nothing();
  }
  return just({ tags: tags.value, image: image.value, status: statusText.value });
}

function readFeedPost(value: unknown): Maybe<FeedPost> {
  if (!isRecord(value)) {
    return nothing();
  }
  const text = readRequiredPostText(value);
  const details = readPostDetails(value);
  if (isNothing(text) || isNothing(details)) {
    return nothing();
  }
  return just({
    id: text.value.id,
    authorName: text.value.authorName,
    title: text.value.title,
    content: text.value.content,
    createdAt: text.value.createdAt,
    tags: details.value.tags,
    image: details.value.image,
    status: details.value.status
  });
}

function readFeedPosts(value: unknown): Result<readonly FeedPost[], 'invalid'> {
  if (!Array.isArray(value)) {
    return err('invalid');
  }
  const posts: FeedPost[] = [];
  for (const item of value) {
    const post = readFeedPost(item);
    if (isNothing(post)) {
      return err('invalid');
    }
    posts.push(post.value);
  }
  return ok(posts);
}

function parseJson(text: string): Result<unknown, 'invalid'> {
  return tryOrElse(
    function invalid() {
      return 'invalid' as const;
    },
    function parse() {
      return JSON.parse(text) as unknown;
    }
  );
}

export function loadPosts(readText: () => Promise<string>): Task<readonly FeedPost[], 'invalid' | 'unreadable'> {
  return fromPromise(readText(), function unreadable() {
    return 'unreadable' as const;
  }).andThen(function parse(text) {
    return fromResult(parseJson(text).andThen(readFeedPosts));
  });
}
