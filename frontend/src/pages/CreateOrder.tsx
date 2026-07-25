import { useMemo, useState } from "react";
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
import { createOrder } from "../services/api";

// Synthetic wallet id, pre-filled so the form always submits something
// wallet-scoped but editable if you want to demo a specific value.
function generateWalletId(role: "BUYER" | "SUPPLIER"): string {
  return `WALLET-${role}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

function CreateOrder() {
  const navigate = useNavigate();
  const [buyerName, setBuyerName] = useState("");
  const [buyerWalletId, setBuyerWalletId] = useState(() => generateWalletId("BUYER"));
  const [merchantName, setMerchantName] = useState("");
  const [supplierWalletId, setSupplierWalletId] = useState(() => generateWalletId("SUPPLIER"));
  const [orderAmount, setOrderAmount] = useState(0);
  const [escrowPercent, setEscrowPercent] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const escrowAmount = useMemo(() => (orderAmount * escrowPercent) / 100, [orderAmount, escrowPercent]);
  const holdAmount = useMemo(() => orderAmount - escrowAmount, [orderAmount, escrowAmount]);

  const canSubmit =
    buyerName.trim() !== "" &&
    merchantName.trim() !== "" &&
    buyerWalletId.trim() !== "" &&
    supplierWalletId.trim() !== "" &&
    orderAmount > 0 &&
    !submitting;

  async function handleCreateOrder() {
    setError(null);
    setSubmitting(true);
    try {
      const { order, buyerWalletSecret, supplierWalletSecret } = await createOrder({
        buyerName,
        merchantName,
        orderAmount,
        escrowPercent,
        buyerWalletId,
        supplierWalletId,
      });
      navigate(`/settlement/${order.id}`, { state: { buyerWalletSecret, supplierWalletSecret } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setSubmitting(false);
    }
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
            <Grid size={{ xs:12, md:6 }}>
              <TextField fullWidth label="Buyer Name" value={buyerName} onChange={(e)=>setBuyerName(e.target.value)} />
            </Grid>
            <Grid size={{ xs:12, md:6 }}>
              <TextField fullWidth label="Buyer Wallet ID" value={buyerWalletId} onChange={(e)=>setBuyerWalletId(e.target.value)} />
            </Grid>
          </Grid>
        </FormSection>

        <FormSection title="Merchant Information">
          <Grid container spacing={2}>
            <Grid size={{ xs:12, md:6 }}>
              <TextField fullWidth label="Merchant Name" value={merchantName} onChange={(e)=>setMerchantName(e.target.value)} />
            </Grid>
            <Grid size={{ xs:12, md:6 }}>
              <TextField fullWidth label="Supplier Wallet ID" value={supplierWalletId} onChange={(e)=>setSupplierWalletId(e.target.value)} />
            </Grid>
          </Grid>
        </FormSection>

        <FormSection title="Order Information">
          <Grid container spacing={2}>
            <Grid size={{ xs:12, md:6 }}>
              <TextField fullWidth type="number" label="Order Amount" value={orderAmount} onChange={(e)=>setOrderAmount(Number(e.target.value))} />
            </Grid>
            <Grid size={{ xs:12, md:6 }}>
              <TextField select fullWidth label="Escrow %" value={escrowPercent} onChange={(e)=>setEscrowPercent(Number(e.target.value))}>
                {[5,10,15,20].map(v=><MenuItem key={v} value={v}>{v}%</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </FormSection>

        <Grid container spacing={2} sx={{ mb:3 }}>
          <Grid size={{ xs:12, md:4 }}><SummaryCard title="Hold Amount" value={`₹${holdAmount.toLocaleString("en-IN")}`} /></Grid>
          <Grid size={{ xs:12, md:4 }}><SummaryCard title="Escrow Amount" value={`₹${escrowAmount.toLocaleString("en-IN")}`} /></Grid>
          <Grid size={{ xs:12, md:4 }}><SummaryCard title="Settlement Amount" value={`₹${orderAmount.toLocaleString("en-IN")}`} /></Grid>
        </Grid>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Button variant="contained" disabled={!canSubmit} onClick={handleCreateOrder}>
          {submitting ? "Creating..." : "Create Order"}
        </Button>
      </Box>
    </Box>
  );
}

export default CreateOrder;
