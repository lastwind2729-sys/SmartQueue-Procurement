import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { and, eq } from "drizzle-orm";
import { db, authSessionsTable, farmersTable, supervisorsTable } from "@workspace/db";

export type AuthRole = "farmer" | "supervisor" | "super_admin";

export type AuthUser = {
  role: AuthRole;
  subjectId: string;
  farmerId?: string;
  employeeId?: string;
  centreId?: string;
  name: string;
  village?: string;
  district?: string;
};

const SESSION_COOKIE = "farmerconnect_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, expectedHex] = stored.split(":");
  if (!salt || !expectedHex) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return expected.length === actual.length && timingSafeEqual(actual, expected);
}

function readCookie(req: Request, name: string) {
  const raw = req.headers.cookie ?? "";
  const value = raw.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return value?.slice(name.length + 1);
}

function setSessionCookie(res: Response, token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_TTL_MS / 1000}${secure}`);
}

export function clearSessionCookie(res: Response) {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
}

export async function createSession(res: Response, user: AuthUser) {
  const rawToken = randomBytes(32).toString("base64url");
  await db.insert(authSessionsTable).values({
    tokenHash: sha256(rawToken),
    role: user.role,
    subjectId: user.subjectId,
    centreId: user.centreId ?? null,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  setSessionCookie(res, rawToken);
}

export async function destroySession(req: Request) {
  const rawToken = readCookie(req, SESSION_COOKIE);
  if (rawToken) await db.delete(authSessionsTable).where(eq(authSessionsTable.tokenHash, sha256(rawToken)));
}

export async function getAuthUser(req: Request): Promise<AuthUser | null> {
  const rawToken = readCookie(req, SESSION_COOKIE);
  if (!rawToken) return null;
  const [session] = await db.select().from(authSessionsTable).where(eq(authSessionsTable.tokenHash, sha256(rawToken))).limit(1);
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await db.delete(authSessionsTable).where(eq(authSessionsTable.id, session.id));
    return null;
  }

  if (session.role === "farmer") {
    const [farmer] = await db.select().from(farmersTable).where(and(eq(farmersTable.farmerId, session.subjectId), eq(farmersTable.verificationStatus, "VERIFIED"))).limit(1);
    if (!farmer) return null;
    return { role: "farmer", subjectId: farmer.farmerId, farmerId: farmer.farmerId, name: farmer.fullName, village: farmer.village, district: farmer.district };
  }

  const [supervisor] = await db.select().from(supervisorsTable).where(and(eq(supervisorsTable.employeeId, session.subjectId), eq(supervisorsTable.verificationStatus, "VERIFIED"), eq(supervisorsTable.suspended, false))).limit(1);
  if (!supervisor) return null;
  const role = supervisor.role === "super_admin" ? "super_admin" : "supervisor";
  return { role, subjectId: supervisor.employeeId, employeeId: supervisor.employeeId, centreId: supervisor.centreId ?? undefined, name: supervisor.officialEmail };
}

export function requireAuth(roles?: AuthRole | AuthRole[]): RequestHandler {
  const allowed = roles ? new Set(Array.isArray(roles) ? roles : [roles]) : undefined;
  return async (req, res, next: NextFunction): Promise<void> => {
    const user = await getAuthUser(req);
    if (!user) {
      res.status(401).json({ message: "Authentication required." });
      return;
    }
    if (allowed && !allowed.has(user.role)) {
      res.status(403).json({ message: "You do not have permission to access this area." });
      return;
    }
    res.locals.authUser = user;
    next();
  };
}

export function authUser(res: Response) {
  return res.locals.authUser as AuthUser;
}