import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

import teamDeaLogo from "../assets/teamdea-logo.png";

const DRAWER_WIDTH = 295;

function Navbar() {
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
              Administrator
            </Typography>

            <Typography variant="body2">
              Demo User
            </Typography>
          </Box>

          <Avatar
            sx={{
              bgcolor: "#66BB6A",
            }}
          >
            KS
          </Avatar>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;