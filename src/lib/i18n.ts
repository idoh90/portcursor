export type Locale = 'en' | 'he';

const en = {
  news: 'News',
  hub: 'Hub',
  social: 'Social',
  myStocks: 'My Stocks',
  settings: 'Settings',
  addPosition: 'Add position',
  totalValue: 'Total Value',
  totalPnL: 'Total P/L',
  today: 'Today',
};

const he: typeof en = {
  news: 'מחקר',
  hub: 'בית',
  social: 'רשת',
  myStocks: 'המניות שלי',
  settings: 'הגדרות',
  addPosition: 'הוסף פוזיציה',
  totalValue: 'שווי כולל',
  totalPnL: 'רווח/הפסד',
  today: 'היום',
};

const dict: Record<Locale, typeof en> = { en, he };

let current: Locale = 'en';
export function setLocale(l: Locale) { current = l; document.documentElement.setAttribute('lang', l); document.documentElement.setAttribute('dir', l === 'he' ? 'rtl' : 'ltr'); }
export function getLocale(): Locale { return current; }
export function t(key: keyof typeof en): string { return dict[current][key] ?? String(key); }


