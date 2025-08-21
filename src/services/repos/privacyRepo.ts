import { db } from '../db'
import type { PrivacySettings } from '../../models/types'
import { privacySettingsSchema } from '../../models/schemas'

export async function getPrivacy(userId: string): Promise<PrivacySettings | undefined> {
	return db.privacy.get(userId)
}

export async function upsertPrivacy(input: PrivacySettings): Promise<void> {
	const p = privacySettingsSchema.parse(input)
	await db.privacy.put(p)
}


