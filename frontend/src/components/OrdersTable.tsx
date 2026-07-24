import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

import { recentOrders } from "../data/dashboardData";

function OrdersTable() {
  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
      }}
    >
      <Typography
        variant="h6"
        sx={{
          mb: 2,
          fontWeight: 700,
        }}
      >
        Recent Orders
      </Typography>

      <TableContainer>
        <Table>

          <TableHead>
            <TableRow>

              <TableCell>Order ID</TableCell>

              <TableCell>Customer</TableCell>

              <TableCell>Amount</TableCell>

              <TableCell>Escrow</TableCell>

              <TableCell>Settlement</TableCell>

            </TableRow>
          </TableHead>

          <TableBody>

            {recentOrders.map((order) => (

              <TableRow key={order.id}>

                <TableCell>
                  {order.id}
                </TableCell>

                <TableCell>
                  {order.customer}
                </TableCell>

                <TableCell>
                  {order.amount}
                </TableCell>

                <TableCell>

                  <Chip
                    label={order.escrow}
                    color={
                      order.escrow === "Active"
                        ? "success"
                        : "warning"
                    }
                    size="small"
                  />

                </TableCell>

                <TableCell>

                  <Chip
                    label={order.settlement}
                    color={
                      order.settlement === "Completed"
                        ? "success"
                        : order.settlement === "In Progress"
                          ? "info"
                          : "warning"
                    }
                    size="small"
                  />

                </TableCell>

              </TableRow>

            ))}

          </TableBody>

        </Table>
      </TableContainer>

      <Box
        sx={{
          mt: 2,
          textAlign: "right",
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
        >
          Showing latest programmable money transactions
        </Typography>
      </Box>

    </Paper>
  );
}

export default OrdersTable;