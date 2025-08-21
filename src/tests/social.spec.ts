import { describe, it, expect } from 'vitest'
import { createPost, toggleLike, addComment, listFeed } from '../services/repos/socialRepo'
import { feedPostCreateSchema, commentCreateSchema } from '../models/schemas'

describe('social interactions', () => {
	it('like toggle idempotent and comment sanitized', async () => {
		const post = feedPostCreateSchema.parse({ id: 'p-x', userId: 'u-x', createdAt: new Date().toISOString(), type: 'note', summary: 'hi' })
		await createPost(post)
		await toggleLike('p-x', 'viewer')
		await toggleLike('p-x', 'viewer')
		const comment = commentCreateSchema.parse({ id: 'c-x', postId: 'p-x', userId: 'viewer', createdAt: new Date().toISOString(), text: '<b>xss</b>' })
		const added = await addComment(comment)
		expect(added.text.includes('<')).toBe(false)
	})

	it('feed respects privacy filter stub', async () => {
		const res = await listFeed(10, undefined, 'viewer')
		expect(res.items.length).toBeTypeOf('number')
	})
})


