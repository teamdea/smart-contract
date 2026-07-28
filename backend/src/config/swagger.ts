// Hand-written OpenAPI 3.0 spec (not auto-generated from code comments) so
// it stays a deliberate, accurate description of the real API surface.
// Served as an interactive page by swagger-ui-express - see app.ts.
export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "Programmable Money & Smart Escrow API",
    version: "1.0.0",
    description:
      "Backend for the escrow hackathon project. All endpoints are mounted under /api/v1. " +
      "Login/Register return a bearer token - use the 'Authorize' button above with " +
      "`Bearer <token>` to try protected endpoints.",
  },
  servers: [{ url: "/api/v1" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        description: "Token returned by POST /auth/login or POST /auth/register.",
      },
      webhookSecret: {
        type: "apiKey",
        in: "header",
        name: "X-Webhook-Secret",
        description: "Shared secret for the simulated external logistics webhook.",
      },
    },
    schemas: {
      Order: {
        type: "object",
        properties: {
          id: { type: "string" },
          buyer: { type: "string" },
          merchant: { type: "string" },
          amount: { type: "number" },
          escrow: { type: "number" },
          status: { type: "string", enum: ["Pending", "Active", "Completed", "Cancelled"] },
          settlement: { type: "string", enum: ["Pending", "In Progress", "Released", "Refunded"] },
          createdOn: { type: "string" },
          escrowId: { type: "string" },
          holdReferenceId: { type: "string" },
          deliverySla: { type: "string" },
          buyerWalletId: { type: "string" },
          supplierWalletId: { type: "string" },
        },
      },
      WalletIdentity: {
        type: "object",
        properties: {
          walletId: { type: "string" },
          ownerName: { type: "string" },
          role: { type: "string", enum: ["Buyer", "Supplier", "Logistics"] },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        tags: ["Health"],
        responses: { "200": { description: "Backend is running" } },
      },
    },
    "/auth/register": {
      post: {
        summary: "Register a new wallet (Buyer, Supplier, or Logistics)",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["walletId", "ownerName", "role", "pin", "accountNumber"],
                properties: {
                  walletId: { type: "string", example: "WALLET-BUYER-DEMO01" },
                  ownerName: { type: "string", example: "Demo Corp" },
                  role: { type: "string", enum: ["Buyer", "Supplier", "Logistics"] },
                  pin: { type: "string", description: "Login credential you choose" },
                  accountNumber: {
                    type: "string",
                    description: "Second credential for viewing balance",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Registered - includes a session token",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/WalletIdentity" } },
            },
          },
          "409": { description: "Wallet ID already registered" },
        },
      },
    },
    "/auth/login": {
      post: {
        summary: "Log in with Wallet ID + PIN",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["walletId", "pin"],
                properties: { walletId: { type: "string" }, pin: { type: "string" } },
              },
            },
          },
        },
        responses: {
          "200": { description: "Logged in - includes a session token" },
          "401": { description: "Invalid wallet ID or PIN" },
        },
      },
    },
    "/orders": {
      get: {
        summary: "List all orders",
        tags: ["Orders"],
        responses: {
          "200": {
            description: "All orders",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Order" } },
              },
            },
          },
        },
      },
      post: {
        summary: "Create an order (Buyer only)",
        tags: ["Orders"],
        security: [{ bearerAuth: [] }],
        description:
          "buyerWalletId is taken from the authenticated session, not the request body - " +
          "a logged-in buyer can't impersonate another buyer. orderAmount and the escrow " +
          "margin are never taken from the request either - both are derived server-side " +
          "from the given productId (see GET /products), so a tampered request can't order " +
          "a high-value product at a lower margin than its seller defined.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["supplierWalletId", "productId"],
                properties: {
                  supplierWalletId: { type: "string" },
                  productId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Order created",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Order" } } },
          },
          "400": {
            description: "Missing/invalid input, or a wallet isn't registered with the right role",
          },
          "401": { description: "Missing or invalid session token" },
          "403": { description: "Signed-in account is not a Buyer" },
        },
      },
    },
    "/orders/{id}": {
      get: {
        summary: "Get a single order",
        tags: ["Orders"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "The order",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Order" } } },
          },
          "404": { description: "Order not found" },
        },
      },
    },
    "/orders/{id}/delivery": {
      post: {
        summary: "Report delivery status (Logistics only)",
        tags: ["Orders"],
        security: [{ bearerAuth: [] }],
        description:
          "Drives real settlement/refund on the Daml ledger + simulated CBS. " +
          "Deliberately restricted to Logistics accounts - never the Buyer or Supplier.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: { status: { type: "string", enum: ["Delivered", "Failed"] } },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated order",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Order" } } },
          },
          "401": { description: "Missing or invalid session token" },
          "403": { description: "Signed-in account is not Logistics" },
        },
      },
    },
    "/escrows/{orderId}": {
      get: {
        summary: "Get the escrow record for an order",
        tags: ["Escrows"],
        parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "The escrow record" },
          "404": { description: "No escrow found for that order" },
        },
      },
    },
    "/oracle/shipments/{orderId}": {
      get: {
        summary: "Get the last known shipment status for an order",
        tags: ["Oracle"],
        parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Shipment status (defaults to Pending if none recorded yet)" },
        },
      },
    },
    "/oracle/webhook": {
      post: {
        summary: "External logistics webhook (simulated)",
        tags: ["Oracle"],
        security: [{ webhookSecret: [] }],
        description:
          "What a real courier/logistics system would call automatically, as an alternative " +
          "to a human clicking Mark Delivered/Failed on the Logistics page. Same effect as " +
          "POST /orders/:id/delivery, but authenticated with a shared secret instead of a login.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["orderId", "status"],
                properties: {
                  orderId: { type: "string" },
                  status: { type: "string", enum: ["Delivered", "Failed"] },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Updated order" },
          "401": { description: "Missing or wrong X-Webhook-Secret header" },
        },
      },
    },
    "/dashboard/summary": {
      get: {
        summary: "Dashboard + reports aggregate data",
        tags: ["Dashboard"],
        responses: {
          "200": {
            description:
              "Summary cards, platform status, activity feed, recent orders, report metrics",
          },
        },
      },
    },
    "/wallets": {
      get: {
        summary: "Identity-only directory of registered wallets (no balances)",
        tags: ["Wallets"],
        description: "Backs the Supplier dropdown on Create Order.",
        parameters: [
          {
            name: "role",
            in: "query",
            required: true,
            schema: { type: "string", enum: ["Buyer", "Supplier"] },
          },
        ],
        responses: {
          "200": {
            description: "Matching wallets",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/WalletIdentity" } },
              },
            },
          },
          "400": { description: 'Missing/invalid "role" query param' },
        },
      },
    },
    "/wallets/{walletId}/verify-account": {
      post: {
        summary: "Step-up check: view a wallet's balance with its Account Number",
        tags: ["Wallets"],
        description:
          "Independent of login - proves the caller also knows the account number chosen " +
          "at registration, not just that they're logged in.",
        parameters: [{ name: "walletId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["accountNumber"],
                properties: { accountNumber: { type: "string" } },
              },
            },
          },
        },
        responses: {
          "200": { description: "Wallet with balance" },
          "404": { description: "Invalid wallet ID or account number" },
        },
      },
    },
  },
};
