import { execFileSync } from "child_process";
import { env } from "../config/env";
import { LedgerError } from "../exceptions/LedgerError";

// Daml package IDs are content hashes of the compiled DAR, so they change
// whenever Escrow.daml is edited and rebuilt. Rather than hardcode one,
// resolve it once at startup by asking the Daml CLI to inspect the DAR
// (`daml damlc inspect-dar` prints entries like
// "escrow-0.0.1-<64 hex chars>/...") and cache it for the process lifetime.
let cachedPackageId: string | null = null;

export function resolvePackageId(): string {
  if (cachedPackageId) {
    return cachedPackageId;
  }

  let output: string;
  try {
    output = execFileSync("daml", ["damlc", "inspect-dar", env.damlDarPath], {
      encoding: "utf-8",
      // Windows resolves .cmd/.bat shims (like the Daml CLI installer uses)
      // through the shell, not through direct exec.
      shell: process.platform === "win32",
    });
  } catch (err) {
    throw new LedgerError(
      `Could not run "daml damlc inspect-dar" against ${env.damlDarPath}. ` +
        `Make sure the Daml SDK is on your PATH and "daml build" has run in the daml/ project. (${(err as Error).message})`
    );
  }

  const match = output.match(/escrow-[\d.]+-([0-9a-f]{64})/);
  if (!match) {
    throw new LedgerError(`Could not resolve the escrow package ID from ${env.damlDarPath}`);
  }

  cachedPackageId = match[1];
  return cachedPackageId;
}
