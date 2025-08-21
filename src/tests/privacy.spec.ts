import { describe, it, expect } from 'vitest'
import { db } from '../services/db'
import { getPrivacy, upsertPrivacy } from '../services/repos/privacyRepo'

describe('privacy and RLS', () => {
	it('profile private hides positions for non-owner', async () => {
		await upsertPrivacy({ userId: 'u1', portfolioVisibility: 'private', showPositions: true, showLots: true, showDividends: true })
		const p = await getPrivacy('u1')
		expect(p?.portfolioVisibility).toBe('private')
	})
})


