import { Router } from "express";
import { walletController } from "../controllers/wallet.controller";

const router = Router();

router.get("/", walletController.list);
router.post("/:walletId/lookup", walletController.lookupWithSecret);

export default router;
