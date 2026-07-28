import { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import LinearProgress from "@mui/material/LinearProgress";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import SummaryCard from "../components/SummaryCard";
import { getDashboardSummary, type DashboardSummary } from "../services/api";

function Reports() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    getDashboardSummary()
      .then(setSummary)
      .catch(() => setSummary(null));
  }, []);

  const totalOrders = summary?.summaryCards[0]?.value ?? "0";
  const settlementValue = summary?.summaryCards[2]?.value ?? "₹0.00 L";
  const escrowBalance = summary?.reports.escrowBalance ?? "₹0.00 L";
  const successRate = summary?.reports.successRate ?? 0;
  const metrics = summary?.reports.metrics ?? {
    settlementCompletion: 0,
    smartContractExecution: 0,
    oracleVerification: 0,
  };
  const recentOrders = summary?.recentOrders ?? [];

  return (
    <Box sx={{ display: "flex" }}>
      <Navbar />
      <Sidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "#f4f6f8",
          minHeight: "100vh",
          p: 3,
        }}
      >
        <Toolbar />

        <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
          Reports & Analytics
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Overview of escrow orders, settlements and platform performance.
        </Typography>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <SummaryCard title="Total Orders" value={totalOrders} />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <SummaryCard title="Settlement Value" value={settlementValue} />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <SummaryCard title="Escrow Balance" value={escrowBalance} />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <SummaryCard title="Success Rate" value={`${successRate}%`} />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                  Platform Metrics
                </Typography>

                <Typography gutterBottom>Settlement Completion</Typography>
                <LinearProgress
                  variant="determinate"
                  value={metrics.settlementCompletion}
                  sx={{ mb: 3 }}
                />

                <Typography gutterBottom>Smart Contract Execution</Typography>
                <LinearProgress
                  variant="determinate"
                  value={metrics.smartContractExecution}
                  sx={{ mb: 3 }}
                />

                <Typography gutterBottom>Oracle Verification</Typography>
                <LinearProgress variant="determinate" value={metrics.oracleVerification} />
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Recent Transactions
                </Typography>

                <List>
                  {recentOrders.map((order) => (
                    <ListItem key={order.id} divider>
                      <ListItemText
                        primary={order.id}
                        secondary={`₹${order.amount.toLocaleString("en-IN")}`}
                      />
                      <Typography variant="body2">{order.status}</Typography>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default Reports;
