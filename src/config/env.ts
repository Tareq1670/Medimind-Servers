import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production" && process.env.VERCEL_ENV !== "production") {
  dotenv.config();
}

interface EnvConfig {
  port: number;
  nodeEnv: string;
  mongodbUri: string;
  dbName: string;
  frontendUrl: string;
  allowedOrigins: string[];
  jwksUri: string;
  imagebbApiKey: string;
  geminiApiKey: string;
  groqApiKey: string;
}

function loadEnvConfig(): EnvConfig {
  const port = parseInt(process.env.PORT ?? "5000", 10);
  const nodeEnv = process.env.NODE_ENV ?? process.env.VERCEL_ENV ?? "development";
  const mongodbUri = process.env.MONGODB_URI ?? "";
  const dbName = process.env.DB_NAME ?? "";
  
  // Frontend URL - use FRONTEND_URL or CLIENT_URL, default to localhost
  const frontendUrl = (process.env.FRONTEND_URL ?? process.env.CLIENT_URL ?? "http://localhost:3000").trim().replace(/\/+$/, "");

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

  // JWKS URI - use JWKS_URI env var or construct from frontend URL
  const jwksUri =
    process.env.JWKS_URI ?? `${frontendUrl}/api/auth/jwks`;

  // Build allowed origins for CORS
  const allowedOrigins = [
    frontendUrl,
    ...(process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim().replace(/\/+$/, ""))
      : []),
  ];

  // Add Vercel preview URLs if available
  if (process.env.VERCEL_URL) {
    allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
  }
  if (process.env.VERCEL_BRANCH_URL) {
    allowedOrigins.push(`https://${process.env.VERCEL_BRANCH_URL}`);
  }
  if (process.env.VERCEL_GIT_PREVIEW_URL) {
    allowedOrigins.push(`https://${process.env.VERCEL_GIT_PREVIEW_URL}`);
  }

  // Deduplicate
  const uniqueAllowedOrigins = allowedOrigins.filter((v, i, a) => a.indexOf(v) === i);

  return { 
    port, 
    nodeEnv, 
    mongodbUri, 
    dbName, 
    frontendUrl, 
    allowedOrigins: uniqueAllowedOrigins, 
    jwksUri, 
    imagebbApiKey, 
    geminiApiKey, 
    groqApiKey 
  };
}

export const env = loadEnvConfig();
