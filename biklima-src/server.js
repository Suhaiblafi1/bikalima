import "dotenv/config";
import app from "./app.js";
import { logger } from "./lib/logger.js";

const port = Number(process.env.PORT ?? 3000);

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error starting server");
    process.exit(1);
  }
  logger.info({ port }, `بكلمة — Server listening on port ${port}`);
});
