import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import MenuItem from "@mui/material/MenuItem";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { login, register } from "../services/api";
import { setSession } from "../services/session";

function generateWalletId(role: "BUYER" | "SUPPLIER" | "LOGISTICS"): string {
  return `WALLET-${role}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login fields
  const [loginWalletId, setLoginWalletId] = useState("");
  const [loginPin, setLoginPin] = useState("");

  // Register fields
  const [ownerName, setOwnerName] = useState("");
  const [role, setRole] = useState<"Buyer" | "Supplier" | "Logistics">("Buyer");
  const [walletId, setWalletId] = useState(() => generateWalletId("BUYER"));
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  function handleRoleChange(newRole: "Buyer" | "Supplier" | "Logistics") {
    setRole(newRole);
    const prefix = newRole === "Buyer" ? "BUYER" : newRole === "Supplier" ? "SUPPLIER" : "LOGISTICS";
    setWalletId(generateWalletId(prefix));
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

  async function handleRegister() {
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
      const message =
        (axiosErrorMessage(err)) ?? "Registration failed - that Wallet ID may already be taken.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  function axiosErrorMessage(err: unknown): string | null {
    if (err && typeof err === "object" && "response" in err) {
      const response = (err as { response?: { data?: { message?: string } } }).response;
      return response?.data?.message ?? null;
    }
    return null;
  }

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
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Sign in with your Wallet ID and PIN, or register a new wallet.
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
                select
                fullWidth
                label="I am a"
                value={role}
                onChange={(e) => handleRoleChange(e.target.value as "Buyer" | "Supplier" | "Logistics")}
              >
                <MenuItem value="Buyer">Buyer (I create purchase orders)</MenuItem>
                <MenuItem value="Supplier">Supplier (I receive orders and ship goods)</MenuItem>
                <MenuItem value="Logistics">
                  Logistics (I independently confirm delivery status - not the buyer or supplier)
                </MenuItem>
              </TextField>
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
                onClick={handleRegister}
                disabled={submitting}
              >
                {submitting ? "Registering..." : "Register & Continue"}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default Login;
