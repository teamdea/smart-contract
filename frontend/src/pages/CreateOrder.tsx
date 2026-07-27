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
import { createOrder, listWalletsByRole, type WalletIdentity } from "../services/api";
import { getSession } from "../services/session";

function CreateOrder() {
  const navigate = useNavigate();
  const session = getSession();

  const [suppliers, setSuppliers] = useState<WalletIdentity[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [supplierWalletId, setSupplierWalletId] = useState("");
  const [orderAmount, setOrderAmount] = useState(0);
  const [escrowPercent, setEscrowPercent] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const escrowAmount = useMemo(() => (orderAmount * escrowPercent) / 100, [orderAmount, escrowPercent]);
  const holdAmount = useMemo(() => orderAmount - escrowAmount, [orderAmount, escrowAmount]);

  // Buyers pick a registered supplier by name, not by typing/knowing their
  // Wallet ID - the dropdown is populated from every registered supplier.
  useEffect(() => {
    listWalletsByRole("Supplier")
      .then(setSuppliers)
      .catch(() => setSuppliers([]))
      .finally(() => setSuppliersLoading(false));
  }, []);

  const canSubmit =
    session?.role === "Buyer" &&
    supplierWalletId !== "" &&
    orderAmount > 0 &&
    !submitting;

  async function handleCreateOrder() {
    if (!session) return;
    setError(null);
    setSubmitting(true);
    try {
      const order = await createOrder({
        supplierWalletId,
        orderAmount,
        escrowPercent,
      });
      navigate(`/settlement/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order");
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
            <Grid size={{ xs:12, md:6 }}>
              <TextField fullWidth label="Buyer Name" value={session.ownerName} disabled />
            </Grid>
            <Grid size={{ xs:12, md:6 }}>
              <TextField fullWidth label="Buyer Wallet ID" value={session.walletId} disabled />
            </Grid>
          </Grid>
        </FormSection>

        <FormSection title="Supplier Information">
          <Grid container spacing={2}>
            <Grid size={{ xs:12, md:6 }}>
              <TextField
                select
                fullWidth
                label="Supplier"
                value={supplierWalletId}
                onChange={(e) => setSupplierWalletId(e.target.value)}
                helperText={
                  suppliersLoading
                    ? "Loading registered suppliers..."
                    : suppliers.length === 0
                      ? "No suppliers registered yet"
                      : "Pick who you're paying"
                }
                disabled={suppliersLoading || suppliers.length === 0}
              >
                {suppliers.map((supplier) => (
                  <MenuItem key={supplier.walletId} value={supplier.walletId}>
                    {supplier.ownerName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs:12, md:6 }}>
              <TextField fullWidth label="Supplier Wallet ID" value={supplierWalletId || "—"} disabled />
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
