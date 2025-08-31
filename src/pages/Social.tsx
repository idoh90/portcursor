import { useEffect, useState } from 'react'
import VirtualList from '../components/VirtualList'
import { listFeed, toggleLike, countLikes, addComment } from '../services/repos/socialRepo'
import { useAuthStore } from '../stores/authStore'
import Button from '../components/ui/Button'
import PostCard from '../components/social/PostCard'
import CommentSection from '../components/social/CommentSection'

type FeedItem = Awaited<ReturnType<typeof listFeed>>['items'][number]

function Social() {
	const user = useAuthStore((s) => s.user)
	const [items, setItems] = useState<FeedItem[]>([])
	const [cursor, setCursor] = useState<string | undefined>()
	const [likes, setLikes] = useState<Record<string, number>>({})
	const [commentDraft, setCommentDraft] = useState<Record<string, string>>({})
	const [loadingMore, setLoadingMore] = useState(false)

	useEffect(() => {
		let cancelled = false
		listFeed(20, undefined, user?.id).then(async (res) => {
			if (cancelled) return
			setItems(res.items)
			setCursor(res.nextCursor)
			const entries = await Promise.all(res.items.map((p) => countLikes(p.id).then((n) => [p.id, n] as const)))
			setLikes(Object.fromEntries(entries))
		})
		return () => { cancelled = true }
	}, [user?.id])

	const onLoadMore = async () => {
		if (!cursor) return
		setLoadingMore(true)
		const res = await listFeed(20, cursor, user?.id)
		setItems((prev) => [...prev, ...res.items])
		setCursor(res.nextCursor)
		const entries = await Promise.all(res.items.map((p) => countLikes(p.id).then((n) => [p.id, n] as const)))
		setLikes((prev) => ({ ...prev, ...Object.fromEntries(entries) }))
		setLoadingMore(false)
	}

	const onToggleLike = async (postId: string) => {
		if (!user) return
		setLikes((prev) => ({ ...prev, [postId]: (prev[postId] ?? 0) + 1 }))
		try {
			const res = await toggleLike(postId, user.id)
			setLikes((prev) => ({ ...prev, [postId]: (prev[postId] ?? 0) + (res === 'liked' ? 0 : -2) }))
		} catch {
			setLikes((prev) => ({ ...prev, [postId]: Math.max(0, (prev[postId] ?? 1) - 1) }))
		}
	}

	const onSubmitComment = async (postId: string) => {
		if (!user) return
		const text = (commentDraft[postId] ?? '').trim()
		if (!text) return
		const optimistic = { id: `tmp-${Math.random()}`, postId, userId: user.id, createdAt: new Date().toISOString(), text }
		setCommentDraft((d) => ({ ...d, [postId]: '' }))
		try {
			await addComment(optimistic as any)
		} catch {
			setCommentDraft((d) => ({ ...d, [postId]: text }))
		}
	}

	const renderRow = (p: FeedItem) => (
		<div key={p.id}>
			<PostCard id={p.id} symbol={p.symbol} summary={p.summary} likes={likes[p.id] ?? 0} onLike={onToggleLike} />
			<CommentSection postId={p.id} value={commentDraft[p.id] ?? ''} onChange={(v) => setCommentDraft((d) => ({ ...d, [p.id]: v }))} onSubmit={onSubmitComment} />
		</div>
	)
	return (
		<div className="space-y-4 pb-16">
			<h1 className="text-xl font-semibold">Social</h1>
			<VirtualList ariaRole="feed" ariaLabel="Social feed" items={items} rowHeight={118} height={520} renderRow={(it) => renderRow(it)} />
			<div className="pt-2">
				{cursor ? (
					<Button variant="secondary" size="sm" disabled={loadingMore} onClick={onLoadMore}>
						{loadingMore ? 'Loading…' : 'Load more'}
					</Button>
				) : (
					<div className="text-sm text-zinc-500">No more posts</div>
				)}
			</div>
		</div>
	)
}

export default Social


