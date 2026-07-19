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
  imagebbApiKey: string;
  geminiApiKey: string;
  groqApiKey: string;
}

function loadEnvConfig(): EnvConfig {
  const port = parseInt(process.env.PORT ?? "5000", 10);
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const mongodbUri = process.env.MONGODB_URI ?? "";
  const dbName = process.env.DB_NAME ?? "";
  const frontendUrl = (process.env.CLIENT_URL ?? process.env.FRONTEND_URL ?? "http://localhost:3000").trim().replace(/\/+$/, "");

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

  const imagebbApiKey = process.env.IMAGEBB_API_KEY ?? "";
  const geminiApiKey = process.env.GEMINI_API_KEY ?? "";
  const groqApiKey = process.env.GROQ_API_KEY ?? "";

  const jwksUri =
    process.env.JWKS_URI ?? `${frontendUrl}/api/auth/jwks`;

  return { port, nodeEnv, mongodbUri, dbName, frontendUrl, jwksUri, imagebbApiKey, geminiApiKey, groqApiKey };
}

export const env = loadEnvConfig();
