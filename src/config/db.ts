import { MongoClient } from "mongodb";
import { env } from "./env.js";

let client: MongoClient | null = null;
let connecting: Promise<void> | null = null;

export async function connectDB(): Promise<void> {
  if (client) return;
  if (connecting) return connecting;

  connecting = (async () => {
    const newClient = new MongoClient(env.mongodbUri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      connectTimeoutMS: 10000,
    });

    newClient.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    try {
      await newClient.connect();
      client = newClient;
      console.log("Connected to MongoDB Atlas");
    } catch (err) {
      connecting = null;
      console.error("Failed to connect to MongoDB:", err);
      if (process.env.NODE_ENV !== "production") {
        process.exit(1);
      }
      throw err;
    }
  })();

  return connecting;
}

export async function disconnectDB(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    connecting = null;
    console.log("MongoDB disconnected");
  }
}

export function getDB() {
  if (!client) {
    throw new Error("Database connection not initialized. Call connectDB first.");
  }

  return client.db(env.dbName);
}
