import { useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { verifyWalletAccount, type Wallet } from "../services/api";
import { getSession } from "../services/session";

// Being logged in isn't enough on its own to see your balance - this page
// additionally requires the account number chosen at registration, as a
// second, independent check.
function Wallets() {
  const session = getSession();

  const [accountNumber, setAccountNumber] = useState("");
  const [ownWallet, setOwnWallet] = useState<Wallet | null>(null);
  const [ownWalletError, setOwnWalletError] = useState<string | null>(null);

  function handleVerifyAccount() {
    if (!session) return;
    setOwnWalletError(null);
    setOwnWallet(null);
    verifyWalletAccount(session.walletId, accountNumber.trim())
      .then(setOwnWallet)
      .catch(() => setOwnWalletError("Invalid account number."));
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
              My Wallet — {session?.ownerName} ({session?.walletId})
            </Typography>

            {session?.role === "Logistics" ? (
              <Typography color="text.secondary">
                Logistics accounts are independent delivery-status verifiers and never hold
                escrow funds — there's no balance to check here.
              </Typography>
            ) : (
              <>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  Being signed in isn't enough to view your balance - enter your Account Number
                  (chosen at registration) to confirm it's really you.
                </Typography>
                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Account Number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                  <Button
                    variant="contained"
                    onClick={handleVerifyAccount}
                    disabled={!accountNumber.trim()}
                  >
                    Verify
                  </Button>
                </Stack>

                {ownWalletError && <Alert severity="error" sx={{ mb: 2 }}>{ownWalletError}</Alert>}

                {ownWallet && (
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography sx={{ fontWeight: 600 }}>
                      {ownWallet.ownerName} ({ownWallet.role})
                    </Typography>
                    <Stack direction="row" spacing={4} sx={{ mt: 1 }}>
                      <Typography>Available: <strong>₹{ownWallet.availableBalance.toLocaleString("en-IN")}</strong></Typography>
                      <Typography>Held: <strong>₹{ownWallet.heldBalance.toLocaleString("en-IN")}</strong></Typography>
                    </Stack>
                  </Paper>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

export default Wallets;
