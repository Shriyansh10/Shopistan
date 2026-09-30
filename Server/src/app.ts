/*
 * Journal — src/app.ts
 *
 * Before: Express app with JSON + urlencoded body parsing, cors() with default (wildcard) settings,
 *   GET /api/health and the /api/auth router. tsc failed because @types/cors was missing.
 *
 * 2026-09-26 (Claude): Installed @types/cors. CORS now allows only CLIENT_URL (default
 *   http://localhost:5173) with credentials: true — required because the client sends cookies
 *   (axios withCredentials), which browsers block with a wildcard origin. CORS moved first so it also
 *   covers body-parse errors. Added the JSON 404 handler and the error handler as the last middleware.
 */

import express, { Express, Request, Response } from "express";
import cors from "cors";
import authRoutes from "./routes/auth.route.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import cookieParser from "cookie-parser";


const app: Express = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/api/health", (req: Request, res: Response) => {
  res.send("Server is healthy");
});

app.use("/api/auth", authRoutes);

// must come after all routes
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
