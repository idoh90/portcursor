import { useEffect, useState } from 'react'
import { listFeed, toggleLike, countLikes, addComment } from '../services/repos/socialRepo'
import { useAuthStore } from '../stores/authStore'

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
		listFeed(20).then(async (res) => {
			if (cancelled) return
			setItems(res.items)
			setCursor(res.nextCursor)
			const entries = await Promise.all(res.items.map((p) => countLikes(p.id).then((n) => [p.id, n] as const)))
			setLikes(Object.fromEntries(entries))
		})
		return () => { cancelled = true }
	}, [])

	const onLoadMore = async () => {
		if (!cursor) return
		setLoadingMore(true)
		const res = await listFeed(20, cursor)
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

	return (
		<div className="space-y-4">
			<h1 className="text-xl font-semibold">Social</h1>
			<div className="space-y-3">
				{items.map((p) => (
					<div key={p.id} className="rounded-lg border p-3 space-y-2">
						<div className="flex items-center justify-between text-sm">
							<div className="font-medium">{p.symbol ?? 'Activity'}</div>
							<button className="text-xs underline" onClick={() => onToggleLike(p.id)}>Like ({likes[p.id] ?? 0})</button>
						</div>
						<div className="text-sm">{p.summary}</div>
						<div className="flex gap-2 pt-1">
							<input
								className="flex-1 rounded border px-2 py-1 text-sm"
								placeholder="Write a comment"
								value={commentDraft[p.id] ?? ''}
								onChange={(e) => setCommentDraft((d) => ({ ...d, [p.id]: e.target.value }))} />
							<button className="rounded bg-black px-3 py-1 text-white text-sm" onClick={() => onSubmitComment(p.id)}>Post</button>
						</div>
					</div>
				))}
			</div>
			<div className="pt-2">
				{cursor ? (
					<button disabled={loadingMore} onClick={onLoadMore} className="rounded border px-3 py-1 text-sm">
						{loadingMore ? 'Loading…' : 'Load more'}
					</button>
				) : (
					<div className="text-sm text-gray-500">No more posts</div>
				)}
			</div>
		</div>
	)
}

export default Social


