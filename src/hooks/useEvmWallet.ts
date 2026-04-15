import { useCallback, useEffect, useMemo, useState } from 'react';
import { evmAdapter } from '@/lib/chain/evmAdapter';
import { EVM_CHAINS, EvmChainKey } from '@/lib/chain/types';
import { hasVault, loadFromVault, saveToVault } from '@/lib/crypto/vault';
import { authenticator } from 'otplib';

const TOTP_KEY = 'usdtbanc:totp:secret';

function getTotpSecret(): string | null {
  return localStorage.getItem(TOTP_KEY);
}

function setTotpSecret(secret: string) {
  localStorage.setItem(TOTP_KEY, secret);
}

export function useEvmWallet(initialChain: EvmChainKey = 'ethereum') {
  const [chain, setChain] = useState<EvmChainKey>(initialChain);
  const [address, setAddress] = useState<string>('');
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [hasVaultForChain, setHasVaultForChain] = useState<boolean>(hasVault(initialChain));
  const [otpEnrolled, setOtpEnrolled] = useState<boolean>(!!getTotpSecret());
  const [otpUri, setOtpUri] = useState<string>('');

  const chainLabel = useMemo(() => EVM_CHAINS[chain].name, [chain]);

  const enrollTotp = useCallback((accountLabel = 'USDT Banc Wallet') => {
    const secret = authenticator.generateSecret();
    setTotpSecret(secret);
    setOtpEnrolled(true);
    const uri = authenticator.keyuri(accountLabel, 'USDT Banc', secret);
    setOtpUri(uri);
    return { secret, uri };
  }, []);

  const ensureVault = useCallback(async (passkey: string) => {
    setLoading(true);
    try {
      const existing = await loadFromVault(chain, passkey);
      if (existing) {
        const addr = evmAdapter.getAddressFromMnemonic(existing.mnemonic);
        setAddress(addr);
        setHasVaultForChain(true);
        return true;
      }
      // Create new vault with fresh mnemonic using ethers Wallet
      const { Wallet } = await import('ethers');
      const w = Wallet.createRandom();
      await saveToVault(chain, passkey, { mnemonic: w.mnemonic?.phrase || w.privateKey, createdAt: new Date().toISOString() });
      const addr = evmAdapter.getAddressFromMnemonic(w.mnemonic?.phrase || w.privateKey);
      setAddress(addr);
      setHasVaultForChain(true);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      setLoading(false);
    }
  }, [chain]);

  const refreshBalance = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const bal = await evmAdapter.getBalance(chain, address);
      setBalance(bal);
    } finally {
      setLoading(false);
    }
  }, [chain, address]);

  const send = useCallback(async (params: { passkey: string; to: string; amountEth: string; otpCode: string }) => {
    const secret = getTotpSecret();
    if (!secret) throw new Error('2FA not enrolled');
    const isValid = authenticator.check(params.otpCode, secret);
    if (!isValid) throw new Error('Invalid 2FA code');

    const vault = await loadFromVault(chain, params.passkey);
    if (!vault) throw new Error('Unlock failed');
    const hash = await evmAdapter.sendTransaction({ chain, mnemonic: vault.mnemonic, to: params.to, amountEth: params.amountEth });
    return hash;
  }, [chain]);

  useEffect(() => {
    setHasVaultForChain(hasVault(chain));
  }, [chain]);

  return {
    state: { chain, address, balance, loading, hasVaultForChain, otpEnrolled, otpUri, chainLabel },
    actions: { setChain, ensureVault, refreshBalance, enrollTotp, send, revealSecrets: async (passkey: string) => {
      const vault = await loadFromVault(chain, passkey);
      if (!vault) throw new Error('Unlock failed');
      const { Wallet } = await import('ethers');
      const w = Wallet.fromPhrase(vault.mnemonic);
      return { mnemonic: vault.mnemonic, privateKey: w.privateKey } as const;
    } },
  } as const;
}

