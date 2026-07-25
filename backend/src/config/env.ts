import path from "path";

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.length > 0 ? value : fallback;
}

export const env = {
  port: Number(optional("PORT", "3000")),
  nodeEnv: optional("NODE_ENV", "development"),

  dataFilePath: optional(
    "DATA_FILE_PATH",
    path.resolve(__dirname, "../../data/db.json")
  ),

  damlJsonApiUrl: optional("DAML_JSON_API_URL", "http://localhost:7575"),
  damlLedgerId: optional("DAML_LEDGER_ID", "sandbox"),
  damlApplicationId: optional("DAML_APPLICATION_ID", "programmable-money-backend"),
  // Sandbox started via `daml start` runs with a wildcard auth service that
  // does not verify the JWT signature, so any HMAC secret works locally.
  damlJwtSecret: optional("DAML_JWT_SECRET", "hackathon-dev-secret"),
  damlDarPath: optional(
    "DAML_DAR_PATH",
    path.resolve(__dirname, "../../../daml/.daml/dist/escrow-0.0.1.dar")
  ),

  // Shared secret an external logistics/courier system would present when
  // calling POST /oracle/webhook, distinct from the merchant's manual
  // "Mark Delivered" button on the Logistics page (which needs no secret,
  // since there's no auth system in this hackathon build).
  logisticsWebhookSecret: optional("LOGISTICS_WEBHOOK_SECRET", "hackathon-webhook-secret"),

  // Gates the full wallet ledger (GET /wallets) - a bank's own back office
  // legitimately sees every customer's balance, but no individual buyer or
  // supplier should be able to browse everyone else's. There's no real
  // login system in this build, so a shared secret stands in for
  // "signed in as the bank operator." Looking up a single known wallet by
  // ID (GET /wallets/:walletId) stays open, simulating a customer checking
  // their own account - the residual gap is that a wallet ID isn't a real
  // credential, so anyone who *learns* another party's wallet ID (e.g. from
  // an order they're a counterparty on) could still look that one up.
  bankOperatorSecret: optional("BANK_OPERATOR_SECRET", "hackathon-bank-operator-secret"),
};
