export async function fetchLivePrice(symbol: string): Promise<{ price: number; prevClose: number; updatedAt: number }> {
  await new Promise(r => setTimeout(r, 250))
  const base = 100 + (symbol.length * 7) % 50
  const jitter = (Math.random() - 0.5) * 2
  return { price: +(base + jitter).toFixed(2), prevClose: +base.toFixed(2), updatedAt: Date.now() }
}


