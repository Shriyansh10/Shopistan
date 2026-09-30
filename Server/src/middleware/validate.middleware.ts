/*
 * Journal — src/middleware/validate.middleware.ts
 *
 * Before: draft validateMiddleware(schema) that ignored its `schema` argument, always ran registerDto.parse
 *   (which throws on bad input), logged the result and called next(); error response was commented out.
 *
 * 2026-09-26 (Claude): Made it generic — validates req.body against whichever zod schema is passed in,
 *   using safeParse so bad input never throws. On failure responds 400 with
 *   { success: false, message, errors } (message = first issue, errors = every field's messages).
 *   On success replaces req.body with the parsed data (trimmed, unknown keys such as `role` stripped).
 *   Usage: router.post("/register", validateMiddleware(registerDto), handler)
 */

import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { badRequest} from '../utils/api-error.js';

const validateMiddleware = (schema: z.ZodType) => {

    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const issues = result.error.issues.map(issue => `${issue.path.join('.')} - ${issue.message}`); 
            if(issues.length > 0) {
                throw badRequest(
                  `Validation failed: ${issues.join(", ")}`,
                  result.error.issues,
                );
            }
        }

        req.body = result.data;
        next();
    };
};


export {  validateMiddleware };