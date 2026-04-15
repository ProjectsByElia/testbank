import { useQuery } from '@tanstack/react-query';
import { isSafeLocalMode, mockCoinGeckoBySymbol } from '@/lib/safeLocalMode';

// CoinGecko ID mapping for supported tokens
export const COINGECKO_ID_MAP: Record<string, string> = {
  'USDT': 'tether',
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'BNB': 'binancecoin',
  'XRP': 'ripple',
  'SOL': 'solana',
  'ADA': 'cardano',
  'MATIC': 'matic-network',
  'DOGE': 'dogecoin',
  'DOT': 'polkadot',
  'AVAX': 'avalanche-2',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'LTC': 'litecoin',
  'ATOM': 'cosmos',
  'ALGO': 'algorand',
  'VET': 'vechain',
  'ICP': 'internet-computer',
  'FIL': 'filecoin',
  'TRX': 'tron',
};

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image: {
    thumb: string;
    small: string;
    large: string;
  };
  market_data: {
    current_price: {
      usd: number;
    };
    price_change_percentage_24h: number;
  };
}

interface CoinListItem {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
}

// Hook to fetch coin data for multiple tokens
export const useCoinGeckoData = (symbols: string[]) => {
  return useQuery({
    queryKey: ['coingecko-coins', symbols],
    queryFn: async (): Promise<Record<string, CoinListItem>> => {
      try {
        if (isSafeLocalMode) {
          const result: Record<string, CoinListItem> = {};
          symbols.forEach((symbol) => {
            const mock = mockCoinGeckoBySymbol[symbol.toUpperCase() as keyof typeof mockCoinGeckoBySymbol];
            if (mock) result[symbol.toUpperCase()] = mock;
          });
          return result;
        }

        // Get CoinGecko IDs for the symbols
        const ids = symbols
          .map(symbol => COINGECKO_ID_MAP[symbol.toUpperCase()])
          .filter(Boolean)
          .join(',');

        if (!ids) {
          throw new Error('No valid CoinGecko IDs found');
        }

        // Fetch coin data from CoinGecko
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h`
        );

        if (!response.ok) {
          throw new Error(`CoinGecko API error: ${response.status}`);
        }

        const data: CoinListItem[] = await response.json();
        
        // Convert array to object keyed by symbol
        const result: Record<string, CoinListItem> = {};
        data.forEach(coin => {
          // Find the symbol that maps to this coin ID
          const symbol = Object.keys(COINGECKO_ID_MAP).find(
            key => COINGECKO_ID_MAP[key] === coin.id
          );
          if (symbol) {
            result[symbol] = coin;
          }
        });

        return result;
      } catch (error) {
        console.error('Error fetching CoinGecko data:', error);
        // Return empty object on error - components will handle fallbacks
        return {};
      }
    },
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 2,
  });
};

// Hook to get a single coin's logo
export const useCoinLogo = (symbol: string) => {
  const { data: coinData } = useCoinGeckoData([symbol]);
  return coinData?.[symbol]?.image || null;
};

// Utility function to get fallback logo URL
export const getFallbackLogo = (symbol: string): string => {
  const coingeckoId = COINGECKO_ID_MAP[symbol.toUpperCase()];
  if (coingeckoId) {
    return `https://assets.coingecko.com/coins/images/small/${coingeckoId}.png`;
  }
  return '';
};

// Utility function to get token color for fallback
export const getTokenColor = (symbol: string): string => {
  const colors: Record<string, string> = {
    'USDT': 'bg-green-500',
    'BTC': 'bg-orange-500',
    'ETH': 'bg-blue-500',
    'BNB': 'bg-yellow-500',
    'XRP': 'bg-blue-600',
    'SOL': 'bg-purple-500',
    'ADA': 'bg-blue-700',
    'MATIC': 'bg-purple-600',
    'DOGE': 'bg-yellow-600',
    'DOT': 'bg-pink-500',
    'AVAX': 'bg-red-500',
    'LINK': 'bg-blue-400',
    'UNI': 'bg-pink-400',
    'LTC': 'bg-gray-400',
    'ATOM': 'bg-purple-400',
    'ALGO': 'bg-black',
    'VET': 'bg-blue-800',
    'ICP': 'bg-orange-600',
    'FIL': 'bg-blue-300',
    'TRX': 'bg-red-600',
  };
  return colors[symbol.toUpperCase()] || 'bg-gray-500';
};
