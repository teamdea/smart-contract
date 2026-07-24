import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";

interface ProgressCardProps {
  title: string;
  value: number;
  description: string;
}

function ProgressCard({
  title,
  value,
  description,
}: ProgressCardProps) {
  return (
    <Card
      elevation={2}
      sx={{
        height: "100%",
      }}
    >
      <CardContent>

        <Typography
          variant="h6"
          sx={{
        fontWeight: 700,
        }}
        >
          {title}
        </Typography>

        <Typography
          variant="h3"
          sx={{
            mt: 2,
            mb: 2,
            fontWeight: 700,
          }}
        >
          {value}%
        </Typography>

        <LinearProgress
          variant="determinate"
          value={value}
          sx={{
            height: 10,
            borderRadius: 5,
          }}
        />

        <Box sx={{ mt: 2 }}>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            {description}
          </Typography>
        </Box>

      </CardContent>
    </Card>
  );
}

export default ProgressCard;