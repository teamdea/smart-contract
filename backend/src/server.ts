import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { env } from "./config/env";

const PORT = env.port;

app.listen(PORT, () => {
    console.log("--------------------------------");
    console.log(`Server running on port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
    console.log("--------------------------------");
});