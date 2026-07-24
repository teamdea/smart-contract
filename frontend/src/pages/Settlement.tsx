import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const stages = [
  { title: "Buyer", status: "Completed", color: "success" },
  { title: "Funds Hold (CBS)", status: "Completed", color: "success" },
  { title: "Escrow Smart Contract", status: "Completed", color: "success" },
  { title: "Logistics Oracle", status: "Processing", color: "warning" },
  { title: "Settlement", status: "Waiting", color: "default" },
  { title: "Merchant", status: "Waiting", color: "default" },
] as const;

function Settlement() {
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
          Settlement Workflow
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Track the end-to-end programmable money settlement lifecycle.
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                  Escrow Settlement Flow
                </Typography>

                <Stack spacing={2}>
                  {stages.map((stage, index) => (
                    <Box key={stage.title}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          {stage.status === "Completed" ? (
                            <CheckCircleIcon color="success" />
                          ) : (
                            <HourglassTopIcon color="warning" />
                          )}

                          <Typography sx={{ fontWeight: 600 }}>
                            {stage.title}
                          </Typography>
                        </Box>

                        <Chip
                          label={stage.status}
                          color={stage.color as any}
                          size="small"
                        />
                      </Box>

                      {index !== stages.length - 1 && (
                        <Box
                          sx={{
                            ml: 1,
                            my: 1,
                            display: "flex",
                            justifyContent: "center",
                          }}
                        >
                          <ArrowDownwardIcon color="disabled" />
                        </Box>
                      )}
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Current Transaction
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Stack spacing={2}>
                  <Typography><strong>Order ID:</strong> ORD-1001</Typography>
                  <Typography><strong>Buyer:</strong> ABC Manufacturing</Typography>
                  <Typography><strong>Merchant:</strong> XYZ Equipment</Typography>
                  <Typography><strong>Order Value:</strong> ₹1,00,00,000</Typography>
                  <Typography><strong>Escrow:</strong> ₹10,00,000</Typography>
                  <Typography><strong>Settlement:</strong> Pending Oracle Verification</Typography>

                  <Button variant="contained">
                    Trigger Settlement
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default Settlement;
