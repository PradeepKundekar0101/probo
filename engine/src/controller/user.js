"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = void 0;
const api_util_1 = require("../utils/api.util");
const db_1 = require("../db");
exports.createUser = (0, api_util_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    if (db_1.inrBalances[userId]) {
        return (0, api_util_1.sendResponse)(res, 409, { message: `User already exists` });
    }
    db_1.inrBalances[userId] = { balance: 0, locked: 0 };
    return (0, api_util_1.sendResponse)(res, 201, { message: `User ${userId} created` });
}));
