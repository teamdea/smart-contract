import { useMemo, useState } from "react";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import FormSection from "../components/FormSection";
import SummaryCard from "../components/SummaryCard";

function CreateOrder() {
  const [buyerName, setBuyerName] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [orderAmount, setOrderAmount] = useState(0);
  const [escrowPercent, setEscrowPercent] = useState(10);

  const escrowAmount = useMemo(() => (orderAmount * escrowPercent) / 100, [orderAmount, escrowPercent]);
  const holdAmount = useMemo(() => orderAmount - escrowAmount, [orderAmount, escrowAmount]);

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
          </Grid>
        </FormSection>

        <FormSection title="Merchant Information">
          <Grid container spacing={2}>
            <Grid size={{ xs:12, md:6 }}>
              <TextField fullWidth label="Merchant Name" value={merchantName} onChange={(e)=>setMerchantName(e.target.value)} />
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

        <Button variant="contained">Create Order</Button>
      </Box>
    </Box>
  );
}

export default CreateOrder;
