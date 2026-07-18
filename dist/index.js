"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_js_1 = __importDefault(require("./app.js"));
const env_js_1 = require("./config/env.js");
const db_js_1 = require("./config/db.js");
async function main() {
    await (0, db_js_1.connectDB)();
    app_js_1.default.listen(env_js_1.env.port, () => {
        console.log(`MediMind API running on port ${env_js_1.env.port} [${env_js_1.env.nodeEnv}]`);
    });
}
main();
