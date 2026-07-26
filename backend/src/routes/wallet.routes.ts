import { Router } from "express";
import { walletController } from "../controllers/wallet.controller";

const router = Router();

router.get("/", walletController.listByRole);
router.post("/:walletId/verify-account", walletController.verifyAccount);

export default router;
