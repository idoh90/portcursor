import { create } from 'zustand'

type ViewerState = {
	isOwner: boolean
	displayName?: string
	viewingUserId?: string
	setOwner: (v: boolean) => void
	setDisplayName: (n?: string) => void
	setViewingUserId: (id?: string) => void
}

export const useViewerStore = create<ViewerState>((set) => ({
	isOwner: false,
	displayName: undefined,
	viewingUserId: undefined,
	setOwner: (v) => set({ isOwner: v }),
	setDisplayName: (n) => set({ displayName: n }),
	setViewingUserId: (id) => set({ viewingUserId: id })
}))


