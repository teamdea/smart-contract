import { Wallet } from "../models/Wallet";

declare global {
  namespace Express {
    interface Request {
      // Set by middleware/role.middleware.ts once the Authorization bearer
      // token has been resolved to the wallet that's actually calling.
      wallet?: Wallet;
    }
  }
}

export {};
