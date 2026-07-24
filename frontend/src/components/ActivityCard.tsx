import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";

interface Activity {
  title: string;
  time: string;
}

interface ActivityCardProps {
  title: string;
  activities: Activity[];
}

function ActivityCard({
  title,
  activities,
}: ActivityCardProps) {
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
          gutterBottom
        >
          {title}
        </Typography>

        <Divider sx={{ mb: 2 }} />

        {activities.map((activity, index) => (
          <Box
            key={`${activity.title}-${index}`}
            sx={{
              mb: 2,
            }}
          >
            <Typography
             sx={{
            fontWeight: 600,
            }}
            >
              {activity.title}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              {activity.time}
            </Typography>
          </Box>
        ))}

      </CardContent>
    </Card>
  );
}

export default ActivityCard;