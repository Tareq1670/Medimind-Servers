"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectionName = void 0;
exports.getCollection = getCollection;
const db_js_1 = require("../config/db.js");
var CollectionName;
(function (CollectionName) {
    CollectionName["USERS"] = "users";
    CollectionName["MEDICINES"] = "medicines";
    CollectionName["DOCTORS"] = "doctors";
    CollectionName["CONDITIONS"] = "conditions";
    CollectionName["BLOGS"] = "blogs";
    CollectionName["REVIEWS"] = "reviews";
    CollectionName["CHAT_SESSIONS"] = "chat_sessions";
    CollectionName["REPORT_ANALYSES"] = "report_analyses";
    CollectionName["HEALTH_RECORDS"] = "health_records";
    CollectionName["SYMPTOM_ANALYSES"] = "symptom_analyses";
})(CollectionName || (exports.CollectionName = CollectionName = {}));
function getCollection(name) {
    return (0, db_js_1.getDB)().collection(name);
}
