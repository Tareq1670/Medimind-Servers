"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.protectRoute = protectRoute;
const jose_cjs_1 = require("jose-cjs");
const env_js_1 = require("../config/env.js");
const response_js_1 = require("../utils/response.js");
const JWKS = (0, jose_cjs_1.createRemoteJWKSet)(new URL(env_js_1.env.jwksUri));
async function protectRoute(req, res, next) {
    try {
        let token;
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith("Bearer ")) {
            token = authHeader.slice(7);
        }
        if (!token) {
            (0, response_js_1.sendError)(res, "Authentication required", 401);
            return;
        }
        const { payload } = await (0, jose_cjs_1.jwtVerify)(token, JWKS);
        if (!payload.sub) {
            (0, response_js_1.sendError)(res, "Invalid token: missing subject", 401);
            return;
        }
        req.user = {
            userId: payload.sub,
            role: payload.role ?? "user",
        };
        next();
    }
    catch {
        (0, response_js_1.sendError)(res, "Invalid or expired token", 401);
    }
}
