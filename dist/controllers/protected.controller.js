"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = getProfile;
const response_js_1 = require("../utils/response.js");
function getProfile(req, res) {
    (0, response_js_1.sendSuccess)(res, {
        user: req.user,
        message: "Token is valid. This is a protected resource.",
    });
}
