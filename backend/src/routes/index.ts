import { Router } from "express";
import healthRoutes from "./health.routes";
import orderRoutes from "./order.routes";
import escrowRoutes from "./escrow.routes";
import oracleRoutes from "./oracle.routes";
import dashboardRoutes from "./dashboard.routes";
import walletRoutes from "./wallet.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/orders", orderRoutes);
router.use("/escrows", escrowRoutes);
router.use("/oracle", oracleRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/wallets", walletRoutes);

export default router;