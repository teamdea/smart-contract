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

const recentTransactions = [
  { id: "ORD-1001", amount: "₹1,00,00,000", status: "Pending" },
  { id: "ORD-1002", amount: "₹50,00,000", status: "Completed" },
  { id: "ORD-1003", amount: "₹25,00,000", status: "Active" },
  { id: "ORD-1004", amount: "₹75,00,000", status: "Completed" },
];

function Reports() {
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
          sx={{ fontWeight: 700 }}
          gutterBottom
        >
          Reports & Analytics
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Overview of escrow orders, settlements and platform performance.
        </Typography>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <SummaryCard title="Total Orders" value="124" />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <SummaryCard title="Settlement Value" value="₹18.75 Cr" />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <SummaryCard title="Escrow Balance" value="₹2.40 Cr" />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <SummaryCard title="Success Rate" value="98%" />
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
                <LinearProgress variant="determinate" value={92} sx={{ mb: 3 }} />

                <Typography gutterBottom>Smart Contract Execution</Typography>
                <LinearProgress variant="determinate" value={99} sx={{ mb: 3 }} />

                <Typography gutterBottom>Oracle Verification</Typography>
                <LinearProgress variant="determinate" value={87} />
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
                  {recentTransactions.map((item) => (
                    <ListItem key={item.id} divider>
                      <ListItemText
                        primary={item.id}
                        secondary={item.amount}
                      />
                      <Typography variant="body2">
                        {item.status}
                      </Typography>
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
