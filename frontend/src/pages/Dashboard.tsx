import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

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

import {
  summaryCards,
  platformStatus,
  activities,
} from "../data/dashboardData";

const summaryIcons = [
  <ShoppingCartIcon fontSize="large" />,
  <LockIcon fontSize="large" />,
  <CurrencyRupeeIcon fontSize="large" />,
  <CheckCircleIcon fontSize="large" />,
];

function Dashboard() {
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
              value={82}
              description="82% of escrow settlements have been completed successfully."
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
            <OrdersTable />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default Dashboard;