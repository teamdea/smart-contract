import { useMemo, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
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

interface Order {
  id: string;
  buyer: string;
  merchant: string;
  amount: number;
  escrow: number;
  status: "Pending" | "Active" | "Completed" | "Cancelled";
  settlement: string;
  createdOn: string;
}

const orders: Order[] = [
  {
    id: "ORD-1001",
    buyer: "ABC Manufacturing",
    merchant: "XYZ Equipment",
    amount: 10000000,
    escrow: 1000000,
    status: "Active",
    settlement: "Pending",
    createdOn: "01-Jul-2026",
  },
  {
    id: "ORD-1002",
    buyer: "Global Motors",
    merchant: "Tech Systems",
    amount: 5000000,
    escrow: 500000,
    status: "Completed",
    settlement: "Released",
    createdOn: "05-Jul-2026",
  },
  {
    id: "ORD-1003",
    buyer: "Prime Industries",
    merchant: "Delta Logistics",
    amount: 2500000,
    escrow: 250000,
    status: "Pending",
    settlement: "Awaiting Approval",
    createdOn: "08-Jul-2026",
  },
];

function Orders() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

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
  }, [search, status]);

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
            <Button variant="contained">
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
                <TableCell><strong>Settlement</strong></TableCell>
                <TableCell><strong>Created On</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id} hover>
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
                  <TableCell>{order.settlement}</TableCell>
                  <TableCell>{order.createdOn}</TableCell>
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
