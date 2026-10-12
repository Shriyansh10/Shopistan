import type { Request, Response, NextFunction } from "express";
import { forbidden, unauthorized } from '../utils/api-error.js'; // import your ApiError functions if needed
import { verifyAccessToken } from "../utils/jwt.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: 'user' | 'admin';
      };
    }
  }
}

const requireAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.cookies || !req.cookies.accessToken) {
    throw unauthorized("Access denied");
  }
  const payload = verifyAccessToken(req.cookies.accessToken);
  req.user = { id: payload.user_id, role: payload.role };

  next();
};

// admin-only routes; requireAuthMiddleware must run first (it sets req.user)
const requireAdminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.user?.role !== "admin") {
    throw forbidden("Admins only");
  }
  next();
};

export { requireAuthMiddleware, requireAdminMiddleware };
