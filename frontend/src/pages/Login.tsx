import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";

import { login, register } from "../services/api";
import { setSession } from "../services/session";
import { apiErrorMessage } from "../utils/errors";

type FormRole = "Buyer" | "Supplier";
type View = "roleSelect" | FormRole;

// The seeded Logistics account (see backend/scripts/seed.ts) - Logistics has
// no login screen of its own, so clicking the Logistics button on the
// landing screen signs straight into this fixed identity. The backend's
// requireRole("Logistics") check on delivery-status endpoints still runs
// for real - this just means the user never sees a login form for it.
const LOGISTICS_WALLET_ID = "WALLET-LOGISTICS-MAIN01";
const LOGISTICS_PIN = "333333";

function generateWalletId(role: FormRole): string {
  const prefix = role === "Buyer" ? "BUYER" : "SUPPLIER";
  return `WALLET-${prefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

function Login() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("roleSelect");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login fields
  const [loginWalletId, setLoginWalletId] = useState("");
  const [loginPin, setLoginPin] = useState("");

  // Register fields
  const [ownerName, setOwnerName] = useState("");
  const [walletId, setWalletId] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  function openForm(role: FormRole) {
    setView(role);
    setMode("login");
    setError(null);
    setLoginWalletId("");
    setLoginPin("");
    setOwnerName("");
    setWalletId(generateWalletId(role));
    setPin("");
    setConfirmPin("");
    setAccountNumber("");
  }

  function goBack() {
    setView("roleSelect");
    setError(null);
  }

  async function handleLogisticsClick() {
    setError(null);
    setSubmitting(true);
    try {
      const session = await login(LOGISTICS_WALLET_ID, LOGISTICS_PIN);
      setSession(session);
      navigate("/logistics");
    } catch {
      setError(
        "Logistics demo account isn't set up on this backend yet - run \"npm run seed\" in backend/ first."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogin() {
    setError(null);
    setSubmitting(true);
    try {
      const session = await login(loginWalletId.trim(), loginPin.trim());
      setSession(session);
      navigate("/dashboard");
    } catch {
      setError("Invalid wallet ID or PIN.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister(role: FormRole) {
    setError(null);
    if (pin !== confirmPin) {
      setError("PIN and Confirm PIN don't match.");
      return;
    }
    if (!ownerName.trim() || !walletId.trim() || !pin.trim() || !accountNumber.trim()) {
      setError("All fields are required.");
      return;
    }
    setSubmitting(true);
    try {
      const session = await register({
        walletId: walletId.trim(),
        ownerName: ownerName.trim(),
        role,
        pin: pin.trim(),
        accountNumber: accountNumber.trim(),
      });
      setSession(session);
      navigate("/dashboard");
    } catch (err) {
      setError(apiErrorMessage(err, "Registration failed - that Wallet ID may already be taken."));
    } finally {
      setSubmitting(false);
    }
  }

  const roleLabel = view === "Supplier" ? "Seller" : view;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        bgcolor: "#f4f6f8",
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 480, width: "100%", borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Programmable Money & Smart Escrow
          </Typography>

          {view === "roleSelect" ? (
            <>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Continue as:
              </Typography>

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <Stack spacing={2}>
                <Button
                  fullWidth
                  size="large"
                  variant="contained"
                  startIcon={<ShoppingCartIcon />}
                  onClick={() => openForm("Buyer")}
                >
                  Buyer
                </Button>
                <Button
                  fullWidth
                  size="large"
                  variant="contained"
                  startIcon={<StorefrontIcon />}
                  onClick={() => openForm("Supplier")}
                >
                  Seller
                </Button>
                <Button
                  fullWidth
                  size="large"
                  variant="outlined"
                  startIcon={<LocalShippingIcon />}
                  disabled={submitting}
                  onClick={handleLogisticsClick}
                >
                  {submitting ? "Opening Logistics..." : "Logistics"}
                </Button>
              </Stack>

              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
                Logistics has no login - it opens directly, since it's an independent
                delivery-status verifier rather than a financial party.
              </Typography>
            </>
          ) : (
            <>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Signed in as <strong>{roleLabel}</strong>. Sign in with your Wallet ID and PIN, or
                register a new wallet.
              </Typography>

              <Tabs value={mode} onChange={(_e, v) => { setMode(v); setError(null); }} sx={{ mb: 3 }}>
                <Tab label="Login" value="login" />
                <Tab label="Register" value="register" />
              </Tabs>

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              {mode === "login" ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Wallet ID"
                    value={loginWalletId}
                    onChange={(e) => setLoginWalletId(e.target.value)}
                  />
                  <TextField
                    fullWidth
                    type="password"
                    label="PIN"
                    value={loginPin}
                    onChange={(e) => setLoginPin(e.target.value)}
                  />
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleLogin}
                    disabled={submitting || !loginWalletId.trim() || !loginPin.trim()}
                  >
                    {submitting ? "Signing in..." : "Login"}
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Company / Owner Name"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                  />
                  <TextField
                    fullWidth
                    label="Wallet ID"
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    helperText="Auto-generated - you can edit it"
                  />
                  <TextField
                    fullWidth
                    type="password"
                    label="Choose a PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                  />
                  <TextField
                    fullWidth
                    type="password"
                    label="Confirm PIN"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                  />
                  <TextField
                    fullWidth
                    label="Account Number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    helperText="A second credential, separate from your PIN - you'll need this again to view your balance on the Wallets page"
                  />
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => handleRegister(view)}
                    disabled={submitting}
                  >
                    {submitting ? "Registering..." : "Register & Continue"}
                  </Button>
                </Box>
              )}

              <Button sx={{ mt: 2 }} onClick={goBack}>
                &larr; Back
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default Login;
