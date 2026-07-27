import { Router } from "express";
import healthRoutes from "./health.routes";
import orderRoutes from "./order.routes";
import escrowRoutes from "./escrow.routes";
import oracleRoutes from "./oracle.routes";
import dashboardRoutes from "./dashboard.routes";
import walletRoutes from "./wallet.routes";
import authRoutes from "./auth.routes";

const router = Router();

// /api/v1 itself isn't a real endpoint - it's just the prefix every real one
// sits under. Without this, hitting it directly gives Express's bare
// "Cannot GET /api/v1" 404, which reads like something's broken.
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Programmable Money API. See /api-docs for the full interactive list of endpoints.",
    docs: "/api-docs",
  });
});

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/orders", orderRoutes);
router.use("/escrows", escrowRoutes);
router.use("/oracle", oracleRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/wallets", walletRoutes);

export default router;