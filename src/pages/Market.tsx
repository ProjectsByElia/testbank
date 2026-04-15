import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useCryptoData, useStockIndexes } from '@/hooks/useCryptoData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isSafeLocalMode, mockExchangeRates } from '@/lib/safeLocalMode';

export const Market = () => {
  const { data: cryptoData, isLoading: cryptoLoading } = useCryptoData();
  const { data: stockData, isLoading: stockLoading } = useStockIndexes();

  // Fetch exchange rates from Supabase
  const { data: exchangeRates, isLoading: ratesLoading } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: async () => {
      if (isSafeLocalMode) {
        return mockExchangeRates;
      }

      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*');
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-1 sm:space-y-2 px-2"
      >
        <h1 className="text-2xl sm:text-3xl font-bold">Market Index</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Real-time cryptocurrency prices, stock indexes, and exchange rates
        </p>
      </motion.div>

      {/* Exchange Rates */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>USD Exchange Rates</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ratesLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-12 sm:h-16 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
                {exchangeRates?.map((rate) => (
                  <div key={rate.to_currency} className="bg-muted/50 p-2 sm:p-3 rounded-lg text-center">
                    <h3 className="font-semibold text-xs sm:text-sm text-muted-foreground">USD → {rate.to_currency}</h3>
                    <p className="text-sm sm:text-lg lg:text-xl font-bold">{Number(rate.rate).toFixed(4)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Stock Indexes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Global Stock Market Indexes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stockLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 sm:h-20 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
                {stockData?.map((stock) => (
                  <div key={stock.name} className="bg-muted/50 p-3 sm:p-4 rounded-lg">
                    <h3 className="font-semibold text-xs sm:text-sm text-muted-foreground truncate">{stock.name}</h3>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold">{stock.value.toLocaleString()}</p>
                    <div className={`flex items-center text-sm ${
                      stock.changePercent >= 0 ? 'text-accent' : 'text-destructive'
                    }`}>
                      {stock.changePercent >= 0 ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      <span className="text-xs sm:text-sm">
                        {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Top 10 Cryptocurrencies */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Top 10 Cryptocurrencies</CardTitle>
          </CardHeader>
          <CardContent>
            {cryptoLoading ? (
              <div className="space-y-3 sm:space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-12 sm:h-16 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3 overflow-hidden">
                {cryptoData?.map((crypto, index) => (
                  <motion.div
                    key={crypto.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 sm:p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <span className="text-muted-foreground font-medium w-6 sm:w-8 text-xs sm:text-sm">#{index + 1}</span>
                      <img src={crypto.image} alt={crypto.name} className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold truncate text-sm sm:text-base">{crypto.name}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">{crypto.symbol.toUpperCase()}</p>
                      </div>
                    </div>
                    
                    <div className="text-right space-y-1 min-w-0 flex-shrink-0">
                      <p className="font-bold text-sm sm:text-base lg:text-lg">${crypto.current_price.toLocaleString()}</p>
                      <div className={`flex items-center text-xs sm:text-sm justify-end ${
                        crypto.price_change_percentage_24h >= 0 ? 'text-accent' : 'text-destructive'
                      }`}>
                        {crypto.price_change_percentage_24h >= 0 ? (
                          <TrendingUp className="w-3 h-3 mr-1 flex-shrink-0" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1 flex-shrink-0" />
                        )}
                        <span className="truncate">{Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%</span>
                      </div>
                    </div>
                    
                    <div className="text-right ml-4 hidden sm:block min-w-0 flex-shrink-0">
                      <p className="text-sm text-muted-foreground">Market Cap</p>
                      <p className="font-semibold text-xs sm:text-sm">${(crypto.market_cap / 1e9).toFixed(1)}B</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
