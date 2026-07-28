/* eslint-disable-next-line @typescript-eslint/triple-slash-reference */
/// <reference path="./types/express.d.ts" />
// A .d.ts file has no runtime output, so it can't be `import`ed as a value -
// this triple-slash directive (compile-time only) is what makes ts-node's
// runtime compilation (which only follows the actual import graph, unlike
// `tsc`'s whole-project scan) pick up the Request.wallet ambient type
// augmentation used by middleware/role.middleware.ts.

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
