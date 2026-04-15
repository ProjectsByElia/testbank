import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getFallbackLogo, getTokenColor } from '@/hooks/useCoinGecko';

interface CoinLogoProps {
  symbol: string;
  name: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

export const CoinLogo = ({ 
  symbol, 
  name, 
  imageUrl, 
  size = 'md', 
  className 
}: CoinLogoProps) => {
  const [imageError, setImageError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);
  
  const sizeClass = sizeClasses[size];
  const tokenColor = getTokenColor(symbol);
  const fallbackUrl = getFallbackLogo(symbol);

  // If we have a direct image URL, try that first
  if (imageUrl && !imageError) {
    return (
      <div className={cn("relative", sizeClass, className)}>
        <img
          src={imageUrl}
          alt={`${name} logo`}
          className={cn("rounded-full object-cover", sizeClass)}
          onError={() => setImageError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  // Try CoinGecko fallback if main image failed and we haven't tried fallback yet
  if (imageError && fallbackUrl && !fallbackError) {
    return (
      <div className={cn("relative", sizeClass, className)}>
        <img
          src={fallbackUrl}
          alt={`${name} logo`}
          className={cn("rounded-full object-cover", sizeClass)}
          onError={() => setFallbackError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  // Final fallback: colored circle with symbol initial
  return (
    <div className={cn(
      "rounded-full flex items-center justify-center text-white font-bold",
      sizeClass,
      tokenColor,
      className
    )}>
      <span className={cn(
        "font-bold text-white",
        size === 'sm' && 'text-xs',
        size === 'md' && 'text-sm',
        size === 'lg' && 'text-lg',
        size === 'xl' && 'text-xl'
      )}>
        {symbol[0]}
      </span>
    </div>
  );
};