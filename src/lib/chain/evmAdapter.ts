import { Contract, JsonRpcProvider, Wallet, formatEther, parseEther, formatUnits } from 'ethers';
import { EVM_CHAINS, EvmChainKey, EvmAdapter } from './types';

const getProvider = (chain: EvmChainKey) => new JsonRpcProvider(EVM_CHAINS[chain].rpcUrl);

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

export const evmAdapter: EvmAdapter = {
  getAddressFromMnemonic: (mnemonic: string, accountIndex = 0) => {
    // Standard EVM derivation path
    const wallet = Wallet.fromPhrase(mnemonic);
    return wallet.address;
  },
  getBalance: async (chain: EvmChainKey, address: string) => {
    const provider = getProvider(chain);
    const bal = await provider.getBalance(address);
    return formatEther(bal);
  },
  getErc20Balance: async (chain, tokenAddress, userAddress) => {
    const provider = getProvider(chain);
    const erc20 = new Contract(tokenAddress, ERC20_ABI, provider);
    const [raw, decimals] = await Promise.all([
      erc20.balanceOf(userAddress),
      erc20.decimals(),
    ]);
    return formatUnits(raw, decimals);
  },
  getErc20Transfers: async (chain, tokenAddress, userAddress, lookbackBlocks = 200_000) => {
    const provider = getProvider(chain);
    const latest = await provider.getBlockNumber();
    const fromBlock = Math.max(0, latest - lookbackBlocks);
    const topic0 = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'; // Transfer(address,address,uint256)
    const addrTopic = '0x' + userAddress.toLowerCase().replace(/^0x/, '').padStart(64, '0');

    const logsIn = await provider.getLogs({
      address: tokenAddress,
      fromBlock,
      toBlock: latest,
      topics: [topic0, null, addrTopic],
    });
    const logsOut = await provider.getLogs({
      address: tokenAddress,
      fromBlock,
      toBlock: latest,
      topics: [topic0, addrTopic],
    });
    const all = [...logsIn, ...logsOut].sort((a, b) => (b.blockNumber ?? 0) - (a.blockNumber ?? 0));
    return all.map((l) => ({
      hash: l.transactionHash,
      from: '0x' + l.topics[1].slice(26),
      to: '0x' + l.topics[2].slice(26),
      value: BigInt(l.data).toString(),
      blockNumber: l.blockNumber ?? 0,
    }));
  },
  sendTransaction: async ({ chain, mnemonic, to, amountEth }) => {
    const provider = getProvider(chain);
    const wallet = Wallet.fromPhrase(mnemonic).connect(provider);
    const tx = await wallet.sendTransaction({ to, value: parseEther(amountEth) });
    const receipt = await tx.wait();
    return receipt?.hash ?? tx.hash;
  },
};
