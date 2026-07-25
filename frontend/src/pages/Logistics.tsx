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

// This is the merchant/logistics operator's screen: the only place delivery
// status is reported for an order. Reporting it here is what drives the
// Logistics Oracle simulation on the backend and releases (or refunds) the
// held escrow funds - see Escrow.daml's ConfirmDelivery / FailOrExpireDelivery.
function Logistics() {
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
          ? `${order.id} marked delivered — escrow released to ${order.merchant}.`
          : `${order.id} marked failed — escrow refunded to ${order.buyer}.`
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update delivery status");
    } finally {
      setBusyOrderId(null);
    }
  }

  const pendingOrders = orders.filter((order) => order.status === "Active");

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
          Merchant / logistics partner view. Reporting delivery status here is what triggers escrow
          settlement (funds released) or refund (funds returned to the buyer) on the ledger.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Order ID</strong></TableCell>
                <TableCell><strong>Buyer</strong></TableCell>
                <TableCell><strong>Merchant</strong></TableCell>
                <TableCell align="right"><strong>Order Value</strong></TableCell>
                <TableCell><strong>Delivery SLA</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
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

              {pendingOrders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.buyer}</TableCell>
                  <TableCell>{order.merchant}</TableCell>
                  <TableCell align="right">₹{order.amount.toLocaleString("en-IN")}</TableCell>
                  <TableCell>{order.deliverySla}</TableCell>
                  <TableCell>
                    <Chip label="Awaiting Delivery" color="warning" size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        disabled={busyOrderId === order.id}
                        onClick={() => handleUpdate(order, "Delivered")}
                      >
                        Mark Delivered
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        disabled={busyOrderId === order.id}
                        onClick={() => handleUpdate(order, "Failed")}
                      >
                        Mark Failed
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
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
