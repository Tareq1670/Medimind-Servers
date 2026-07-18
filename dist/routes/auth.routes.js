"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const auth_controller_js_1 = require("../controllers/auth.controller.js");
const router = (0, express_1.Router)();
router.get("/me", auth_middleware_js_1.protectRoute, auth_controller_js_1.getProfile);
exports.default = router;
