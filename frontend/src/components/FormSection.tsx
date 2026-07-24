import type { ReactNode } from "react";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";

interface FormSectionProps {
  title: string;
  children: ReactNode;
}

function FormSection({
  title,
  children,
}: FormSectionProps) {
  return (
    <Card
      elevation={2}
      sx={{
        mb: 3,
        borderRadius: 3,
      }}
    >
      <CardContent>
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            fontWeight: 700,
          }}
        >
          {title}
        </Typography>

        <Divider sx={{ mb: 3 }} />

        {children}
      </CardContent>
    </Card>
  );
}

export default FormSection;