import { useCallback, useEffect, useMemo, useState } from 'react';
import * as bip39 from 'bip39';
import { Keypair, Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { derivePath } from 'ed25519-hd-key';
import bs58 from 'bs58';
import { hasVault, loadFromVault, saveToVault } from '@/lib/crypto/vault';

const CHAIN_KEY = 'solana';
const RPC_URL = 'https://api.mainnet-beta.solana.com';

function formatSol(lamports: number) {
  return (lamports / LAMPORTS_PER_SOL).toFixed(6);
}

export function useSolWallet() {
  const [address, setAddress] = useState<string>('');
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [hasVaultForChain, setHasVaultForChain] = useState<boolean>(hasVault(CHAIN_KEY));
  const chainLabel = useMemo(() => 'Solana', []);

  const deriveFromMnemonic = useCallback(async (mnemonic: string) => {
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const path = `m/44'/501'/0'/0'`;
    const { key } = derivePath(path, Buffer.from(seed).toString('hex'));
    const kp = Keypair.fromSeed(Uint8Array.from(key).slice(0, 32));
    const address = kp.publicKey.toBase58();
    const secretKey = bs58.encode(kp.secretKey);
    return { address, secretKey } as const;
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
      const conn = new Connection(RPC_URL, 'confirmed');
      const bal = await conn.getBalance(new PublicKey(address));
      setBalance(formatSol(bal));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [address]);

  const revealSecrets = useCallback(async (passkey: string) => {
    const vault = await loadFromVault(CHAIN_KEY, passkey);
    if (!vault) throw new Error('Unlock failed');
    const { secretKey } = await deriveFromMnemonic(vault.mnemonic);
    return { mnemonic: vault.mnemonic, privateKey: secretKey } as const;
  }, [deriveFromMnemonic]);

  const fetchHistory = useCallback(async () => {
    if (!address) return [] as Array<{ hash: string; time?: number }>;
    try {
      const conn = new Connection(RPC_URL, 'confirmed');
      const sigs = await conn.getSignaturesForAddress(new PublicKey(address), { limit: 20 });
      return sigs.map((s) => ({ hash: s.signature, time: s.blockTime ?? undefined }));
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
