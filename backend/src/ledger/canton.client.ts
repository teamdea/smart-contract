import crypto from "crypto";
import { env } from "../config/env";
import { LedgerError } from "../exceptions/LedgerError";
import { DamlContract, DamlParty } from "./contract.types";

function base64url(input: Buffer): string {
  return input.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// The Daml Sandbox started via `daml start` runs a wildcard auth service
// that requires a structurally valid JWT but does not verify its signature,
// so any HMAC secret works for local development (see SETUP.md).
function buildToken(actAs: string[], readAs: string[] = actAs): string {
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    "https://daml.com/ledger-api": {
      ledgerId: env.damlLedgerId,
      applicationId: env.damlApplicationId,
      actAs,
      readAs,
    },
  };

  const h = base64url(Buffer.from(JSON.stringify(header)));
  const p = base64url(Buffer.from(JSON.stringify(payload)));
  const signature = crypto.createHmac("sha256", env.damlJwtSecret).update(`${h}.${p}`).digest();
  return `${h}.${p}.${base64url(signature)}`;
}

async function damlRequest<T>(
  path: string,
  body: unknown,
  actAs: string[],
  method: "GET" | "POST" = "POST"
): Promise<T> {
  const token = buildToken(actAs);
  const response = await fetch(`${env.damlJsonApiUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    ...(method === "POST" ? { body: JSON.stringify(body) } : {}),
  });

  const json = (await response.json()) as { status: number; result?: T; errors?: string[] };

  if (!response.ok || json.status >= 400) {
    throw new LedgerError((json.errors ?? [`HTTP ${response.status}`]).join("; "));
  }

  return json.result as T;
}

export const cantonClient = {
  async create<TPayload>(
    templateId: string,
    payload: TPayload,
    actAs: string[]
  ): Promise<DamlContract<TPayload>> {
    return damlRequest<DamlContract<TPayload>>("/v1/create", { templateId, payload }, actAs);
  },

  async exercise<TResult>(
    templateId: string,
    contractId: string,
    choice: string,
    argument: Record<string, unknown>,
    actAs: string[]
  ): Promise<{ exerciseResult: TResult }> {
    return damlRequest<{ exerciseResult: TResult }>(
      "/v1/exercise",
      { templateId, contractId, choice, argument },
      actAs
    );
  },

  async query<TPayload>(templateId: string, actAs: string[]): Promise<DamlContract<TPayload>[]> {
    return damlRequest<DamlContract<TPayload>[]>("/v1/query", { templateIds: [templateId] }, actAs);
  },

  async listParties(): Promise<DamlParty[]> {
    // GET /v1/parties lists every known party; POST is a different endpoint
    // (look up specific party identifiers). Still needs a structurally
    // valid JWT from the wildcard auth service.
    return damlRequest<DamlParty[]>("/v1/parties", undefined, [], "GET");
  },
};
