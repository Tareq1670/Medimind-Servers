"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
exports.sendError = sendError;
function sendSuccess(res, data, message = "Success", statusCode = 200) {
    const body = { success: true, message, data };
    res.status(statusCode).json(body);
}
function sendError(res, message = "Internal Server Error", statusCode = 500) {
    const body = { success: false, message };
    res.status(statusCode).json(body);
}
