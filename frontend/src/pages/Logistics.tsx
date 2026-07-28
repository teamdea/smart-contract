import { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { listOrders, updateDeliveryStatus, type Order } from "../services/api";
import { getSession } from "../services/session";
import { apiErrorMessage } from "../utils/errors";

// ProductVerified/ProductFailed/DeliveryFailed orders never actually show up
// in this table - Logistics only sees still-Active orders (see
// pendingOrders below), and all three of those are terminal/resolved
// states. Still needed here for TypeScript's Record exhaustiveness.
const FULFILLMENT_CHIP: Record<
  Order["fulfillmentStatus"],
  { label: string; color: "default" | "warning" | "info" | "success" | "error" }
> = {
  AwaitingConfirmation: { label: "Awaiting Seller Confirmation", color: "default" },
  Confirmed: { label: "In Transit", color: "warning" },
  AwaitingBuyerVerification: { label: "Delivered - Awaiting Buyer Verification", color: "info" },
  ProductVerified: { label: "Product Verified", color: "success" },
  ProductFailed: { label: "Product Failed", color: "error" },
  DeliveryFailed: { label: "Delivery Failed", color: "error" },
};

// This is the independent Logistics Oracle's screen (architecture diagram
// box 5: "Trusted Delivery Tracker") - the only place delivery status is
// reported for an order. Reporting it here is what drives the Logistics
// Oracle simulation on the backend and releases (or refunds) the held
// escrow funds - see Escrow.daml's ConfirmDelivery / FailOrExpireDelivery.
// Restricted to Logistics-role sessions, deliberately NOT the Supplier:
// the party being paid should never be the same party who certifies that
// delivery happened - that would just be self-attestation and would
// defeat the point of the escrow.
function Logistics() {
  const session = getSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function refresh() {
    setLoading(true);
    return listOrders()
      .then(setOrders)
      .catch(() => setError("Could not reach the backend"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleUpdate(order: Order, status: "Delivered" | "Failed") {
    setError(null);
    setBusyOrderId(order.id);
    try {
      await updateDeliveryStatus(order.id, status);
      setToast(
        status === "Delivered"
          ? `${order.id} marked delivered — awaiting ${order.buyer}'s verification before funds move.`
          : `${order.id} marked failed — escrow refunded to ${order.buyer}.`
      );
      await refresh();
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to update delivery status"));
    } finally {
      setBusyOrderId(null);
    }
  }

  const pendingOrders = orders.filter((order) => order.status === "Active");

  if (session?.role !== "Logistics") {
    return (
      <Box sx={{ display: "flex" }}>
        <Navbar />
        <Sidebar />
        <Box component="main" sx={{ flexGrow: 1, bgcolor: "#f4f6f8", minHeight: "100vh", p: 3 }}>
          <Toolbar />
          <Alert severity="warning">
            Only a registered Logistics account can update delivery status here — deliberately not
            the buyer or the supplier, so the party being paid can't certify their own delivery.
            You're signed in as a <strong>{session?.role ?? "guest"}</strong>.
          </Alert>
        </Box>
      </Box>
    );
  }

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
          Logistics — Delivery Updates
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Independent logistics/courier view — not the buyer or the supplier. An order shows "In
          Transit" once its Supplier confirms it. Marking a shipment Failed (never arrived) refunds
          the buyer immediately. Marking it Delivered does not release funds by itself - it only
          confirms the package physically arrived; the Buyer still has to verify the product itself
          before the supplier gets paid.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Order ID</strong>
                </TableCell>
                <TableCell>
                  <strong>Buyer</strong>
                </TableCell>
                <TableCell>
                  <strong>Merchant</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Order Value</strong>
                </TableCell>
                <TableCell>
                  <strong>Delivery SLA</strong>
                </TableCell>
                <TableCell>
                  <strong>Status</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Actions</strong>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {!loading && pendingOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                      No shipments awaiting a delivery update.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}

              {pendingOrders.map((order) => {
                const shipped = order.fulfillmentStatus === "Confirmed";
                const chip = FULFILLMENT_CHIP[order.fulfillmentStatus];
                return (
                  <TableRow key={order.id} hover>
                    <TableCell>{order.id}</TableCell>
                    <TableCell>{order.buyer}</TableCell>
                    <TableCell>{order.merchant}</TableCell>
                    <TableCell align="right">₹{order.amount.toLocaleString("en-IN")}</TableCell>
                    <TableCell>{order.deliverySla}</TableCell>
                    <TableCell>
                      <Chip label={chip.label} color={chip.color} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          disabled={!shipped || busyOrderId === order.id}
                          onClick={() => handleUpdate(order, "Delivered")}
                        >
                          Mark Delivered
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          disabled={!shipped || busyOrderId === order.id}
                          onClick={() => handleUpdate(order, "Failed")}
                        >
                          Mark Failed
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Snackbar
          open={toast !== null}
          autoHideDuration={5000}
          onClose={() => setToast(null)}
          message={toast}
        />
      </Box>
    </Box>
  );
}

export default Logistics;
