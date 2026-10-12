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