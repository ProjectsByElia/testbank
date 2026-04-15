import { useCallback, useEffect, useMemo, useState } from 'react';
import * as bip39 from 'bip39';
import { Client, Wallet as XrpWalletLib } from 'xrpl';
import { hasVault, loadFromVault, saveToVault } from '@/lib/crypto/vault';

const CHAIN_KEY = 'xrp';
const WSS_URL = 'wss://xrplcluster.com';

function formatXrp(drops: string | number) {
  const d = typeof drops === 'string' ? Number(drops) : drops;
  return (d).toString();
}

export function useXrpWallet() {
  const [address, setAddress] = useState<string>('');
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [hasVaultForChain, setHasVaultForChain] = useState<boolean>(hasVault(CHAIN_KEY));
  const chainLabel = useMemo(() => 'XRP', []);

  const deriveFromMnemonic = useCallback(async (mnemonic: string) => {
    const w = XrpWalletLib.fromMnemonic(mnemonic);
    return { address: w.classicAddress, privateKey: w.privateKey } as const;
  }, []);

  const ensureVault = useCallback(async (passkey: string) => {
    setLoading(true);
    try {
      const existing = await loadFromVault(CHAIN_KEY, passkey);
      if (existing) {
        const { address } = await deriveFromMnemonic(existing.mnemonic);
        setAddress(address);
        setHasVaultForChain(true);
        return true;
      }
      const mnemonic = bip39.generateMnemonic(128);
      await saveToVault(CHAIN_KEY, passkey, { mnemonic, createdAt: new Date().toISOString() });
      const { address } = await deriveFromMnemonic(mnemonic);
      setAddress(address);
      setHasVaultForChain(true);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      setLoading(false);
    }
  }, [deriveFromMnemonic]);

  const refreshBalance = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    const client = new Client(WSS_URL);
    try {
      await client.connect();
      const bal = await client.getXrpBalance(address);
      setBalance(String(bal));
    } catch (e) {
      console.error(e);
    } finally {
      try { await client.disconnect(); } catch {}
      setLoading(false);
    }
  }, [address]);

  const revealSecrets = useCallback(async (passkey: string) => {
    const vault = await loadFromVault(CHAIN_KEY, passkey);
    if (!vault) throw new Error('Unlock failed');
    const { privateKey } = await deriveFromMnemonic(vault.mnemonic);
    return { mnemonic: vault.mnemonic, privateKey } as const;
  }, [deriveFromMnemonic]);

  const fetchHistory = useCallback(async () => {
    if (!address) return [] as Array<{ hash: string; time?: number }>;
    const client = new Client(WSS_URL);
    try {
      await client.connect();
      const res = await client.request({
        command: 'account_tx',
        account: address,
        limit: 20,
      } as any);
      const resAny = res as any;
      const list = (resAny.result?.transactions || []) as any[];
      return list.map((t: any) => ({ hash: t.tx?.hash as string, time: t.tx?.date ? Number(t.tx.date) : undefined }));
    } catch (e) {
      console.error(e);
      return [] as Array<{ hash: string; time?: number }>;
    } finally {
      try { await client.disconnect(); } catch {}
    }
  }, [address]);

  useEffect(() => {
    setHasVaultForChain(hasVault(CHAIN_KEY));
  }, []);

  return {
    state: { chain: CHAIN_KEY, chainLabel, address, balance, loading, hasVaultForChain },
    actions: { ensureVault, refreshBalance, revealSecrets, fetchHistory },
  } as const;
}
