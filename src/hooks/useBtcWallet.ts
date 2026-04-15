import { useCallback, useEffect, useMemo, useState } from 'react';
import * as bip39 from 'bip39';
import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
import { hasVault, loadFromVault, saveToVault } from '@/lib/crypto/vault';

bitcoin.initEccLib(ecc);
const bip32 = BIP32Factory(ecc);

const CHAIN_KEY = 'bitcoin';

function formatBtc(sats: number) {
  return (sats / 1e8).toFixed(8);
}

export function useBtcWallet() {
  const [address, setAddress] = useState<string>('');
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [hasVaultForChain, setHasVaultForChain] = useState<boolean>(hasVault(CHAIN_KEY));
  const chainLabel = useMemo(() => 'Bitcoin', []);

  const deriveFromMnemonic = useCallback(async (mnemonic: string) => {
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const root = bip32.fromSeed(seed, bitcoin.networks.bitcoin);
    const child = root.derivePath("m/44'/0'/0'/0/0");
    const { address } = bitcoin.payments.p2pkh({ pubkey: child.publicKey as any, network: bitcoin.networks.bitcoin });
    const privWif = child.toWIF();
    return { address: address!, privateKey: privWif };
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
    try {
      const res = await fetch(`https://blockstream.info/api/address/${address}`);
      const json = await res.json();
      const funded = json.chain_stats?.funded_txo_sum ?? 0;
      const spent = json.chain_stats?.spent_txo_sum ?? 0;
      setBalance(formatBtc(funded - spent));
    } catch (e) {
      console.error(e);
    } finally {
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
    try {
      const res = await fetch(`https://blockstream.info/api/address/${address}/txs`);
      const list = await res.json();
      return (list as any[]).map((tx) => ({ hash: tx.txid as string, time: tx.status?.block_time as number | undefined }));
    } catch (e) {
      console.error(e);
      return [] as Array<{ hash: string; time?: number }>;
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
