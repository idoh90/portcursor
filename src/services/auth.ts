import bcrypt from 'bcryptjs'
import { db, type UserRecord } from './db'

export type RegisterInput = {
	 id: string
	 displayName: string
	 pin: string
}

export type AuthUser = Pick<UserRecord, 'id' | 'displayName' | 'createdAt'>

const PIN_MIN_LEN = 4
const PIN_MAX_LEN = 12
const DISPLAY_MIN_LEN = 3
const DISPLAY_MAX_LEN = 20

export function validateDisplayName(name: string): string | null {
	 const trimmed = name.trim()
	 if (trimmed.length < DISPLAY_MIN_LEN) return `Display name must be at least ${DISPLAY_MIN_LEN} characters`
	 if (trimmed.length > DISPLAY_MAX_LEN) return `Display name must be at most ${DISPLAY_MAX_LEN} characters`
	 if (!/^[a-z0-9_]+$/i.test(trimmed)) return 'Display name can contain only letters, numbers, and _'
	 return null
}

export function validatePin(pin: string): string | null {
	 if (pin.length < PIN_MIN_LEN) return `PIN must be at least ${PIN_MIN_LEN} digits`
	 if (pin.length > PIN_MAX_LEN) return `PIN must be at most ${PIN_MAX_LEN} digits`
	 if (!/^\d+$/.test(pin)) return 'PIN must contain digits only'
	 return null
}

export async function hashPin(pin: string): Promise<string> {
	 const salt = await bcrypt.genSalt(10)
	 return bcrypt.hash(pin, salt)
}

export async function isDisplayNameTaken(displayName: string): Promise<boolean> {
	 const existing = await db.users.where('displayName').equalsIgnoreCase(displayName).first()
	 return Boolean(existing)
}

export async function register(input: RegisterInput): Promise<AuthUser> {
	 const nameError = validateDisplayName(input.displayName)
	 if (nameError) throw new Error(nameError)
	 const pinError = validatePin(input.pin)
	 if (pinError) throw new Error(pinError)
	 if (await isDisplayNameTaken(input.displayName)) throw new Error('Display name is already taken')

	 const pinHash = await hashPin(input.pin)
	 const record: UserRecord = {
		 id: input.id,
		 displayName: input.displayName.trim(),
		 pinHash,
		 createdAt: new Date().toISOString(),
	 }
	 await db.users.add(record)
	 return { id: record.id, displayName: record.displayName, createdAt: record.createdAt }
}

export async function login(id: string, pin: string): Promise<AuthUser> {
	 const user = await db.users.get(id)
	 if (!user) throw new Error('User not found')
	 const ok = await bcrypt.compare(pin, user.pinHash)
	 if (!ok) throw new Error('Invalid PIN')
	 return { id: user.id, displayName: user.displayName, createdAt: user.createdAt }
}


