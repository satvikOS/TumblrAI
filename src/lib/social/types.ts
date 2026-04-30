import type { Platform } from "@/lib/ml/topics";

export type SocialUser = {
  id: string;
  handle: string;
  name: string;
  bio: string;
  avatarSeed: string;
  bannerSeed: string;
  followers: number;
  following: number;
  postCount: number;
  joinedAt: string;
  verified?: boolean;
  pronouns?: string;
  location?: string;
  link?: string;
};

export type SocialPost = {
  id: string;
  authorHandle: string;
  platform: Platform;
  title?: string;
  body: string;
  imageUrl?: string;
  imageAlt?: string;
  tags: string[];
  noteCount: number;
  reblogCount: number;
  commentCount: number;
  topic: string;
  sentimentLabel: "positive" | "neutral" | "negative";
  sentimentScore: number;
  predictedProb: number;
  createdAt: string;
  rebloggedFrom?: string; // post id
};

export type SocialComment = {
  id: string;
  postId: string;
  authorHandle: string;
  body: string;
  createdAt: string;
  noteCount: number;
};

export type SocialFollow = {
  followerHandle: string;
  followingHandle: string;
  createdAt: string;
};

export type SocialLike = {
  userHandle: string;
  postId: string;
  createdAt: string;
};

export type SocialReblog = {
  userHandle: string;
  postId: string;
  createdAt: string;
};
