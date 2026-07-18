import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

interface EnvConfig {
  port: number;
  nodeEnv: string;
  mongodbUri: string;
  dbName: string;
  frontendUrl: string;
  jwksUri: string;
}

function loadEnvConfig(): EnvConfig {
  const port = parseInt(process.env.PORT ?? "5000", 10);
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const mongodbUri = process.env.MONGODB_URI ?? "";
  const dbName = process.env.DB_NAME ?? "";
  const frontendUrl = (process.env.FRONTEND_URL ?? "http://localhost:3000").trim();

  if (!mongodbUri) {
    throw new Error("MONGODB_URI environment variable is required");
  }

  if (!mongodbUri.startsWith("mongodb://") && !mongodbUri.startsWith("mongodb+srv://")) {
    throw new Error(
      `Invalid MONGODB_URI: must start with mongodb:// or mongodb+srv://`
    );
  }

  if (!dbName) {
    throw new Error("DB_NAME environment variable is required");
  }

  const jwksUri = `${frontendUrl}/api/auth/jwks`;

  return { port, nodeEnv, mongodbUri, dbName, frontendUrl, jwksUri };
}

export const env = loadEnvConfig();
