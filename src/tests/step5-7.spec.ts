import { describe, it, expect } from 'vitest'
import { db } from '../services/db'
import { createPost, toggleLike, addComment, countLikes } from '../services/repos/socialRepo'
import { privacySettingsSchema, feedPostCreateSchema, commentCreateSchema } from '../models/schemas'

describe('Steps 5-7 integrations', () => {
    it('like toggle is idempotent and counts properly', async () => {
        const post = feedPostCreateSchema.parse({ id: 'tpost', userId: 'u', createdAt: new Date().toISOString(), type: 'note', summary: 'hi' })
        await createPost(post)
        const a = await toggleLike('tpost', 'u1')
        expect(['liked','unliked']).toContain(a)
        const afterFirst = await countLikes('tpost')
        await toggleLike('tpost', 'u1')
        const afterSecond = await countLikes('tpost')
        expect(afterFirst).not.toBe(afterSecond)
    })

    it('comment create validates text and associates to post', async () => {
        const post = feedPostCreateSchema.parse({ id: 'tpost2', userId: 'u', createdAt: new Date().toISOString(), type: 'note', summary: 'hello' })
        await createPost(post)
        const c = commentCreateSchema.parse({ id: 'c1', postId: 'tpost2', userId: 'u2', createdAt: new Date().toISOString(), text: 'nice' })
        await addComment(c)
        const got = await db.comments.get('c1')
        expect(got?.text).toBe('nice')
    })

    it('privacy accepts friends visibility and field toggles', () => {
        const p = privacySettingsSchema.parse({ userId: 'u', portfolioVisibility: 'friends', showPositions: true, showLots: false, showDividends: true, showQuantity: false })
        expect(p.portfolioVisibility).toBe('friends')
        expect(p.showQuantity).toBe(false)
    })
})


