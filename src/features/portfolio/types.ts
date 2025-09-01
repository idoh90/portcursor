export type Currency = 'USD' | 'ILS';
export type InvestmentType = 'stock' | 'option' | 'custom';

export interface Lot {
  id: string;
  quantity: number;        // positive buy, negative sell for closes
  price: number;           // per share
  date: string;            // ISO date
}

export interface PositionBase {
  id: string;
  ownerId: string;
  symbol: string;          // e.g., 'AAPL'
  displayName?: string;    // e.g., 'Apple Inc.'
  type: InvestmentType;
  currency: Currency;
  lots: Lot[];
  notes?: string;
  privacy: {
    showPosition: boolean;
    showLots: boolean;
    showPnL: boolean;
  };
}

export interface StockPosition extends PositionBase { type: 'stock'; }

export interface OptionPosition extends PositionBase {
  type: 'option';
  option: {
    contractSymbol?: string; // e.g., AAPL240920C00190000
    side: 'CALL' | 'PUT';
    strike: number;
    expiration: string; // ISO date
    underlying: string; // e.g., 'AAPL'
  };
}

export interface CustomPosition extends PositionBase { type: 'custom'; customLabel: string; }

export type Position = StockPosition | OptionPosition | CustomPosition;

export interface UserProfile {
  id: string;
  handle: string;       // unique, used for /u/:handle
  displayName: string;
  avatarUrl?: string;
  baseCurrency: Currency;
  pinnedTickers: string[]; // max 5
  privacy: {
    showTotals: boolean;
    showPositions: boolean;
  };
}

export interface PortfolioSummary {
  totalValue: number;
  totalPnLAbs: number;
  totalPnLPct: number;
  todaysPnLAbs: number;
  todaysPnLPct: number;
}


