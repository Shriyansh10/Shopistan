import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { isApiError } from "../utils/api-error.js";

export function notFoundHandler(req: Request, res: Response) {
    res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Express recognises error handlers by their 4 parameters, so `next` must stay even though it's unused
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
    if (isApiError(err)) {
        return res.status(err.statusCode).json({ success: false, message: err.message, errors: err.errors });
    }

    // body-parser sets type "entity.parse.failed" when req body isn't valid JSON
    if ((err as { type?: string })?.type === "entity.parse.failed") {
        return res.status(400).json({ success: false, message: "Request body is not valid JSON" });
    }

    if ((err as { code?: number })?.code === 11000) {
        const field = Object.keys((err as { keyValue?: object }).keyValue ?? {})[0] ?? "Value";
        return res.status(409).json({ success: false, message: `${field} already exists` });
    }

    if (err instanceof mongoose.Error.ValidationError) {
        const first = Object.values(err.errors)[0];
        return res.status(400).json({ success: false, message: first?.message ?? "Invalid data" });
    }

    console.error(err);
    return res.status(500).json({ success: false, message: "Something went wrong" });
}
