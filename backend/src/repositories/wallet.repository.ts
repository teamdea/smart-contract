import { Wallet, WalletRole } from "../models/Wallet";
import { store } from "./store";
import { STARTING_BUYER_BALANCE } from "../config/constants";

function startingBalance(role: WalletRole): number {
  // Only Buyers start funded; Suppliers start empty so a settlement visibly
  // credits money in; Logistics never holds money at all.
  return role === "Buyer" ? STARTING_BUYER_BALANCE : 0;
}

export interface RegisterWalletParams {
  walletId: string;
  ownerName: string;
  role: WalletRole;
  pin: string;
  accountNumber: string;
}

export const walletRepository = {
  async findAll(): Promise<Wallet[]> {
    return store.get("wallets");
  },

  async findById(walletId: string): Promise<Wallet | undefined> {
    return store.get("wallets").find((wallet) => wallet.walletId === walletId);
  },

  async findByRole(role: WalletRole): Promise<Wallet[]> {
    return store.get("wallets").filter((wallet) => wallet.role === role);
  },

  // Explicit sign-up: the wallet ID must not already be taken. Unlike the
  // old auto-provision-on-first-order model, a wallet now only comes into
  // existence when its owner registers it with their own chosen PIN and
  // account number.
  async register(params: RegisterWalletParams): Promise<Wallet | "ALREADY_EXISTS"> {
    if (await this.findById(params.walletId)) {
      return "ALREADY_EXISTS";
    }

    const wallet: Wallet = {
      walletId: params.walletId,
      ownerName: params.ownerName,
      role: params.role,
      availableBalance: startingBalance(params.role),
      heldBalance: 0,
      pin: params.pin,
      accountNumber: params.accountNumber,
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

  // Login: proves "I am this wallet" with the PIN chosen at registration.
  async verifyLogin(walletId: string, pin: string): Promise<Wallet | undefined> {
    const wallet = await this.findById(walletId);
    if (!wallet || wallet.pin !== pin) return undefined;
    return wallet;
  },

  // Step-up check for viewing balance on the Wallets page - a second,
  // independent credential from the login PIN.
  async verifyAccountNumber(walletId: string, accountNumber: string): Promise<Wallet | undefined> {
    const wallet = await this.findById(walletId);
    if (!wallet || wallet.accountNumber !== accountNumber) return undefined;
    return wallet;
  },
};
