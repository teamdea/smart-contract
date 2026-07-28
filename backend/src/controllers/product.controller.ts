import { Request, Response, NextFunction } from "express";
import { productService } from "../services/product.service";
import { ApiError } from "../exceptions/ApiError";
import { ok } from "../utils/response";

export const productController = {
  // Public: a Buyer browsing a Supplier's catalog needs this, and it's
  // identity/pricing information a Supplier already wants visible to
  // shoppers, not sensitive data. Optionally narrowed to one category -
  // a seller can carry products across more than one category, so Create
  // Order must not show the seller's full catalog once a category is
  // already chosen.
  async listBySeller(req: Request, res: Response, next: NextFunction) {
    try {
      const sellerWalletId = req.query.sellerWalletId;
      if (typeof sellerWalletId !== "string" || !sellerWalletId) {
        throw ApiError.badRequest('Query param "sellerWalletId" is required');
      }
      const category = req.query.category;
      const products = await productService.listProductsBySeller(
        sellerWalletId,
        typeof category === "string" && category ? category : undefined
      );
      ok(res, products);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      // requireRole("Supplier") guarantees req.wallet is set - a product is
      // always added to the caller's own catalog, never whatever
      // sellerWalletId the request body might claim.
      const product = await productService.addProduct(req.wallet!.walletId, req.body);
      ok(res, product, 201);
    } catch (err) {
      next(err);
    }
  },
};
