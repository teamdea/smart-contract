import { Wallet, WalletRole } from "../models/Wallet";
import { getDocument, listDocuments, runQuery, setDocument, updateDocument, whereEquals } from "./firestore.client";

const COLLECTION = "wallets";

export interface RegisterWalletParams {
  walletId: string;
  ownerName: string;
  role: WalletRole;
  pin: string;
  accountNumber: string;
}

export const walletRepository = {
  async findAll(): Promise<Wallet[]> {
    return listDocuments<Wallet>(COLLECTION);
  },

  // walletId is the Firestore document ID - a wallet is always looked up
  // directly by it, never scanned for.
  async findById(walletId: string): Promise<Wallet | undefined> {
    return getDocument<Wallet>(COLLECTION, walletId);
  },

  async findByRole(role: WalletRole): Promise<Wallet[]> {
    return runQuery<Wallet>({
      from: [{ collectionId: COLLECTION }],
      where: whereEquals("role", role),
    });
  },

  // Explicit sign-up: the wallet ID must not already be taken. Unlike the
  // old auto-provision-on-first-order model, a wallet only comes into
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
      pin: params.pin,
      accountNumber: params.accountNumber,
    };

    await setDocument(COLLECTION, wallet.walletId, { ...wallet });

    return wallet;
  },

  async update(walletId: string, patch: Partial<Wallet>): Promise<Wallet | undefined> {
    const existing = await this.findById(walletId);
    if (!existing) return undefined;
    if (Object.keys(patch).length === 0) return existing;

    await updateDocument(COLLECTION, walletId, { ...patch });

    return { ...existing, ...patch };
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
