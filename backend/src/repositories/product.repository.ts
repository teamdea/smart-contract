import { Product } from "../models/Product";
import { getDocument, listDocuments, runQuery, setDocument, whereEquals } from "./firestore.client";

const COLLECTION = "products";

export const productRepository = {
  async findAll(): Promise<Product[]> {
    return listDocuments<Product>(COLLECTION);
  },

  // The product's own id is the Firestore document ID.
  async findById(id: string): Promise<Product | undefined> {
    return getDocument<Product>(COLLECTION, id);
  },

  async findBySellerWalletId(sellerWalletId: string): Promise<Product[]> {
    return runQuery<Product>({
      from: [{ collectionId: COLLECTION }],
      where: whereEquals("sellerWalletId", sellerWalletId),
    });
  },

  // A seller can carry products across more than one category (see
  // Product.ts) - this is the source of truth for "which sellers have
  // something in category X", used by wallet.controller.ts's listByRole to
  // build the Seller dropdown on Create Order.
  async findByCategory(category: string): Promise<Product[]> {
    return runQuery<Product>({
      from: [{ collectionId: COLLECTION }],
      where: whereEquals("category", category),
    });
  },

  // Same two-field filter pattern as wallet.repository.ts's
  // findByRoleAndCategory - runQuery only builds a single fieldFilter, so
  // the category narrowing happens in JS after the sellerWalletId query.
  async findBySellerAndCategory(sellerWalletId: string, category: string): Promise<Product[]> {
    const products = await runQuery<Product>({
      from: [{ collectionId: COLLECTION }],
      where: whereEquals("sellerWalletId", sellerWalletId),
    });
    return products.filter((product) => product.category === category);
  },

  async create(product: Product): Promise<Product> {
    await setDocument(COLLECTION, product.id, { ...product });
    return product;
  },
};
