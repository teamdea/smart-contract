const SESSION_KEY = "pm_session";

export interface Session {
  walletId: string;
  ownerName: string;
  role: "Buyer" | "Supplier" | "Logistics";
  // Bearer token proving this session is real, issued at login/register -
  // sent on protected write requests (create order, report delivery) so
  // the backend can verify who's actually calling, not just trust the UI.
  token: string;
}

// Stored in localStorage (not sessionStorage) specifically so it's shared
// across browser tabs - Logistics and Wallets open in new tabs and still
// need to see who's logged in.
export function getSession(): Session | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function setSession(session: Session): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
