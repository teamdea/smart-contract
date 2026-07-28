import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import FormSection from "../components/FormSection";
import SummaryCard from "../components/SummaryCard";
import {
  createOrder,
  listProductsBySeller,
  listWalletsByRole,
  type Product,
  type WalletIdentity,
} from "../services/api";
import { getSession } from "../services/session";
import { apiErrorMessage } from "../utils/errors";
import { PRODUCT_CATEGORIES } from "../config/productCategories";

function CreateOrder() {
  const navigate = useNavigate();
  const session = getSession();

  const [category, setCategory] = useState("");
  const [suppliers, setSuppliers] = useState<WalletIdentity[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [supplierWalletId, setSupplierWalletId] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productId, setProductId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === productId),
    [products, productId]
  );
  const orderAmount = selectedProduct?.price ?? 0;
  const escrowPercent = selectedProduct?.escrowMarginPercent ?? 0;
  const escrowAmount = Math.round((orderAmount * escrowPercent) / 100);
  const holdAmount = orderAmount - escrowAmount;

  // Step 1 -> 2: picking a category loads the sellers registered under it.
  useEffect(() => {
    setSupplierWalletId("");
    setProducts([]);
    setProductId("");
    if (!category) {
      setSuppliers([]);
      return;
    }
    setSuppliersLoading(true);
    listWalletsByRole("Supplier", category)
      .then(setSuppliers)
      .catch(() => setSuppliers([]))
      .finally(() => setSuppliersLoading(false));
  }, [category]);

  // Step 2 -> 3: picking a seller loads their product catalog, narrowed to
  // the category already chosen in Step 1 - a seller can carry products
  // across more than one category, so this must not show their full catalog.
  useEffect(() => {
    setProductId("");
    if (!supplierWalletId) {
      setProducts([]);
      return;
    }
    setProductsLoading(true);
    listProductsBySeller(supplierWalletId, category)
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));
  }, [supplierWalletId, category]);

  const canSubmit = session?.role === "Buyer" && productId !== "" && !submitting;

  async function handleCreateOrder() {
    if (!session) return;
    setError(null);
    setSubmitting(true);
    try {
      const order = await createOrder({ supplierWalletId, productId });
      navigate(`/settlement/${order.id}`);
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to create order"));
    } finally {
      setSubmitting(false);
    }
  }

  if (session?.role !== "Buyer") {
    return (
      <Box sx={{ display: "flex" }}>
        <Navbar />
        <Sidebar />
        <Box component="main" sx={{ flexGrow: 1, bgcolor: "#f4f6f8", minHeight: "100vh", p: 3 }}>
          <Toolbar />
          <Alert severity="warning">
            Only registered buyers can create orders. You're signed in as a{" "}
            <strong>{session?.role ?? "guest"}</strong>.
          </Alert>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex" }}>
      <Navbar />
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, bgcolor: "#f4f6f8", minHeight: "100vh", p: 3 }}>
        <Toolbar />
        <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
          Create Escrow Order
        </Typography>

        <FormSection title="Buyer Information">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label="Buyer Name" value={session.ownerName} disabled />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label="Buyer Wallet ID" value={session.walletId} disabled />
            </Grid>
          </Grid>
        </FormSection>

        <FormSection title="Choose a Product">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                fullWidth
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {PRODUCT_CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                fullWidth
                label="Seller"
                value={supplierWalletId}
                onChange={(e) => setSupplierWalletId(e.target.value)}
                disabled={!category || suppliersLoading}
                helperText={
                  !category
                    ? "Pick a category first"
                    : suppliersLoading
                      ? "Loading sellers..."
                      : suppliers.length === 0
                        ? "No sellers in this category yet"
                        : "Pick who you're buying from"
                }
              >
                {suppliers.map((supplier) => (
                  <MenuItem key={supplier.walletId} value={supplier.walletId}>
                    {supplier.ownerName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                fullWidth
                label="Product"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                disabled={!supplierWalletId || productsLoading}
                helperText={
                  !supplierWalletId
                    ? "Pick a seller first"
                    : productsLoading
                      ? "Loading products..."
                      : products.length === 0
                        ? "This seller has no products yet"
                        : "Pick what you're buying"
                }
              >
                {products.map((product) => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.name} - ₹{product.price.toLocaleString("en-IN")}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </FormSection>

        {selectedProduct && (
          <FormSection title="Order Information">
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Order amount and escrow margin are fixed by the seller for this product - not editable
              here.
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Order Amount"
                  value={`₹${orderAmount.toLocaleString("en-IN")}`}
                  disabled
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="Escrow Margin" value={`${escrowPercent}%`} disabled />
              </Grid>
            </Grid>
          </FormSection>
        )}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <SummaryCard title="Hold Amount" value={`₹${holdAmount.toLocaleString("en-IN")}`} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <SummaryCard title="Escrow Amount" value={`₹${escrowAmount.toLocaleString("en-IN")}`} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <SummaryCard
              title="Settlement Amount"
              value={`₹${orderAmount.toLocaleString("en-IN")}`}
            />
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Button variant="contained" disabled={!canSubmit} onClick={handleCreateOrder}>
          {submitting ? "Creating..." : "Create Order"}
        </Button>
      </Box>
    </Box>
  );
}

export default CreateOrder;
