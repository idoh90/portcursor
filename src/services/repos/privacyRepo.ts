import { db } from '../db'
import type { PrivacySettings } from '../../models/types'
import { privacySettingsSchema } from '../../models/schemas'

export async function getPrivacy(userId: string): Promise<PrivacySettings | undefined> {
	return db.privacy.get(userId)
}

export async function upsertPrivacy(input: PrivacySettings): Promise<void> {
	const p = privacySettingsSchema.parse(input)
	await db.privacy.put(p)
	await db.auditLogs.put({ id: `privacy:${p.userId}:${Date.now()}`, userId: p.userId, action: 'privacy.upsert', details: p, ts: new Date().toISOString() } as any)
}


