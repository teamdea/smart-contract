import { useNavigate } from "react-router-dom";

import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import LogoutIcon from "@mui/icons-material/Logout";

import teamDeaLogo from "../assets/teamdea-logo.png";
import { getSession, clearSession } from "../services/session";

const DRAWER_WIDTH = 295;

function Navbar() {
  const navigate = useNavigate();
  const session = getSession();

  function handleLogout() {
    clearSession();
    navigate("/login");
  }

  return (
    <AppBar
      position="fixed"
      sx={{
        width: `calc(100% - ${DRAWER_WIDTH}px)`,
        ml: `${DRAWER_WIDTH}px`,
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          minHeight: 72,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box
            component="img"
            src={teamDeaLogo}
            alt="TeamDea"
            sx={{
              width: 52,
              height: 52,
              objectFit: "contain",
              borderRadius: 2,
              backgroundColor: "white",
              p: 0.5,
            }}
          />

          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
              }}
            >
              Programmable Money
            </Typography>

            <Typography
              variant="body2"
              sx={{
                opacity: 0.9,
              }}
            >
              Powered by TeamDea
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box
            sx={{
              textAlign: "right",
            }}
          >
            <Typography
              sx={{
                fontWeight: 700,
              }}
            >
              {session?.ownerName ?? "Guest"}
            </Typography>

            <Typography variant="body2">
              {session ? `${session.role} · ${session.walletId}` : "Not signed in"}
            </Typography>
          </Box>

          <Avatar
            sx={{
              bgcolor: "#66BB6A",
            }}
          >
            {(session?.ownerName ?? "?").slice(0, 2).toUpperCase()}
          </Avatar>

          {session && (
            <Tooltip title="Logout">
              <IconButton color="inherit" onClick={handleLogout}>
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
