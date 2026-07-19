import mongoose from "mongoose";
import { env } from "./env.js";

let isConnected = false;
let connecting: Promise<void> | null = null;

export async function connectMongoose(): Promise<void> {
  if (isConnected) return;
  if (connecting) return connecting;

  connecting = (async () => {
    try {
      await mongoose.connect(env.mongodbUri, {
        dbName: env.dbName,
        maxPoolSize: 10,
        minPoolSize: 2,
        connectTimeoutMS: 10000,
      });
      isConnected = true;
      console.log("Mongoose connected");
    } catch (err) {
      connecting = null;
      console.error("Mongoose connection failed:", err);
      if (process.env.NODE_ENV !== "production") process.exit(1);
      throw err;
    }
  })();

  return connecting;
}

mongoose.connection.on("error", (err) => {
  console.error("Mongoose runtime error:", err);
});

export async function disconnectMongoose(): Promise<void> {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    connecting = null;
    console.log("Mongoose disconnected");
  }
}
