import { Router } from "express";
import { orderController } from "../controllers/order.controller";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

router.get("/", orderController.list);
router.get("/:id", orderController.getOne);
// Buyer-only: the caller's own wallet is used as buyerWalletId, not
// whatever the request body claims - see orderController.create.
router.post("/", requireRole("Buyer"), orderController.create);
// Logistics-only: the independent delivery-status verifier, never the
// supplier being paid - see requireRole's comment for why.
router.post("/:id/delivery", requireRole("Logistics"), orderController.reportDelivery);
// Supplier-only: only the order's own supplier can confirm it - ownership
// is checked again inside order.service.ts.
router.post("/:id/confirm", requireRole("Supplier"), orderController.confirm);

export default router;
