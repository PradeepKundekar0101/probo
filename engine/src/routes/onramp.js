"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onrampRouter = void 0;
const express_1 = __importDefault(require("express"));
const onramp_1 = require("../controller/onramp");
exports.onrampRouter = express_1.default.Router();
exports.onrampRouter.post("/inr/", onramp_1.onrampInr);
