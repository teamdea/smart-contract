import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { confirmOrder, listOrders, type Order } from "../services/api";
import { getOrderLifecycleState, getOrderLifecycleColor } from "../utils/orderState";
import { getSession } from "../services/session";
import { apiErrorMessage } from "../utils/errors";

const FULFILLMENT_LABELS: Record<Order["fulfillmentStatus"], string> = {
  AwaitingConfirmation: "Awaiting Confirmation",
  Confirmed: "Confirmed",
};

const FULFILLMENT_COLORS: Record<Order["fulfillmentStatus"], "default" | "info"> = {
  AwaitingConfirmation: "default",
  Confirmed: "info",
};

function Orders() {
  const navigate = useNavigate();
  const session = getSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function refresh() {
    return listOrders()
      .then(setOrders)
      .catch(() => setOrders([]));
  }

  useEffect(() => {
    refresh();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(search.toLowerCase()) ||
        order.buyer.toLowerCase().includes(search.toLowerCase()) ||
        order.merchant.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        status === "All" || order.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, status]);

  const statusColor = (value: string) => {
    switch (value) {
      case "Completed":
        return "success";
      case "Active":
        return "primary";
      case "Pending":
        return "warning";
      case "Cancelled":
        return "error";
      default:
        return "default";
    }
  };

  // Only the order's own Supplier gets the Confirm Order action - the
  // backend re-checks this ownership too, this just avoids showing a
  // button that would fail if clicked.
  function isOwnSupplierOrder(order: Order): boolean {
    return session?.role === "Supplier" && order.supplierWalletId === session.walletId;
  }

  async function handleConfirm(order: Order, e: React.MouseEvent) {
    e.stopPropagation();
    setActionError(null);
    setBusyOrderId(order.id);
    try {
      await confirmOrder(order.id);
      await refresh();
    } catch (err) {
      setActionError(apiErrorMessage(err, `Could not confirm ${order.id}`));
    } finally {
      setBusyOrderId(null);
    }
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

        <Typography
          variant="h4"
          sx={{ fontWeight: 700 }}
          gutterBottom
        >
          Escrow Orders
        </Typography>

        <Typography
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          Manage and track all programmable money transactions.
        </Typography>

        {actionError && <Alert severity="error" sx={{ mb: 3 }}>{actionError}</Alert>}

        <Grid
          container
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Search Orders"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {["All", "Pending", "Active", "Completed", "Cancelled"].map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid
            size={{ xs: 12, md: 3 }}
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            <Button variant="contained" onClick={() => navigate("/create-order")}>
              Create Order
            </Button>
          </Grid>
        </Grid>

        <TableContainer
          component={Paper}
          sx={{ borderRadius: 3 }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Order ID</strong></TableCell>
                <TableCell><strong>Buyer</strong></TableCell>
                <TableCell><strong>Merchant</strong></TableCell>
                <TableCell align="right"><strong>Order Value</strong></TableCell>
                <TableCell align="right"><strong>Escrow</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Contract State</strong></TableCell>
                <TableCell><strong>Fulfillment</strong></TableCell>
                <TableCell><strong>Settlement</strong></TableCell>
                <TableCell><strong>Created On</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow
                  key={order.id}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => navigate(`/settlement/${order.id}`)}
                >
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.buyer}</TableCell>
                  <TableCell>{order.merchant}</TableCell>
                  <TableCell align="right">
                    ₹{order.amount.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell align="right">
                    ₹{order.escrow.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.status}
                      color={statusColor(order.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getOrderLifecycleState(order)}
                      color={getOrderLifecycleColor(getOrderLifecycleState(order))}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={FULFILLMENT_LABELS[order.fulfillmentStatus]}
                      color={FULFILLMENT_COLORS[order.fulfillmentStatus]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{order.settlement}</TableCell>
                  <TableCell>{order.createdOn}</TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    {isOwnSupplierOrder(order) && order.fulfillmentStatus === "AwaitingConfirmation" && (
                      <Button
                        size="small"
                        variant="contained"
                        disabled={busyOrderId === order.id}
                        onClick={(e) => handleConfirm(order, e)}
                      >
                        Confirm Order
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}

export default Orders;
