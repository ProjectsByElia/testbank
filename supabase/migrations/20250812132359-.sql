-- Create wallet_transactions table to track all wallet transactions
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  chain TEXT NOT NULL, -- e.g., ethereum, bsc, polygon, bitcoin, solana, xrp
  network TEXT,        -- e.g., mainnet, testnet
  tx_hash TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('in','out')),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, failed
  from_address TEXT,
  to_address TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  fee NUMERIC,
  currency TEXT NOT NULL, -- e.g., ETH, BTC, SOL, XRP, USDT
  token_address TEXT, -- for ERC20/SPL tokens
  block_number BIGINT,
  nonce BIGINT,
  confirmations INTEGER DEFAULT 0,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB
);

-- Enable RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own transactions"
ON public.wallet_transactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
ON public.wallet_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
ON public.wallet_transactions
FOR UPDATE
USING (auth.uid() = user_id);

-- Disallow delete by omitting policy

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON public.wallet_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user_created_at ON public.wallet_transactions (user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_tx_unique_per_user_chain ON public.wallet_transactions (user_id, chain, COALESCE(network, ''), tx_hash);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_wallet_transactions_updated_at ON public.wallet_transactions;
CREATE TRIGGER update_wallet_transactions_updated_at
BEFORE UPDATE ON public.wallet_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();