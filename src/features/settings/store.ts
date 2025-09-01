import { create } from 'zustand'
import type { Currency } from '../portfolio/types'
import type { Locale } from '../../lib/i18n'

type SettingsState = {
  baseCurrency: Currency
  pinnedTickers: string[]
  privacy: { showTotals: boolean; showPositions: boolean }
  locale: Locale
  setBaseCurrency: (c: Currency) => void
  setPinnedTickers: (arr: string[]) => void
  setPrivacy: (p: Partial<SettingsState['privacy']>) => void
  setLocale: (l: Locale) => void
}

const persisted = typeof localStorage !== 'undefined' ? localStorage.getItem('ph.settings') : null
const initial: SettingsState = persisted ? JSON.parse(persisted) : {
  baseCurrency: 'USD',
  pinnedTickers: ['SPY', 'MSFT', 'AAPL'],
  privacy: { showTotals: true, showPositions: true },
  locale: 'en',
  setBaseCurrency: () => {},
  setPinnedTickers: () => {},
  setPrivacy: () => {},
  setLocale: () => {},
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...initial,
  setBaseCurrency: (c) => { set({ baseCurrency: c }); persist() },
  setPinnedTickers: (arr) => { set({ pinnedTickers: arr.slice(0, 5) }); persist() },
  setPrivacy: (p) => { set({ privacy: { ...get().privacy, ...p } }); persist() },
  setLocale: (l) => { set({ locale: l }); persist() },
}))

function persist() {
  try { localStorage.setItem('ph.settings', JSON.stringify(useSettingsStore.getState())) } catch {}
}


