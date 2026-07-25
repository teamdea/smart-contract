import { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";

import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LockIcon from "@mui/icons-material/Lock";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import SummaryCard from "../components/SummaryCard";
import StatusCard from "../components/StatusCard";
import ProgressCard from "../components/ProgressCard";
import ActivityCard from "../components/ActivityCard";
import OrdersTable from "../components/OrdersTable";

import { getDashboardSummary, type DashboardSummary } from "../services/api";

const EMPTY_SUMMARY_CARDS = [
  { title: "Total Orders", value: "0" },
  { title: "Active Escrows", value: "0" },
  { title: "Settlement Value", value: "₹0.00 L" },
  { title: "Completed Orders", value: "0" },
];

const summaryIcons = [
  <ShoppingCartIcon fontSize="large" />,
  <LockIcon fontSize="large" />,
  <CurrencyRupeeIcon fontSize="large" />,
  <CheckCircleIcon fontSize="large" />,
];

function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    getDashboardSummary()
      .then(setSummary)
      .catch(() => setLoadError(true));
  }, []);

  const summaryCards = summary?.summaryCards ?? EMPTY_SUMMARY_CARDS;
  const platformStatus = summary?.platformStatus ?? [];
  const activities = summary?.activities ?? [];
  const recentOrders = summary?.recentOrders ?? [];
  const settlementProgress = summary?.reports.metrics.settlementCompletion ?? 0;

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

        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            }}
          gutterBottom
        >
          Banking Operations Dashboard
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 4 }}
        >
          Programmable Money & Smart Escrow Platform
        </Typography>

        {loadError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Could not reach the backend at {import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1"}.
            Is it running?
          </Alert>
        )}

        {/* Summary Cards */}

        <Grid
          container
          spacing={3}
          sx={{ mb: 3 }}
        >
          {summaryCards.map((card, index) => (
            <Grid
              key={card.title}
              size={{
                xs: 12,
                sm: 6,
                lg: 3,
              }}
            >
              <SummaryCard
                title={card.title}
                value={card.value}
                icon={summaryIcons[index]}
              />
            </Grid>
          ))}
        </Grid>

        {/* Status + Progress + Activity */}

        <Grid
          container
          spacing={3}
          sx={{ mb: 3 }}
        >
          <Grid
            size={{
              xs: 12,
              md: 4,
            }}
          >
            <StatusCard
              title="Platform Status"
              items={platformStatus}
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              md: 4,
            }}
          >
            <ProgressCard
              title="Settlement Progress"
              value={settlementProgress}
              description={`${settlementProgress}% of escrow settlements have been completed successfully.`}
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              md: 4,
            }}
          >
            <ActivityCard
              title="Recent Activities"
              activities={activities}
            />
          </Grid>
        </Grid>

        {/* Orders */}

        <Grid
          container
          spacing={3}
        >
          <Grid
            size={{
              xs: 12,
            }}
          >
            <OrdersTable orders={recentOrders} />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default Dashboard;