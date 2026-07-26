import { Navigate, Route, Routes } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import CreateOrder from "./pages/CreateOrder";
import Orders from "./pages/Orders";
import Reports from "./pages/Reports";
import Settlement from "./pages/Settlement";
import Logistics from "./pages/Logistics";
import Wallets from "./pages/Wallets";
import Login from "./pages/Login";
import RequireAuth from "./components/RequireAuth";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate replace to="/dashboard" />}
      />

      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard"
        element={<RequireAuth><Dashboard /></RequireAuth>}
      />

      <Route
        path="/create-order"
        element={<RequireAuth><CreateOrder /></RequireAuth>}
      />

      <Route
        path="/orders"
        element={<RequireAuth><Orders /></RequireAuth>}
      />

      <Route
        path="/settlement"
        element={<RequireAuth><Settlement /></RequireAuth>}
      />

      <Route
        path="/settlement/:orderId"
        element={<RequireAuth><Settlement /></RequireAuth>}
      />

      <Route
        path="/logistics"
        element={<RequireAuth><Logistics /></RequireAuth>}
      />

      <Route
        path="/wallets"
        element={<RequireAuth><Wallets /></RequireAuth>}
      />

      <Route
        path="/reports"
        element={<RequireAuth><Reports /></RequireAuth>}
      />
    </Routes>
  );
}

export default App;
