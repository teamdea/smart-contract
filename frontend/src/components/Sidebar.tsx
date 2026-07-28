import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";

import DashboardIcon from "@mui/icons-material/Dashboard";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import PaymentsIcon from "@mui/icons-material/Payments";
import AssessmentIcon from "@mui/icons-material/Assessment";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CategoryIcon from "@mui/icons-material/Category";

import { Link, useLocation } from "react-router-dom";

import teamDeaLogo from "../assets/teamdea-logo.png";
import { getSession } from "../services/session";

const DRAWER_WIDTH = 295;

const menuItems = [
  {
    title: "Dashboard",
    icon: <DashboardIcon />,
    path: "/dashboard",
  },
  {
    title: "Create Order",
    icon: <AddShoppingCartIcon />,
    path: "/create-order",
  },
  {
    title: "My Orders",
    icon: <Inventory2Icon />,
    path: "/orders",
  },
  {
    title: "My Products",
    icon: <CategoryIcon />,
    path: "/my-products",
    supplierOnly: true,
  },
  {
    title: "Logistics",
    icon: <LocalShippingIcon />,
    path: "/logistics",
    openInNewTab: true,
  },
  {
    title: "Settlement",
    icon: <PaymentsIcon />,
    path: "/settlement",
  },
  {
    title: "Wallets",
    icon: <AccountBalanceIcon />,
    path: "/wallets",
    openInNewTab: true,
  },
  {
    title: "Reports",
    icon: <AssessmentIcon />,
    path: "/reports",
  },
];

function Sidebar() {
  const location = useLocation();
  const session = getSession();
  // Logistics has its own dedicated, unauthenticated entry point from the
  // login screen, so it doesn't belong in anyone else's nav. Create Order
  // is Buyer-only. Wallets doesn't apply to Logistics (they never hold
  // funds) or make sense on a Seller's own page here.
  const visibleItems = menuItems.filter((item) => {
    if (item.path === "/logistics") return session?.role === "Logistics";
    if (item.path === "/create-order") return session?.role === "Buyer";
    if (item.path === "/wallets") return session?.role !== "Logistics";
    if (item.supplierOnly) return session?.role === "Supplier";
    return true;
  });

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,

        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Logo Section */}

      <Box
        sx={{
          bgcolor: "primary.main",
          color: "white",
          pt: 3,
          pb: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          component="img"
          src={teamDeaLogo}
          alt="TeamDea"
          sx={{
            width: 90,
            height: 90,
            objectFit: "contain",
            bgcolor: "white",
            borderRadius: 2,
            p: 1,
            mb: 2,
          }}
        />

        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
          }}
        >
          Smart Escrow
        </Typography>

        <Typography
          variant="body1"
          sx={{
            opacity: 0.85,
            mt: 0.5,
          }}
        >
          Banking Operations
        </Typography>
      </Box>

      <Divider />

      {/* Navigation */}

      <List sx={{ mt: 2 }}>
        {visibleItems.map((item) =>
          item.openInNewTab ? (
            <ListItemButton
              key={item.path}
              component="a"
              href={item.path}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                mx: 1,
                my: 0.5,
                borderRadius: 3,
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>

              <ListItemText primary={item.title} />
            </ListItemButton>
          ) : (
            <ListItemButton
              key={item.path}
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              sx={{
                mx: 1,
                my: 0.5,
                borderRadius: 3,
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>

              <ListItemText primary={item.title} />
            </ListItemButton>
          )
        )}
      </List>

      {/* Footer */}

      <Box
        sx={{
          mt: "auto",
          p: 2,
          textAlign: "center",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Powered by
        </Typography>

        <Typography
          sx={{
            fontWeight: 700,
            color: "primary.main",
          }}
        >
          TeamDea
        </Typography>
      </Box>
    </Drawer>
  );
}

export default Sidebar;
