import { useEffect, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import FormSection from "../components/FormSection";
import { addProduct, listProductsBySeller, type Product } from "../services/api";
import { getSession } from "../services/session";
import { apiErrorMessage } from "../utils/errors";
import { PRODUCT_CATEGORIES } from "../config/productCategories";

function SellerProducts() {
  const session = getSession();

  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [escrowMarginPercent, setEscrowMarginPercent] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    if (!session) return;
    listProductsBySeller(session.walletId)
      .then(setProducts)
      .catch(() => setProducts([]));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSubmit = category !== "" && name.trim() !== "" && price > 0 && !submitting;

  async function handleAddProduct() {
    setError(null);
    setSubmitting(true);
    try {
      await addProduct({ category, name: name.trim(), price, escrowMarginPercent });
      setName("");
      setPrice(0);
      setEscrowMarginPercent(10);
      refresh();
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to add product"));
    } finally {
      setSubmitting(false);
    }
  }

  if (session?.role !== "Supplier") {
    return (
      <Box sx={{ display: "flex" }}>
        <Navbar />
        <Sidebar />
        <Box component="main" sx={{ flexGrow: 1, bgcolor: "#f4f6f8", minHeight: "100vh", p: 3 }}>
          <Toolbar />
          <Alert severity="warning">
            Only registered sellers can manage products. You're signed in as a{" "}
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
          My Products
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Add products under your business category. Each product carries its own price and its
          own escrow margin - a high-value item doesn't need to use the same margin as a
          low-value one.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <FormSection title="Add a Product">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                fullWidth
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                helperText="Your business sector"
              >
                {PRODUCT_CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                fullWidth
                label="Product Name"
                placeholder="e.g. Mercedes Benz C-Class"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Price"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Escrow Margin %"
                value={escrowMarginPercent}
                onChange={(e) => setEscrowMarginPercent(Number(e.target.value))}
                helperText="Higher-value products typically need a higher margin"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Button variant="contained" disabled={!canSubmit} onClick={handleAddProduct}>
                {submitting ? "Adding..." : "Add Product"}
              </Button>
            </Grid>
          </Grid>
        </FormSection>

        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Category</strong></TableCell>
                <TableCell><strong>Product</strong></TableCell>
                <TableCell align="right"><strong>Price</strong></TableCell>
                <TableCell align="right"><strong>Escrow Margin</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                      No products added yet.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {products.map((product) => (
                <TableRow key={product.id} hover>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell align="right">₹{product.price.toLocaleString("en-IN")}</TableCell>
                  <TableCell align="right">{product.escrowMarginPercent}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}

export default SellerProducts;
