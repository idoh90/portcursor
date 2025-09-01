# API Integration Guide

## Overview
PortfolioHub is now integrated with real-time stock data from Alpha Vantage and Polygon APIs. The system includes smart caching to minimize API requests and provide optimal performance.

## API Providers

### Primary Provider: Polygon
- Provides real-time and historical stock data
- Supports batch requests for multiple symbols
- Better rate limits for free tier

### Fallback Provider: Alpha Vantage  
- Used when Polygon fails or is rate-limited
- Provides global quote data
- Reliable backup option

## Features

### Smart Caching System
1. **Multi-Level Caching**
   - Memory cache (immediate, fastest)
   - LocalStorage cache (persistent across sessions)
   - Database cache (optional, feature-flagged)

2. **Cache TTL (Time To Live)**
   - Default: 30 seconds for quotes
   - Configurable per request
   - Automatic cleanup of expired entries

3. **Request Optimization**
   - Batch API calls when possible
   - Rate limiting (500ms between requests)
   - Circuit breaker pattern for failed providers
   - Automatic fallback to secondary provider

### Provider Health Monitoring
- Tracks provider availability
- Automatically switches to fallback when primary fails
- Re-attempts primary provider after cooldown period

## Configuration

### Environment Variables
```env
VITE_ALPHA_VANTAGE_KEY=your_alpha_vantage_key
VITE_POLYGON_API_KEY=your_polygon_key
VITE_PRIMARY_PROVIDER=polygon
VITE_FALLBACK_PROVIDER=alphavantage
```

## Usage Examples

### In Components
The app automatically fetches real-time quotes for all positions:

```tsx
// Hub.tsx uses the useQuotesBatch hook
const quotes = useQuotesBatch(symbols)

// Individual quote fetching
const { data: quote } = useQuote('AAPL')
```

### Direct API Usage
```typescript
import { getQuote, getQuotesBatched } from './services/pricing/priceService'

// Single quote
const quote = await getQuote('MSFT')

// Batch quotes
const quotes = await getQuotesBatched(['AAPL', 'GOOGL', 'MSFT'])
```

## Cache Statistics
The cache manager tracks:
- Cache hits/misses
- Number of evictions
- Storage usage

Access stats:
```typescript
import { cacheManager } from './services/pricing/cacheManager'
const stats = cacheManager.getStats()
```

## Rate Limits

### Polygon (Free Tier)
- 5 API calls per minute
- Unlimited websocket connections

### Alpha Vantage (Free Tier)
- 25 requests per day
- 5 API calls per minute

The system automatically manages these limits through:
- Request batching
- Intelligent caching
- Rate limiting between requests
- Provider rotation on limits

## Market Hours Detection
The system automatically detects market state:
- **Open**: Regular trading hours (9:30 AM - 4:00 PM ET)
- **Pre**: Pre-market (4:00 AM - 9:30 AM ET)
- **Post**: After-hours (4:00 PM - 8:00 PM ET)
- **Closed**: Outside trading hours or weekends

## Error Handling
- Invalid symbols: Gracefully handled with null values
- Rate limits: Automatic fallback to cached data or secondary provider
- Network errors: Serves cached data when available
- Provider outages: Automatic switch to fallback provider

## Testing
To test the integration:
1. Open the app and navigate to the Hub page
2. Check the browser console for API calls
3. Stock prices should update every 30 seconds
4. Check localStorage for cached data (keys starting with `ph_cache_`)

## Monitoring
Monitor API usage in browser DevTools:
- Network tab: Watch for API calls to polygon.io and alphavantage.co
- Application tab > Local Storage: View cached quotes
- Console: Check for any API errors or warnings

## Future Enhancements
- WebSocket support for real-time updates
- Historical data charts
- Options chain data
- Crypto and forex support
- Advanced technical indicators
