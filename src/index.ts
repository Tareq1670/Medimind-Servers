import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { disconnectMongoose } from "./config/mongoose.js";

async function main() {
  await connectDB();

  const server = app.listen(env.port, () => {
    console.log(`MediMind API running on port ${env.port} [${env.nodeEnv}]`);
  });

  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    server.close();
    await Promise.allSettled([disconnectDB(), disconnectMongoose()]);
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main();
