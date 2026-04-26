// In-process social store. Single source of truth for users, posts,
// comments, follows, likes, reblogs. Re-seeded on cold start.
import { nanoid } from "nanoid";
import { buildSeed, type SocialSeed } from "./seed-posts";
import type {
  SocialComment,
  SocialLike,
  SocialPost,
  SocialUser,
} from "./types";

type Store = SocialSeed & {
  likes: SocialLike[];
};

declare global {
  var __nc_social: Store | undefined;
}

const g = globalThis as unknown as { __nc_social?: Store };

if (!g.__nc_social) {
  const seed = buildSeed();
  g.__nc_social = { ...seed, likes: [] };
}

const store: Store = g.__nc_social!;

// ---------------- READ ----------------

export const Users = {
  all: () => store.users,
  byHandle: (handle: string) => store.users.find((u) => u.handle === handle),
  byId: (id: string) => store.users.find((u) => u.id === id),
};

export const Posts = {
  all: () => store.posts,
  byId: (id: string) => store.posts.find((p) => p.id === id),
  byAuthor: (handle: string) =>
    store.posts.filter((p) => p.authorHandle === handle),
  feed(forUserId: string, opts: { platform?: "tumblr" | "reddit"; cursor?: number; limit?: number } = {}) {
    const u = Users.byId(forUserId);
    const handle = u?.handle ?? "satvik";
    const followingSet = new Set(
      store.follows.filter((f) => f.followerHandle === handle).map((f) => f.followingHandle),
    );
    let list = store.posts.filter(
      (p) => followingSet.has(p.authorHandle) || p.authorHandle === handle,
    );
    if (opts.platform) list = list.filter((p) => p.platform === opts.platform);
    const offset = opts.cursor ?? 0;
    const limit = opts.limit ?? 20;
    return {
      items: list.slice(offset, offset + limit),
      nextCursor: offset + limit < list.length ? offset + limit : null,
      total: list.length,
    };
  },
  explore(opts: { platform?: "tumblr" | "reddit"; topic?: string; cursor?: number; limit?: number } = {}) {
    let list = [...store.posts];
    if (opts.platform) list = list.filter((p) => p.platform === opts.platform);
    if (opts.topic) list = list.filter((p) => p.topic === opts.topic);
    list.sort((a, b) => b.predictedProb - a.predictedProb || b.noteCount - a.noteCount);
    const offset = opts.cursor ?? 0;
    const limit = opts.limit ?? 24;
    return {
      items: list.slice(offset, offset + limit),
      nextCursor: offset + limit < list.length ? offset + limit : null,
      total: list.length,
    };
  },
  search(query: string, limit = 20): SocialPost[] {
    const q = query.toLowerCase();
    return store.posts
      .filter(
        (p) =>
          p.body.toLowerCase().includes(q) ||
          p.title?.toLowerCase().includes(q) ||
          p.tags.some((t) => t.includes(q)) ||
          p.authorHandle.includes(q),
      )
      .slice(0, limit);
  },
  create(input: Omit<SocialPost, "id" | "createdAt" | "noteCount" | "reblogCount" | "commentCount">) {
    const post: SocialPost = {
      ...input,
      id: `post_${nanoid(10)}`,
      createdAt: new Date().toISOString(),
      noteCount: 0,
      reblogCount: 0,
      commentCount: 0,
    };
    store.posts.unshift(post);
    return post;
  },
};

export const Comments = {
  forPost: (postId: string) =>
    store.comments
      .filter((c) => c.postId === postId)
      .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1)),
  create(input: { postId: string; authorHandle: string; body: string }) {
    const c: SocialComment = {
      id: `c_${nanoid(8)}`,
      postId: input.postId,
      authorHandle: input.authorHandle,
      body: input.body,
      createdAt: new Date().toISOString(),
      noteCount: 0,
    };
    store.comments.push(c);
    const post = Posts.byId(input.postId);
    if (post) post.commentCount += 1;
    return c;
  },
};

export const Follows = {
  isFollowing: (follower: string, following: string) =>
    store.follows.some(
      (f) => f.followerHandle === follower && f.followingHandle === following,
    ),
  followersOf: (handle: string) =>
    store.follows.filter((f) => f.followingHandle === handle).map((f) => f.followerHandle),
  followingOf: (handle: string) =>
    store.follows.filter((f) => f.followerHandle === handle).map((f) => f.followingHandle),
  toggle(follower: string, following: string) {
    if (follower === following) return { following: false };
    const idx = store.follows.findIndex(
      (f) => f.followerHandle === follower && f.followingHandle === following,
    );
    if (idx >= 0) {
      store.follows.splice(idx, 1);
      return { following: false };
    }
    store.follows.push({
      followerHandle: follower,
      followingHandle: following,
      createdAt: new Date().toISOString(),
    });
    return { following: true };
  },
};

export const Likes = {
  has: (handle: string, postId: string) =>
    store.likes.some((l) => l.userHandle === handle && l.postId === postId),
  toggle(handle: string, postId: string) {
    const idx = store.likes.findIndex(
      (l) => l.userHandle === handle && l.postId === postId,
    );
    const post = Posts.byId(postId);
    if (!post) return { liked: false, count: 0 };
    if (idx >= 0) {
      store.likes.splice(idx, 1);
      post.noteCount = Math.max(0, post.noteCount - 1);
      return { liked: false, count: post.noteCount };
    }
    store.likes.push({
      userHandle: handle,
      postId,
      createdAt: new Date().toISOString(),
    });
    post.noteCount += 1;
    return { liked: true, count: post.noteCount };
  },
};

export const Reblogs = {
  has: (handle: string, postId: string) =>
    store.reblogs.some((r) => r.userHandle === handle && r.postId === postId),
  toggle(handle: string, postId: string) {
    const idx = store.reblogs.findIndex(
      (r) => r.userHandle === handle && r.postId === postId,
    );
    const post = Posts.byId(postId);
    if (!post) return { reblogged: false, count: 0 };
    if (idx >= 0) {
      store.reblogs.splice(idx, 1);
      post.reblogCount = Math.max(0, post.reblogCount - 1);
      return { reblogged: false, count: post.reblogCount };
    }
    store.reblogs.push({
      userHandle: handle,
      postId,
      createdAt: new Date().toISOString(),
    });
    post.reblogCount += 1;
    return { reblogged: true, count: post.reblogCount };
  },
};

export type { SocialPost, SocialUser, SocialComment };
