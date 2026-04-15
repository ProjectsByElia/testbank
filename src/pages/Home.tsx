import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import EurozoneWidget from '@/components/EurozoneWidget';
import AmericasWidget from '@/components/AmericasWidget';

export const Home = () => {
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [region, setRegion] = useState<'AMERICAS' | 'EUROZONE' | null>(null);

  const openRegionWidget = (selected: 'AMERICAS' | 'EUROZONE') => {
    setRegion(selected);
    setIsWidgetOpen(true);
  };

  return (
    <main className="relative w-full min-h-screen">
      {/* Minimal background */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 to-secondary/5" />

      {/* Content */}
      <section className="relative w-full max-w-7xl mx-auto text-center space-y-4 sm:space-y-6 lg:space-y-8 p-3 sm:p-6 lg:p-8 xl:p-12 pb-8">
        {/* Hero Title & Description (restored) */}
        <div className="space-y-3 sm:space-y-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent px-2 text-glow">
            Welcome to USDT BANC
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-high-contrast-muted font-medium max-w-2xl lg:max-w-4xl mx-auto px-4">
            Your secure, non-custodial crypto wallet supporting USDT, Bitcoin, XRP, and Solana. Buy, store, and manage your digital assets with confidence.
          </p>
        </div>

        {/* Region Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 max-w-xl lg:max-w-2xl mx-auto px-4">
          <div>
            <Button
              size="lg"
              onClick={() => openRegionWidget('AMERICAS')}
              className="w-full text-base sm:text-lg lg:text-xl font-bold py-3 sm:py-4 lg:py-6 bg-primary hover:bg-primary/90 transition-colors text-glow"
              aria-label="Open Americas buy/sell crypto widget"
            >
              AMERICAS
            </Button>
          </div>

          <div>
            <Button
              size="lg"
              onClick={() => openRegionWidget('EUROZONE')}
              className="w-full text-base sm:text-lg lg:text-xl font-bold py-3 sm:py-4 lg:py-6 bg-primary hover:bg-primary/90 transition-colors text-glow"
              aria-label="Open Eurozone buy/sell crypto widget"
            >
              EUROZONE
            </Button>
          </div>
        </div>

        {/* Widget container */}
        {isWidgetOpen && (
          <div className="w-full max-w-none mx-auto min-h-[500px] sm:min-h-[600px] md:min-h-[700px] lg:min-h-[750px] xl:min-h-[800px]
                         rounded-xl bg-card border border-primary/20 shadow-lg overflow-hidden flex flex-col mt-6"
          >
            <div className="p-3 sm:p-4 lg:p-6 border-b border-border/30 flex-shrink-0 bg-card">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="text-center sm:text-left">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-high-contrast text-glow">
                    {region === 'EUROZONE' ? '💶 Eurozone' : '🇺🇸 Americas'} Trading Platform
                  </h2>
                  <p className="text-sm sm:text-base lg:text-lg text-high-contrast-muted font-semibold">
                    Secure Crypto Trading Platform
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => setIsWidgetOpen(false)}
                  className="text-sm sm:text-base lg:text-lg font-bold"
                >
                  Close Widget
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              {region === 'EUROZONE' ? <EurozoneWidget /> : <AmericasWidget />}
            </div>
          </div>
        )}
      </section>
    </main>
  );
};
