// Quick test script to verify API keys are working
// Run with: node test-api.js

const ALPHA_VANTAGE_KEY = 'FASAAKN0H9ZBU8O2'
const POLYGON_API_KEY = '5n_ptR02jtD5ef_YVCInWjTePGDgJYKr'

async function testAlphaVantage() {
  console.log('\n🔍 Testing Alpha Vantage API...')
  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=${ALPHA_VANTAGE_KEY}`
    )
    const data = await response.json()
    
    if (data['Global Quote']) {
      console.log('✅ Alpha Vantage API is working!')
      console.log(`   AAPL Price: $${data['Global Quote']['05. price']}`)
    } else if (data['Note']) {
      console.log('⚠️  Alpha Vantage rate limit reached (5 per minute)')
    } else if (data['Error Message']) {
      console.log('❌ Alpha Vantage error:', data['Error Message'])
    } else {
      console.log('❌ Unexpected Alpha Vantage response:', data)
    }
  } catch (error) {
    console.log('❌ Alpha Vantage connection failed:', error.message)
  }
}

async function testPolygon() {
  console.log('\n🔍 Testing Polygon API...')
  try {
    const response = await fetch(
      `https://api.polygon.io/v2/aggs/ticker/AAPL/prev?apikey=${POLYGON_API_KEY}`
    )
    const data = await response.json()
    
    if (data.status === 'OK' && data.results?.[0]) {
      console.log('✅ Polygon API is working!')
      console.log(`   AAPL Previous Close: $${data.results[0].c}`)
    } else if (response.status === 403) {
      console.log('❌ Polygon API key invalid or insufficient permissions')
    } else if (response.status === 429) {
      console.log('⚠️  Polygon rate limit reached')
    } else {
      console.log('❌ Unexpected Polygon response:', data)
    }
  } catch (error) {
    console.log('❌ Polygon connection failed:', error.message)
  }
}

async function testMarketStatus() {
  console.log('\n🔍 Testing Polygon Market Status...')
  try {
    const response = await fetch(
      `https://api.polygon.io/v1/marketstatus/now?apikey=${POLYGON_API_KEY}`
    )
    const data = await response.json()
    
    if (data.status === 'OK') {
      console.log('✅ Market status endpoint working!')
      console.log(`   NYSE: ${data.exchanges?.nyse || 'unknown'}`)
      console.log(`   NASDAQ: ${data.exchanges?.nasdaq || 'unknown'}`)
    } else {
      console.log('⚠️  Market status not available')
    }
  } catch (error) {
    console.log('❌ Market status check failed:', error.message)
  }
}

async function runTests() {
  console.log('================================')
  console.log('🚀 Testing Stock API Integration')
  console.log('================================')
  
  await testPolygon()
  await testAlphaVantage()
  await testMarketStatus()
  
  console.log('\n================================')
  console.log('✨ API Test Complete!')
  console.log('================================')
  console.log('\nIf both APIs are working, your PortfolioHub app')
  console.log('should now display real-time stock prices!')
  console.log('\nRun "npm run dev" to start the app.')
}

runTests()
