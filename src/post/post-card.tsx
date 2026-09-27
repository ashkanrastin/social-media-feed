import React, { type JSX } from 'react';
import type { FeedPost } from './feed-post';
import { commentCountLabel, publishedOnLabel } from './post-card-text';

type PostCardProps = {
  readonly post: FeedPost;
};

export function PostCard(props: PostCardProps): JSX.Element {
  const { post } = props;
  return (
    <article className='mx-auto max-w-xl overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900'>
      <header className='flex items-center gap-3 px-4 pt-4'>
        <img alt='' className='h-10 w-10 rounded-full bg-stone-200 dark:bg-stone-800' src={post.avatar} />
        <div>
          <p className='font-medium'>{post.authorName}</p>
          <time className='text-sm text-stone-500 dark:text-stone-400' dateTime={post.createdAt}>
            {publishedOnLabel(post.createdAt)}
          </time>
        </div>
      </header>
      <div className='px-4 pt-3'>
        <h2 className='text-lg font-semibold [overflow-wrap:anywhere]'>{post.title}</h2>
        <p className='mt-2 whitespace-pre-wrap text-stone-700 dark:text-stone-300 [overflow-wrap:anywhere]'>
          {post.content}
        </p>
      </div>
      <img alt='' className='mt-4 aspect-[3/2] w-full bg-stone-200 object-cover dark:bg-stone-800' src={post.image} />
      <p className='px-4 py-3 text-sm text-stone-500 dark:text-stone-400'>{commentCountLabel(post.commentCount)}</p>
    </article>
  );
}
