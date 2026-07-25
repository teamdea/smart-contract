import { useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import LockIcon from "@mui/icons-material/Lock";
import RefreshIcon from "@mui/icons-material/Refresh";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { listWallets, lookupWallet, type Wallet } from "../services/api";

// No customer should be able to browse every other customer's balance - the
// full ledger below is a bank-operator-only view, gated by a shared secret
// (there's no real login system in this build; see SETUP.md). A single
// wallet's balance also requires that wallet's own PIN - the ID alone (which
// counterparties see on a shared order) isn't proof of ownership.
function Wallets() {
  const [secret, setSecret] = useState("");
  const [wallets, setWallets] = useState<Wallet[] | null>(null);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [lookupId, setLookupId] = useState("");
  const [lookupPin, setLookupPin] = useState("");
  const [lookedUpWallet, setLookedUpWallet] = useState<Wallet | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  function unlock() {
    setUnlockError(null);
    setLoading(true);
    listWallets(secret)
      .then(setWallets)
      .catch(() => {
        setWallets(null);
        setUnlockError("Incorrect Bank Operator secret.");
      })
      .finally(() => setLoading(false));
  }

  function lock() {
    setWallets(null);
    setSecret("");
  }

  function handleLookup() {
    setLookupError(null);
    setLookedUpWallet(null);
    lookupWallet(lookupId.trim(), lookupPin.trim())
      .then(setLookedUpWallet)
      .catch(() => setLookupError("Invalid wallet ID or PIN."));
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
          Wallets
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 4 }}>
          "Held" is money frozen under a fund-hold lien (not yet paid); "Available" is
          spendable/receivable now.
        </Typography>

        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Look up your wallet
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Enter your wallet ID and PIN (both shown once, when your order was created) to
              check your balance.
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Wallet ID"
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
              />
              <TextField
                fullWidth
                type="password"
                label="Wallet PIN"
                value={lookupPin}
                onChange={(e) => setLookupPin(e.target.value)}
              />
              <Button
                variant="contained"
                onClick={handleLookup}
                disabled={!lookupId.trim() || !lookupPin.trim()}
              >
                Look Up
              </Button>
            </Stack>

            {lookupError && <Alert severity="error" sx={{ mb: 2 }}>{lookupError}</Alert>}

            {lookedUpWallet && (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography sx={{ fontWeight: 600 }}>
                  {lookedUpWallet.ownerName} ({lookedUpWallet.role})
                </Typography>
                <Stack direction="row" spacing={4} sx={{ mt: 1 }}>
                  <Typography>Available: <strong>₹{lookedUpWallet.availableBalance.toLocaleString("en-IN")}</strong></Typography>
                  <Typography>Held: <strong>₹{lookedUpWallet.heldBalance.toLocaleString("en-IN")}</strong></Typography>
                </Stack>
              </Paper>
            )}
          </CardContent>
        </Card>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Full Ledger (Bank Operator)
          </Typography>
          {wallets && (
            <Stack direction="row" spacing={1}>
              <IconButton onClick={unlock} aria-label="Refresh">
                <RefreshIcon />
              </IconButton>
              <IconButton onClick={lock} aria-label="Lock">
                <LockIcon />
              </IconButton>
            </Stack>
          )}
        </Box>

        {!wallets && (
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Every customer's balance in one place — internal bank-operator view only.
            </Typography>
            <Stack direction="row" spacing={2} sx={{ maxWidth: 480 }}>
              <TextField
                fullWidth
                type="password"
                label="Bank Operator Secret"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
              />
              <Button variant="contained" onClick={unlock} disabled={!secret || loading}>
                {loading ? "Checking..." : "Unlock"}
              </Button>
            </Stack>
            {unlockError && <Alert severity="error" sx={{ mt: 2 }}>{unlockError}</Alert>}
          </Paper>
        )}

        {wallets && (
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Wallet ID</strong></TableCell>
                  <TableCell><strong>Owner</strong></TableCell>
                  <TableCell><strong>Role</strong></TableCell>
                  <TableCell align="right"><strong>Available</strong></TableCell>
                  <TableCell align="right"><strong>Held (Lien)</strong></TableCell>
                  <TableCell align="right"><strong>Total</strong></TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {wallets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                        No wallets yet — create an order to provision one.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}

                {wallets.map((wallet) => (
                  <TableRow key={wallet.walletId} hover>
                    <TableCell>{wallet.walletId}</TableCell>
                    <TableCell>{wallet.ownerName}</TableCell>
                    <TableCell>
                      <Chip
                        label={wallet.role}
                        color={wallet.role === "Buyer" ? "info" : "success"}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">₹{wallet.availableBalance.toLocaleString("en-IN")}</TableCell>
                    <TableCell align="right">₹{wallet.heldBalance.toLocaleString("en-IN")}</TableCell>
                    <TableCell align="right">
                      <strong>₹{(wallet.availableBalance + wallet.heldBalance).toLocaleString("en-IN")}</strong>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
}

export default Wallets;
