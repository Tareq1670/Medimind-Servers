"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function loadEnvConfig() {
    const port = parseInt(process.env.PORT ?? "5000", 10);
    const nodeEnv = process.env.NODE_ENV ?? "development";
    const mongodbUri = process.env.MONGODB_URI ?? "";
    const dbName = process.env.DB_NAME ?? "";
    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
    if (!mongodbUri) {
        throw new Error("MONGODB_URI environment variable is required");
    }
    if (!mongodbUri.startsWith("mongodb://") && !mongodbUri.startsWith("mongodb+srv://")) {
        throw new Error(`Invalid MONGODB_URI: must start with mongodb:// or mongodb+srv://`);
    }
    if (!dbName) {
        throw new Error("DB_NAME environment variable is required");
    }
    const jwksUri = `${frontendUrl}/api/auth/jwks`;
    return { port, nodeEnv, mongodbUri, dbName, frontendUrl, jwksUri };
}
exports.env = loadEnvConfig();
