"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOrderId = generateOrderId;
const uuid_1 = require("uuid");
function generateOrderId() {
    return (0, uuid_1.v4)();
}
