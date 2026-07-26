import { Wallet } from "../models/Wallet";

// `pin` and `accountNumber` must never round-trip in an API response - not
// even to a caller who just proved they know one of them. Otherwise anyone
// briefly holding the bank-operator secret (or a valid login) could harvest
// credentials for later use, long after they're rotated.
export function toPublicWallet(wallet: Wallet) {
  const { pin, accountNumber, ...publicFields } = wallet;
  return publicFields;
}
