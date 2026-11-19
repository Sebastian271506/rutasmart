import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import type { Socket } from "socket.io";
import { config } from "./config.js";

export type StaffRole = "owner" | "operator";
export type AppRole = StaffRole | "courier";

export interface AccessClaims extends JwtPayload {
  sub: string;
  tenantId: string;
  role: AppRole;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AccessClaims;
    }
  }
}

export function verifyAccessToken(token: string): AccessClaims {
  const decoded = jwt.verify(token, config.jwtSecret, {
    algorithms: ["HS256"],
    issuer: "rutasmart-api",
    audience: "rutasmart-web"
  });

  if (
    typeof decoded === "string" ||
    typeof decoded.sub !== "string" ||
    typeof decoded.tenantId !== "string" ||
    !["owner", "operator", "courier"].includes(String(decoded.role))
  ) {
    throw new Error("Invalid access token claims.");
  }

  return decoded as AccessClaims;
}

export function authenticateHttp(
  request: Request,
  response: Response,
  next: NextFunction
): void {
  const header = request.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    response.status(401).json({ error: "Authentication required." });
    return;
  }

  try {
    request.auth = verifyAccessToken(token);
    next();
  } catch {
    response.status(401).json({ error: "Invalid or expired access token." });
  }
}

export function authenticateSocket(socket: Socket, next: (error?: Error) => void): void {
  const token = socket.handshake.auth?.token;
  if (typeof token !== "string" || token.length === 0) {
    next(new Error("Authentication required."));
    return;
  }

  try {
    socket.data.auth = verifyAccessToken(token);
    next();
  } catch {
    next(new Error("Invalid or expired access token."));
  }
}
