import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB, disconnectDB } from "./config/db.js";

async function main() {
  try {
    await connectDB();

    const server = app.listen(env.port, () => {
      console.log(`MediMind API running on port ${env.port} [${env.nodeEnv}]`);
    });

    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        disconnectDB().then(() => process.exit(0));
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

main();
