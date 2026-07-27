import { Router } from "express";
import { oracleController } from "../controllers/oracle.controller";

const router = Router();

router.get("/shipments/:orderId", oracleController.getShipmentStatus);
router.post("/webhook", oracleController.handleWebhook);

export default router;
