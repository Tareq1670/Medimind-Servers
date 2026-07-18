import { MongoClient } from "mongodb";
import { env } from "./env.js";

let client: MongoClient | null = null;

export async function connectDB(): Promise<void> {
  if (client) {
    return;
  }

  client = new MongoClient(env.mongodbUri, {
    maxPoolSize: 50,
    minPoolSize: 10,
    connectTimeoutMS: 10000,
  });

  client.on("error", (err) => {
    console.error("MongoDB connection error:", err);
  });

  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  }
}

export function getDB() {
  if (!client) {
    throw new Error("Database connection not initialized. Call connectDB first.");
  }

  return client.db(env.dbName);
}
