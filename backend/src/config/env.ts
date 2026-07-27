import path from "path";

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.length > 0 ? value : fallback;
}

export const env = {
  port: Number(optional("PORT", "3000")),
  nodeEnv: optional("NODE_ENV", "development"),

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

  // Firestore is the real data store (see repositories/*.ts) - orders,
  // wallets, escrows, shipments, and activities all live in this database.
  // Auth uses the developer's own `gcloud auth login` session (via
  // `gcloud auth print-access-token`, see repositories/firestore.client.ts)
  // rather than a service account key, because this workshop GCP account
  // isn't permitted to create service accounts. This was BigQuery before -
  // that dataset still exists in the GCP project but is no longer read from
  // or written to.
  gcpProjectId: optional("GCP_PROJECT_ID", "ltc-hack2026-team25"),
  firestoreDatabaseId: optional("FIRESTORE_DATABASE_ID", "he-man"),
};
