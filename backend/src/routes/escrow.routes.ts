import { Router } from "express";
import { escrowController } from "../controllers/escrow.controller";

const router = Router();

router.get("/:orderId", escrowController.getByOrderId);

export default router;
