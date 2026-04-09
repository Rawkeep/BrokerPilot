/**
 * Realistic demo market data for offline/static mode.
 * Used as fallback when backend API is unavailable (e.g. GitHub Pages).
 */

const today = new Date().toISOString().split('T')[0];

// --- Stock Overview (DAX, US, Tech) ---
export const DEMO_STOCK_OVERVIEW = [
  { symbol: '^GDAXI', name: 'DAX 40', price: 22456.78, change: 187.34, changePercent: 0.84, currency: 'EUR' },
  { symbol: '^STOXX50E', name: 'Euro Stoxx 50', price: 5234.12, change: 42.56, changePercent: 0.82, currency: 'EUR' },
  { symbol: '^DJI', name: 'Dow Jones', price: 42876.54, change: -123.45, changePercent: -0.29, currency: 'USD' },
  { symbol: '^GSPC', name: 'S&P 500', price: 5892.33, change: 28.67, changePercent: 0.49, currency: 'USD' },
  { symbol: 'SAP.DE', name: 'SAP SE', price: 234.56, change: 3.78, changePercent: 1.64, currency: 'EUR' },
  { symbol: 'SIE.DE', name: 'Siemens AG', price: 198.34, change: -1.23, changePercent: -0.62, currency: 'EUR' },
  { symbol: 'ALV.DE', name: 'Allianz SE', price: 312.45, change: 5.67, changePercent: 1.85, currency: 'EUR' },
  { symbol: 'DTE.DE', name: 'Deutsche Telekom', price: 32.18, change: 0.45, changePercent: 1.42, currency: 'EUR' },
  { symbol: 'BAS.DE', name: 'BASF SE', price: 48.92, change: -0.67, changePercent: -1.35, currency: 'EUR' },
  { symbol: 'BMW.DE', name: 'BMW AG', price: 87.56, change: 1.23, changePercent: 1.43, currency: 'EUR' },
  { symbol: 'AAPL', name: 'Apple Inc.', price: 213.87, change: 2.34, changePercent: 1.11, currency: 'USD' },
  { symbol: 'MSFT', name: 'Microsoft', price: 448.92, change: 5.67, changePercent: 1.28, currency: 'USD' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 142.56, change: 8.34, changePercent: 6.21, currency: 'USD' },
  { symbol: 'GOOGL', name: 'Alphabet', price: 178.23, change: -1.45, changePercent: -0.81, currency: 'USD' },
  { symbol: 'AMZN', name: 'Amazon', price: 205.67, change: 3.89, changePercent: 1.93, currency: 'USD' },
];

// --- Crypto Markets ---
export const DEMO_CRYPTO_MARKETS = [
  { id: 'bitcoin', rank: 1, symbol: 'BTC', name: 'Bitcoin', price: 82456.78, change24h: 2.34, marketCap: 1620000000000, volume24h: 34500000000, image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
  { id: 'ethereum', rank: 2, symbol: 'ETH', name: 'Ethereum', price: 3245.67, change24h: 1.87, marketCap: 390000000000, volume24h: 18700000000, image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
  { id: 'ripple', rank: 3, symbol: 'XRP', name: 'XRP', price: 2.34, change24h: -1.23, marketCap: 134000000000, volume24h: 8900000000, image: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png' },
  { id: 'binancecoin', rank: 4, symbol: 'BNB', name: 'BNB', price: 612.34, change24h: -0.45, marketCap: 89000000000, volume24h: 2100000000, image: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png' },
  { id: 'solana', rank: 5, symbol: 'SOL', name: 'Solana', price: 178.92, change24h: 4.56, marketCap: 82000000000, volume24h: 4500000000, image: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
  { id: 'cardano', rank: 6, symbol: 'ADA', name: 'Cardano', price: 0.78, change24h: 3.21, marketCap: 27000000000, volume24h: 890000000, image: 'https://assets.coingecko.com/coins/images/975/small/cardano.png' },
  { id: 'dogecoin', rank: 7, symbol: 'DOGE', name: 'Dogecoin', price: 0.21, change24h: 5.67, marketCap: 31000000000, volume24h: 2300000000, image: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png' },
  { id: 'polkadot', rank: 8, symbol: 'DOT', name: 'Polkadot', price: 8.45, change24h: -2.34, marketCap: 11500000000, volume24h: 450000000, image: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png' },
  { id: 'avalanche-2', rank: 9, symbol: 'AVAX', name: 'Avalanche', price: 42.67, change24h: 1.89, marketCap: 17000000000, volume24h: 780000000, image: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png' },
  { id: 'chainlink', rank: 10, symbol: 'LINK', name: 'Chainlink', price: 18.92, change24h: 2.45, marketCap: 12000000000, volume24h: 670000000, image: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png' },
  { id: 'tron', rank: 11, symbol: 'TRX', name: 'TRON', price: 0.26, change24h: 1.12, marketCap: 22000000000, volume24h: 1100000000, image: 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png' },
  { id: 'litecoin', rank: 12, symbol: 'LTC', name: 'Litecoin', price: 98.45, change24h: -0.87, marketCap: 7400000000, volume24h: 560000000, image: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png' },
  { id: 'uniswap', rank: 13, symbol: 'UNI', name: 'Uniswap', price: 14.23, change24h: 3.45, marketCap: 8500000000, volume24h: 340000000, image: 'https://assets.coingecko.com/coins/images/12504/small/uniswap-logo.png' },
  { id: 'stellar', rank: 14, symbol: 'XLM', name: 'Stellar', price: 0.41, change24h: 0.78, marketCap: 12300000000, volume24h: 290000000, image: 'https://assets.coingecko.com/coins/images/100/small/Stellar_symbol_black_RGB.png' },
  { id: 'near', rank: 15, symbol: 'NEAR', name: 'NEAR Protocol', price: 7.89, change24h: 2.67, marketCap: 9200000000, volume24h: 410000000, image: 'https://assets.coingecko.com/coins/images/10365/small/near.jpg' },
];

// --- Generate OHLC chart data ---
function generateOHLC(basePrice, days, volatility = 0.02) {
  const data = [];
  let price = basePrice;
  const now = Date.now();
  const dayMs = 86400000;

  for (let i = days; i >= 0; i--) {
    const time = Math.floor((now - i * dayMs) / 1000);
    const change = (Math.random() - 0.48) * volatility * price;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * volatility * price * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * price * 0.5;
    data.push({ time, open: +open.toFixed(2), high: +high.toFixed(2), low: +low.toFixed(2), close: +close.toFixed(2) });
    price = close;
  }
  return data;
}

export function getDemoStockChart(symbol, range = '6mo') {
  const rangeDays = { '1d': 1, '5d': 5, '1mo': 30, '3mo': 90, '6mo': 180, '1y': 365 };
  const days = rangeDays[range] || 180;
  const stock = DEMO_STOCK_OVERVIEW.find((s) => s.symbol === symbol);
  return generateOHLC(stock?.price || 100, days);
}

export function getDemoCryptoChart(coinId, days = 30) {
  const coin = DEMO_CRYPTO_MARKETS.find((c) => c.id === coinId);
  return generateOHLC(coin?.price || 1000, days, 0.035);
}

// --- Market Intelligence Report ---
export const DEMO_INTELLIGENCE_REPORT = {
  date: new Date().toISOString(),
  summary: 'Europaeische Maerkte zeigen sich freundlich. Der DAX gewinnt 0.84% getrieben von SAP (+1.64%) und Allianz (+1.85%). US-Tech-Werte stark: NVIDIA fuehrt mit +6.21%. Bitcoin testet erneut die 82.000 EUR Marke. Vorsicht bei BASF (-1.35%) und Alphabet (-0.81%).',
  indices: [
    { symbol: '^GDAXI', name: 'DAX 40', price: 22456.78, changePercent: 0.84 },
    { symbol: '^STOXX50E', name: 'Euro Stoxx 50', price: 5234.12, changePercent: 0.82 },
    { symbol: '^DJI', name: 'Dow Jones', price: 42876.54, changePercent: -0.29 },
    { symbol: '^GSPC', name: 'S&P 500', price: 5892.33, changePercent: 0.49 },
    { symbol: '^IXIC', name: 'NASDAQ', price: 18934.56, changePercent: 1.12 },
    { symbol: 'BTC-EUR', name: 'Bitcoin', price: 82456.78, changePercent: 2.34 },
  ],
  topGainers: [
    { symbol: 'NVDA', name: 'NVIDIA', price: 142.56, changePercent: 6.21 },
    { symbol: 'DOGE-EUR', name: 'Dogecoin', price: 0.21, changePercent: 5.67 },
    { symbol: 'SOL-EUR', name: 'Solana', price: 178.92, changePercent: 4.56 },
    { symbol: 'ADA-EUR', name: 'Cardano', price: 0.78, changePercent: 3.21 },
    { symbol: 'BTC-EUR', name: 'Bitcoin', price: 82456.78, changePercent: 2.34 },
  ],
  topLosers: [
    { symbol: 'BAS.DE', name: 'BASF', price: 48.92, changePercent: -1.35 },
    { symbol: 'XRP-EUR', name: 'XRP', price: 2.34, changePercent: -1.23 },
    { symbol: 'GOOGL', name: 'Alphabet', price: 178.23, changePercent: -0.81 },
    { symbol: 'SIE.DE', name: 'Siemens', price: 198.34, changePercent: -0.62 },
    { symbol: 'BNB-EUR', name: 'BNB', price: 612.34, changePercent: -0.45 },
  ],
  alerts: [
    { severity: 'warning', title: 'NVIDIA +6.21%', description: 'Starker Kursanstieg nach positiven Quartalszahlen und KI-Chip-Nachfrage.' },
    { severity: 'info', title: 'Bitcoin ueber 82.000 EUR', description: 'BTC naehert sich dem Allzeithoch. Volatilitaet erwartet.' },
    { severity: 'warning', title: 'BASF unter Druck', description: 'Chemie-Sektor belastet durch schwache China-Daten.' },
  ],
  breakouts: [
    { symbol: 'SAP.DE', label: '52W-Hoch', detail: 'SAP erreicht neues 52-Wochen-Hoch bei 234.56 EUR (+1.64%)' },
    { symbol: 'ALV.DE', label: 'Aufwaertstrend', detail: 'Allianz mit 5. Gewinntag in Folge, SMA50 durchbrochen' },
  ],
};
