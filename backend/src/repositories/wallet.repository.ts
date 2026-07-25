import crypto from "crypto";
import { Wallet, WalletRole } from "../models/Wallet";
import { store } from "./store";
import { STARTING_BUYER_BALANCE, STARTING_SUPPLIER_BALANCE } from "../config/constants";

function generateWalletSecret(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

export const walletRepository = {
  async findAll(): Promise<Wallet[]> {
    return store.get("wallets");
  },

  async findById(walletId: string): Promise<Wallet | undefined> {
    return store.get("wallets").find((wallet) => wallet.walletId === walletId);
  },

  // Auto-provisions a wallet with a starting synthetic balance the first
  // time an order references it - there's no separate "open an account"
  // step in this hackathon build.
  async findOrCreate(walletId: string, ownerName: string, role: WalletRole): Promise<Wallet> {
    const existing = await this.findById(walletId);
    if (existing) return existing;

    const wallet: Wallet = {
      walletId,
      ownerName,
      role,
      availableBalance: role === "Buyer" ? STARTING_BUYER_BALANCE : STARTING_SUPPLIER_BALANCE,
      heldBalance: 0,
      walletSecret: generateWalletSecret(),
      secretRevealed: false,
    };
    const wallets = store.get("wallets");
    wallets.push(wallet);
    store.set("wallets", wallets);
    return wallet;
  },

  async update(walletId: string, patch: Partial<Wallet>): Promise<Wallet | undefined> {
    const wallets = store.get("wallets");
    const index = wallets.findIndex((wallet) => wallet.walletId === walletId);
    if (index === -1) return undefined;
    wallets[index] = { ...wallets[index], ...patch };
    store.set("wallets", wallets);
    return wallets[index];
  },

  // Returns the wallet's secret exactly once - the moment its owner is
  // first introduced to the system (order creation). Every call after that
  // returns null, even though the wallet itself still exists.
  async revealSecretIfNew(walletId: string): Promise<string | null> {
    const wallet = await this.findById(walletId);
    if (!wallet || wallet.secretRevealed) return null;
    await this.update(walletId, { secretRevealed: true });
    return wallet.walletSecret;
  },

  // Balance lookups must prove ownership with the secret - the wallet ID
  // alone (visible to any counterparty on a shared order) isn't enough.
  async verifySecret(walletId: string, secret: string): Promise<Wallet | undefined> {
    const wallet = await this.findById(walletId);
    if (!wallet || wallet.walletSecret !== secret) return undefined;
    return wallet;
  },
};
