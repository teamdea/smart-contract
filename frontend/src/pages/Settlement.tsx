import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

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
import Alert from "@mui/material/Alert";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import CancelIcon from "@mui/icons-material/Cancel";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { getOrder, type Order } from "../services/api";
import { getOrderLifecycleState, getOrderLifecycleColor } from "../utils/orderState";

type StageStatus = "Completed" | "Processing" | "Waiting" | "Failed";

function getStages(order: Order): { title: string; status: StageStatus }[] {
  const isPending = order.status === "Pending";
  const isActive = order.status === "Active";
  const isCompleted = order.status === "Completed";
  const finalStatus: StageStatus = isActive || isPending ? "Waiting" : isCompleted ? "Completed" : "Failed";

  return [
    { title: "Buyer", status: "Completed" },
    // Nothing is held and no escrow exists until the Supplier confirms -
    // both these stages are genuinely still "Waiting" for a Pending order,
    // not a formality that already happened at order creation.
    { title: "Funds Hold (CBS)", status: isPending ? "Waiting" : "Completed" },
    { title: "Escrow Smart Contract", status: isPending ? "Waiting" : "Completed" },
    { title: "Logistics Oracle", status: isPending ? "Waiting" : isActive ? "Processing" : "Completed" },
    { title: "Settlement", status: finalStatus },
    {
      title: isCompleted ? "Merchant" : "Buyer (Refund)",
      status: isActive || isPending ? "Waiting" : finalStatus,
    },
  ];
}

const CHIP_COLOR: Record<StageStatus, "success" | "warning" | "default" | "error"> = {
  Completed: "success",
  Processing: "warning",
  Waiting: "default",
  Failed: "error",
};

function StageIcon({ status }: { status: StageStatus }) {
  if (status === "Completed") return <CheckCircleIcon color="success" />;
  if (status === "Failed") return <CancelIcon color="error" />;
  return <HourglassTopIcon color={status === "Processing" ? "warning" : "disabled"} />;
}

function Settlement() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    getOrder(orderId)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [orderId]);

  const stages = order ? getStages(order) : [];
  const isResolved = order ? order.status === "Completed" || order.status === "Cancelled" : false;

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

        {!orderId && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Select an order from the Orders page to view its settlement workflow.
          </Alert>
        )}

        {orderId && !loading && !order && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Order {orderId} was not found.
          </Alert>
        )}

        {order && (
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
                            <StageIcon status={stage.status} />

                            <Typography sx={{ fontWeight: 600 }}>{stage.title}</Typography>
                          </Box>

                          <Chip
                            label={stage.status}
                            color={CHIP_COLOR[stage.status]}
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
                    <Typography>
                      <strong>Order ID:</strong> {order.id}
                    </Typography>
                    <Typography>
                      <strong>Buyer:</strong> {order.buyer}
                    </Typography>
                    <Typography>
                      <strong>Buyer Wallet:</strong> {order.buyerWalletId}
                    </Typography>
                    <Typography>
                      <strong>Merchant:</strong> {order.merchant}
                    </Typography>
                    <Typography>
                      <strong>Supplier Wallet:</strong> {order.supplierWalletId}
                    </Typography>
                    <Typography>
                      <strong>Order Value:</strong> ₹{order.amount.toLocaleString("en-IN")}
                    </Typography>
                    <Typography>
                      <strong>Escrow:</strong> ₹{order.escrow.toLocaleString("en-IN")}
                    </Typography>
                    <Typography>
                      <strong>Settlement:</strong> {order.settlement}
                    </Typography>

                    <Box>
                      <Typography sx={{ mb: 0.5 }}>
                        <strong>Contract State:</strong>
                      </Typography>
                      <Chip
                        label={getOrderLifecycleState(order)}
                        color={getOrderLifecycleColor(getOrderLifecycleState(order))}
                        size="small"
                      />
                    </Box>

                    {!isResolved && order.status === "Pending" && (
                      <Alert severity="info">
                        Waiting on the Supplier to confirm this order — nothing is held or
                        escrowed until then.
                      </Alert>
                    )}

                    {!isResolved && order.status === "Active" && (
                      <Alert severity="info">
                        Waiting on the merchant to report delivery from the{" "}
                        <strong>Logistics</strong> page — that's what releases or refunds the held
                        escrow funds.
                      </Alert>
                    )}

                    <Button
                      variant="outlined"
                      onClick={() =>
                        isResolved
                          ? navigate("/orders")
                          : window.open("/logistics", "_blank", "noopener,noreferrer")
                      }
                    >
                      {isResolved ? "Back to Orders" : "Go to Logistics"}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
}

export default Settlement;
