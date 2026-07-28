import crypto from "crypto";
import { Product } from "../models/Product";
import { productRepository } from "../repositories/product.repository";
import { ApiError } from "../exceptions/ApiError";
import { PRODUCT_CATEGORIES } from "../config/constants";

export interface AddProductInput {
  category: string;
  name: string;
  price: number;
  escrowMarginPercent: number;
}

function generateProductId(sequence: number): string {
  const suffix = crypto.randomBytes(2).toString("hex");
  return `PROD-${sequence}-${suffix}`;
}

export const productService = {
  async listProductsBySeller(sellerWalletId: string, category?: string): Promise<Product[]> {
    return category
      ? productRepository.findBySellerAndCategory(sellerWalletId, category)
      : productRepository.findBySellerWalletId(sellerWalletId);
  },

  // Only the Supplier themselves can add to their own catalog - the caller
  // (order.controller.ts's requireRole("Supplier") equivalent) already
  // guarantees sellerWalletId is the authenticated wallet's own ID, not
  // whatever a request body might claim.
  async addProduct(sellerWalletId: string, input: AddProductInput): Promise<Product> {
    if (!PRODUCT_CATEGORIES.includes(input.category)) {
      throw ApiError.badRequest(`category must be one of: ${PRODUCT_CATEGORIES.join(", ")}`);
    }
    if (!input.name.trim()) {
      throw ApiError.badRequest("name is required");
    }
    if (!input.price || input.price <= 0) {
      throw ApiError.badRequest("price must be greater than zero");
    }
    if (
      !input.escrowMarginPercent ||
      input.escrowMarginPercent < 1 ||
      input.escrowMarginPercent > 100
    ) {
      throw ApiError.badRequest("escrowMarginPercent must be between 1 and 100");
    }

    const existingProducts = await productRepository.findAll();
    const productId = generateProductId(1001 + existingProducts.length);

    const product: Product = {
      id: productId,
      sellerWalletId,
      category: input.category,
      name: input.name.trim(),
      price: input.price,
      escrowMarginPercent: input.escrowMarginPercent,
      createdAt: new Date().toISOString(),
    };
    await productRepository.create(product);

    return product;
  },
};
