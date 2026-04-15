export type EvmChainKey = 'ethereum' | 'bsc' | 'polygon';

export interface ChainConfig {
  key: EvmChainKey;
  name: string;
  chainId: number;
  rpcUrl: string;
  symbol: string;
  explorer?: string;
}

export interface EvmAdapter {
  getAddressFromMnemonic: (mnemonic: string, accountIndex?: number) => string;
  getBalance: (chain: EvmChainKey, address: string) => Promise<string>;
  getErc20Balance: (chain: EvmChainKey, tokenAddress: string, userAddress: string) => Promise<string>;
  getErc20Transfers: (chain: EvmChainKey, tokenAddress: string, userAddress: string, lookbackBlocks?: number) => Promise<{
    hash: string;
    from: string;
    to: string;
    value: string;
    blockNumber: number;
  }[]>;
  sendTransaction: (params: {
    chain: EvmChainKey;
    mnemonic: string;
    to: string;
    amountEth: string;
  }) => Promise<string>; // returns tx hash
}

export const EVM_CHAINS: Record<EvmChainKey, ChainConfig> = {
  ethereum: {
    key: 'ethereum',
    name: 'Ethereum',
    chainId: 1,
    rpcUrl: 'https://cloudflare-eth.com',
    symbol: 'ETH',
    explorer: 'https://etherscan.io',
  },
  bsc: {
    key: 'bsc',
    name: 'BNB Smart Chain',
    chainId: 56,
    rpcUrl: 'https://bsc-dataseed.binance.org',
    symbol: 'BNB',
    explorer: 'https://bscscan.com',
  },
  polygon: {
    key: 'polygon',
    name: 'Polygon',
    chainId: 137,
    rpcUrl: 'https://polygon-rpc.com',
    symbol: 'MATIC',
    explorer: 'https://polygonscan.com',
  },
};
