import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import hpp from "hpp";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import routes from "./routes";
import { errorMiddleware } from "./middleware/error.middleware";
import { swaggerSpec } from "./config/swagger";

const app = express();

// Middlewares
// CSP disabled: helmet's default policy blocks the inline scripts/styles
// swagger-ui-express injects, which breaks /api-docs entirely. Fine for a
// hackathon dev tool; a production app would scope a policy instead.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(compression());
app.use(hpp());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Interactive API docs - see every endpoint and try requests live.
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/api/v1", routes);

app.use(errorMiddleware);

export default app;
