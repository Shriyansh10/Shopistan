/*
 * Journal — src/utils/jwt.ts
 *
 * Before: generic generateToken(payload, expiresIn) / verifyToken(token) using process.env.JWT_SECRET
 *   (not defined in .env), untyped payloads, and a dangling `export` that broke compilation.
 *
 * 2026-09-29 (Claude): Completed. Separate access and refresh tokens, each with its own secret and
 *   lifetime from .env (ACCESS_TOKEN_SECRET / ACCESS_TOKEN_EXPIRATION, REFRESH_TOKEN_SECRET /
 *   REFRESH_TOKEN_EXPIRATION). Payload is typed: { user_id: user id, role } — role only on the access token.
 *   Tokens are signed with HS256 and verified with that algorithm pinned. A bad or expired token throws
 *   unauthorized() (401); a missing secret throws a plain Error (config bug → 500).
 *   Env vars are read at call time, so it doesn't matter when dotenv is loaded.
 */

import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { unauthorized } from "./api-error.js";
import crypto from "crypto";

export type UserRole = "user" | "admin";

export type AccessTokenPayload = { user_id: string; role: UserRole };
export type RefreshTokenPayload = { user_id: string };

type TokenKind = "access" | "refresh";

const ALGORITHM = "HS256";

const ENV_KEYS = {
    access: { secret: "ACCESS_TOKEN_SECRET", expiresIn: "ACCESS_TOKEN_EXPIRATION" },
    refresh: { secret: "REFRESH_TOKEN_SECRET", expiresIn: "REFRESH_TOKEN_EXPIRATION" },
} as const;

function readEnv(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`${name} is not set`);
    return value;
}

function sign(kind: TokenKind, payload: object): string {
    const keys = ENV_KEYS[kind];
    return jwt.sign(payload, readEnv(keys.secret), {
        algorithm: ALGORITHM,
        // e.g. "15m", "7d" — format checked by jsonwebtoken at sign time
        expiresIn: readEnv(keys.expiresIn) as SignOptions["expiresIn"] & string,
    });
}

function verify(kind: TokenKind, token: string): JwtPayload {
    const secret = readEnv(ENV_KEYS[kind].secret);
    let decoded: string | JwtPayload;
    try {
        decoded = jwt.verify(token, secret, { algorithms: [ALGORITHM] });
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) throw unauthorized("Session expired, please log in again");
        throw unauthorized("Invalid token");
    }
    if (typeof decoded === "string" || typeof decoded.user_id !== "string") throw unauthorized("Invalid token");
    return decoded;
}

export const generateAccessToken = (payload: AccessTokenPayload) => sign("access", payload);

export const generateRefreshToken = (payload: RefreshTokenPayload) => sign("refresh", { user_id: payload.user_id });

export function verifyAccessToken(token: string): AccessTokenPayload {
    const decoded = verify("access", token);
    if (decoded.role !== "user" && decoded.role !== "admin") throw unauthorized("Invalid token");
    return { user_id: decoded.user_id as string, role: decoded.role };
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
    return { user_id: verify("refresh", token).user_id as string };
}

// Signs both tokens for a user, e.g. after login or when refreshing a session
export function generateAuthTokens(user: { id: string; role: UserRole }) {
    return {
        accessToken: generateAccessToken({ user_id: user.id, role: user.role }),
        refreshToken: generateRefreshToken({ user_id: user.id }),
    };
}

export function hashToken ( stringToHash: string): string {
    return crypto.createHash('sha256').update(stringToHash).digest('hex');
}