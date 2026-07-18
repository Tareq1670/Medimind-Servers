"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const db_js_1 = require("./config/db.js");
const env_js_1 = require("./config/env.js");
const auth_routes_js_1 = __importDefault(require("./routes/auth.routes.js"));
const protected_routes_js_1 = __importDefault(require("./routes/protected.routes.js"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: env_js_1.env.frontendUrl,
    credentials: true,
}));
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use("/api/v1/auth", auth_routes_js_1.default);
app.use("/api/v1/protected", protected_routes_js_1.default);
app.get("/api/v1/health", async (_req, res) => {
    try {
        await (0, db_js_1.getDB)().command({ ping: 1 });
        res.status(200).json({
            success: true,
            message: "MediMind API Server Skeleton Ready",
        });
    }
    catch {
        res.status(503).json({
            success: false,
            message: "Database unreachable",
        });
    }
});
exports.default = app;
