import { create } from 'zustand'
import type { Comment, Post } from './types'
import { listFeed, addComment as repoAddComment, toggleLike } from '../../services/repos/socialRepo'

type SocialState = {
  posts: Post[]
  commentsByPost: Record<string, Comment[]>
  loading: boolean
  load: () => Promise<void>
  like: (postId: string, userId: string) => Promise<void>
  addComment: (postId: string, userId: string, text: string) => Promise<void>
}

export const useSocialStore = create<SocialState>((set) => ({
  posts: [],
  commentsByPost: {},
  loading: false,
  async load() {
    set({ loading: true })
    const { items } = await listFeed(20)
    set({ posts: items as any, loading: false })
  },
  async like(postId, userId) {
    await toggleLike(postId, userId)
    // Optimistic: no-op structure here; UI can query counts directly if needed
  },
  async addComment(postId, userId, text) {
    const c: Comment = { id: `c-${Math.random().toString(36).slice(2,8)}`, postId, userId, createdAt: new Date().toISOString(), text }
    await repoAddComment(c)
    set(s => ({ commentsByPost: { ...s.commentsByPost, [postId]: [...(s.commentsByPost[postId] ?? []), c] } }))
  },
}))


