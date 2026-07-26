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
};
