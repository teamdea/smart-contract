import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";

interface StatusItem {
  service: string;
  status: string;
}

interface StatusCardProps {
  title: string;
  items: StatusItem[];
}

function getChipColor(status: string) {
  switch (status.toLowerCase()) {
    case "healthy":
    case "running":
    case "online":
    case "connected":
      return "success";

    case "pending":
    case "warning":
      return "warning";

    case "failed":
    case "offline":
      return "error";

    default:
      return "default";
  }
}

function StatusCard({
  title,
  items,
}: StatusCardProps) {
  return (
    <Card
      elevation={2}
      sx={{
        height: "100%",
        borderRadius: 3,
      }}
    >
      <CardContent>
        <Typography
          variant="h6"
          sx={{
        fontWeight: 700,
        }}
          gutterBottom
        >
          {title}
        </Typography>

        <Divider sx={{ mb: 2 }} />

        {items.map((item, index) => (
          <Box
            key={item.service}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              py: 1.5,
              borderBottom:
                index !== items.length - 1
                  ? "1px solid"
                  : "none",
              borderColor: "divider",
            }}
          >
            <Typography>
              {item.service}
            </Typography>

            <Chip
              label={item.status}
              color={getChipColor(item.status)}
              size="small"
            />
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}

export default StatusCard;