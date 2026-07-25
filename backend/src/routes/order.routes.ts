import { Router } from "express";
import { orderController } from "../controllers/order.controller";

const router = Router();

router.get("/", orderController.list);
router.get("/:id", orderController.getOne);
router.post("/", orderController.create);
router.post("/:id/delivery", orderController.reportDelivery);

export default router;
