import { create } from 'zustand'

type UserState = {
  currentUserId?: string
  setCurrentUserId: (id?: string) => void
  isOwner: (viewedUserId?: string) => boolean
}

export const useUserStore = create<UserState>((set, get) => ({
  currentUserId: 'u-ido',
  setCurrentUserId: (id) => set({ currentUserId: id }),
  isOwner: (viewedUserId) => {
    const me = get().currentUserId
    return !!me && (!!viewedUserId ? me === viewedUserId : true)
  },
}))


