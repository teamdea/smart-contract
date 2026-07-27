import crypto from "crypto";

// In-memory session tokens issued at login/register. Deliberately not
// persisted to the JSON store - if the backend restarts, everyone just logs
// in again, which is fine for a hackathon demo. This is what lets protected
// endpoints (e.g. reporting delivery) verify who is actually calling them,
// instead of trusting whatever the client claims - the frontend hiding a
// button is not real access control on its own.
const tokenToWalletId = new Map<string, string>();

export const sessionService = {
  createSession(walletId: string): string {
    const token = crypto.randomBytes(24).toString("hex");
    tokenToWalletId.set(token, walletId);
    return token;
  },

  resolveToken(token: string | undefined): string | undefined {
    if (!token) return undefined;
    return tokenToWalletId.get(token);
  },
};
