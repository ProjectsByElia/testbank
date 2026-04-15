export const isSafeLocalMode = (() => {
  if (typeof window === 'undefined') return false;

  const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
  if (!isLocalHost) return false;

  const params = new URLSearchParams(window.location.search);
  const queryFlag = params.get('safeLocalMode');
  const storedFlag = window.localStorage.getItem('safeLocalMode');

  return queryFlag === '1' || storedFlag === '1';
})();

export const mockUser = {
  id: 'local-demo-user',
  email: 'demo@local.test',
};

export const mockProfile = {
  full_name: 'Local Demo User',
  phone_number: '5551234567',
  country_code: '+1',
  user_id_display: 'USER000',
};

export const mockExchangeRates = [
  { to_currency: 'GBP', rate: 0.79 },
  { to_currency: 'EUR', rate: 0.85 },
  { to_currency: 'CAD', rate: 1.25 },
  { to_currency: 'AED', rate: 3.67 },
  { to_currency: 'SAR', rate: 3.75 },
  { to_currency: 'EGP', rate: 30.9 },
];

export const mockCryptoMarkets = [
  { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 68250, price_change_percentage_24h: 1.82, market_cap: 1340000000000, image: '' },
  { id: 'ethereum', symbol: 'eth', name: 'Ethereum', current_price: 3520, price_change_percentage_24h: -0.63, market_cap: 423000000000, image: '' },
  { id: 'tether', symbol: 'usdt', name: 'Tether', current_price: 1, price_change_percentage_24h: 0.01, market_cap: 109000000000, image: '' },
  { id: 'binancecoin', symbol: 'bnb', name: 'BNB', current_price: 612, price_change_percentage_24h: 0.94, market_cap: 91000000000, image: '' },
  { id: 'solana', symbol: 'sol', name: 'Solana', current_price: 182, price_change_percentage_24h: 3.12, market_cap: 81000000000, image: '' },
  { id: 'ripple', symbol: 'xrp', name: 'XRP', current_price: 0.71, price_change_percentage_24h: -1.12, market_cap: 39000000000, image: '' },
  { id: 'cardano', symbol: 'ada', name: 'Cardano', current_price: 0.58, price_change_percentage_24h: 0.44, market_cap: 21000000000, image: '' },
  { id: 'dogecoin', symbol: 'doge', name: 'Dogecoin', current_price: 0.14, price_change_percentage_24h: 2.08, market_cap: 20000000000, image: '' },
  { id: 'avalanche-2', symbol: 'avax', name: 'Avalanche', current_price: 39.2, price_change_percentage_24h: 1.24, market_cap: 16000000000, image: '' },
  { id: 'chainlink', symbol: 'link', name: 'Chainlink', current_price: 16.8, price_change_percentage_24h: -0.51, market_cap: 9800000000, image: '' },
];

export const mockCoinGeckoBySymbol = {
  USDT: { id: 'tether', symbol: 'usdt', name: 'Tether', image: '', current_price: 1, price_change_percentage_24h: 0.01 },
  BTC: { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', image: '', current_price: 68250, price_change_percentage_24h: 1.82 },
  ETH: { id: 'ethereum', symbol: 'eth', name: 'Ethereum', image: '', current_price: 3520, price_change_percentage_24h: -0.63 },
  BNB: { id: 'binancecoin', symbol: 'bnb', name: 'BNB', image: '', current_price: 612, price_change_percentage_24h: 0.94 },
  XRP: { id: 'ripple', symbol: 'xrp', name: 'XRP', image: '', current_price: 0.71, price_change_percentage_24h: -1.12 },
  SOL: { id: 'solana', symbol: 'sol', name: 'Solana', image: '', current_price: 182, price_change_percentage_24h: 3.12 },
  ADA: { id: 'cardano', symbol: 'ada', name: 'Cardano', image: '', current_price: 0.58, price_change_percentage_24h: 0.44 },
  MATIC: { id: 'matic-network', symbol: 'matic', name: 'Polygon', image: '', current_price: 0.91, price_change_percentage_24h: 0.77 },
};

export const mockTransactions = [
  { id: 'tx1', user_id: mockUser.id, type: 'deposit', crypto_type: 'USDT', amount: 250, status: 'completed', timestamp: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tx2', user_id: mockUser.id, type: 'withdrawal', crypto_type: 'BTC', amount: 0.005, status: 'completed', timestamp: new Date(Date.now() - 86400000).toISOString(), created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: new Date(Date.now() - 86400000).toISOString() },
];
