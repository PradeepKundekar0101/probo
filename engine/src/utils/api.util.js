"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResponse = exports.catchAsync = void 0;
const catchAsync = (fn) => {
    return (req, res, next) => fn(req, res, next).catch(next);
};
exports.catchAsync = catchAsync;
const sendResponse = (res, statusCode, data) => {
    res.status(statusCode).json({
        status: "success",
        data,
    });
};
exports.sendResponse = sendResponse;
