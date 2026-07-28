import { Router } from "express";
import { productController } from "../controllers/product.controller";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

router.get("/", productController.listBySeller);
// Supplier-only: a product is always added to the caller's own catalog -
// ownership is enforced inside product.controller.ts's create handler.
router.post("/", requireRole("Supplier"), productController.create);

export default router;
