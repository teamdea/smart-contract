import { Navigate, Route, Routes } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import CreateOrder from "./pages/CreateOrder";
import Orders from "./pages/Orders";
import Reports from "./pages/Reports";
import Settlement from "./pages/Settlement";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate replace to="/dashboard" />}
      />

      <Route
        path="/dashboard"
        element={<Dashboard />}
      />

      <Route
        path="/create-order"
        element={<CreateOrder />}
      />

      <Route
        path="/orders"
        element={<Orders />}
      />

      <Route
        path="/settlement"
        element={<Settlement />}
      />

      <Route
        path="/reports"
        element={<Reports />}
      />
    </Routes>
  );
}

export default App;