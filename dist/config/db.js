"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
exports.getDB = getDB;
const mongodb_1 = require("mongodb");
const env_js_1 = require("./env.js");
let client = null;
async function connectDB() {
    if (client) {
        return;
    }
    client = new mongodb_1.MongoClient(env_js_1.env.mongodbUri, {
        maxPoolSize: 50,
        minPoolSize: 10,
        connectTimeoutMS: 10000,
    });
    client.on("open", () => {
        console.log("MongoDB driver connection channel established.");
    });
    client.on("error", (err) => {
        console.error("MongoDB connection error:", err);
    });
    try {
        await client.connect();
        console.log("Connected to MongoDB Atlas");
    }
    catch (err) {
        console.error("Failed to connect to MongoDB:", err);
        process.exit(1);
    }
}
function getDB() {
    if (!client) {
        throw new Error("Database connection not initialized. Call connectDB first.");
    }
    return client.db(env_js_1.env.dbName);
}
