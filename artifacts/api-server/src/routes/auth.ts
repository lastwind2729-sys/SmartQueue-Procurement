import { Router, type IRouter, type Response } from "express";
import { and, eq } from "drizzle-orm";
import { db, authChallengesTable, farmersTable, supervisorsTable } from "@workspace/db";
import { randomInt, randomUUID, createHash } from "node:crypto";
import { authUser, clearSessionCookie, createSession, destroySession, getAuthUser, verifyPassword } from "../lib/auth";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

const normalizeMobile = (value: string) => value.replace(/[^\d+]/g, "");
const hashOtp = (otp: string) => createHash("sha256").update(otp).digest("hex");
const developmentOtp = "123456";

function publicUser(user: NonNullable<Awaited<ReturnType<typeof getAuthUser>>>) {
  return {
    role: user.role,
    farmerId: user.farmerId,
    employeeId: user.employeeId,
    centreId: user.centreId,
    name: user.name,
    village: user.village,
    district: user.district,
  };
}

async function issueChallenge(role: "farmer" | "supervisor", subjectId: string, res: Response) {
  const otp = process.env.NODE_ENV === "production" ? String(randomInt(100000, 1000000)) : developmentOtp;
  const challengeId = randomUUID();
  await db.insert(authChallengesTable).values({
    challengeId,
    role,
    subjectId,
    otpHash: hashOtp(otp),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });
  const response: { challengeId: string; message: string; developmentOtp?: string } = {
    challengeId,
    message: "A one-time code has been sent to your registered contact.",
  };
  if (process.env.NODE_ENV !== "production") {
    response.message = "Development OTP mode is active. Use the code shown below.";
    response.developmentOtp = otp;
  }
  res.json(response);
}

router.post("/auth/farmer/request", async (req, res): Promise<void> => {
  const farmerId = String(req.body?.farmerId ?? "").trim().toUpperCase();
  const mobile = normalizeMobile(String(req.body?.mobile ?? "").trim());
  if (!farmerId || !mobile) {
    res.status(400).json({ message: "Farmer ID and registered mobile number are required." });
    return;
  }
  const [farmer] = await db.select().from(farmersTable).where(eq(farmersTable.farmerId, farmerId)).limit(1);
  if (!farmer) {
    res.status(404).json({ message: "Farmer ID not found in the verified registry." });
    return;
  }
  if (normalizeMobile(farmer.registeredMobile) !== mobile) {
    res.status(401).json({ message: "Mobile number does not match the registered farmer." });
    return;
  }
  if (farmer.verificationStatus !== "VERIFIED") {
    res.status(403).json({ message: "Farmer account is not active." });
    return;
  }
  await issueChallenge("farmer", farmer.farmerId, res);
});

router.post("/auth/supervisor/request", async (req, res): Promise<void> => {
  const employeeId = String(req.body?.employeeId ?? "").trim().toUpperCase();
  const password = String(req.body?.password ?? "");
  if (!employeeId || !password) {
    res.status(400).json({ message: "Employee ID and password are required." });
    return;
  }
  const [supervisor] = await db.select().from(supervisorsTable).where(eq(supervisorsTable.employeeId, employeeId)).limit(1);
  if (!supervisor) {
    res.status(404).json({ message: "Supervisor account not found." });
    return;
  }
  if (supervisor.suspended || supervisor.verificationStatus !== "VERIFIED") {
    res.status(403).json({ message: "Supervisor account is not active." });
    return;
  }
  if (!verifyPassword(password, supervisor.passwordHash)) {
    res.status(401).json({ message: "Invalid supervisor credentials." });
    return;
  }
  await issueChallenge("supervisor", supervisor.employeeId, res);
});

router.post("/auth/verify", async (req, res): Promise<void> => {
  const challengeId = String(req.body?.challengeId ?? "").trim();
  const otp = String(req.body?.otp ?? "").trim();
  if (!challengeId || !otp) {
    res.status(400).json({ message: "Challenge ID and OTP are required." });
    return;
  }
  const [challenge] = await db.select().from(authChallengesTable).where(eq(authChallengesTable.challengeId, challengeId)).limit(1);
  if (!challenge || challenge.consumedAt || challenge.expiresAt.getTime() <= Date.now()) {
    res.status(401).json({ message: "This OTP has expired. Start verification again." });
    return;
  }
  if (challenge.attempts >= 5) {
    res.status(429).json({ message: "Too many incorrect OTP attempts. Start verification again." });
    return;
  }
  if (hashOtp(otp) !== challenge.otpHash) {
    await db.update(authChallengesTable).set({ attempts: challenge.attempts + 1 }).where(eq(authChallengesTable.id, challenge.id));
    res.status(401).json({ message: "The OTP is incorrect." });
    return;
  }
  await db.update(authChallengesTable).set({ consumedAt: new Date() }).where(eq(authChallengesTable.id, challenge.id));
  const user = challenge.role === "farmer"
    ? await getAuthUserForFarmer(challenge.subjectId)
    : await getAuthUserForSupervisor(challenge.subjectId);
  if (!user) {
    res.status(403).json({ message: "Your account is no longer active." });
    return;
  }
  await createSession(res, user);
  res.json({ user: publicUser(user) });
});

async function getAuthUserForFarmer(farmerId: string) {
  const [farmer] = await db.select().from(farmersTable).where(and(eq(farmersTable.farmerId, farmerId), eq(farmersTable.verificationStatus, "VERIFIED"))).limit(1);
  return farmer ? { role: "farmer" as const, subjectId: farmer.farmerId, farmerId: farmer.farmerId, name: farmer.fullName, village: farmer.village, district: farmer.district } : null;
}

async function getAuthUserForSupervisor(employeeId: string) {
  const [supervisor] = await db.select().from(supervisorsTable).where(and(eq(supervisorsTable.employeeId, employeeId), eq(supervisorsTable.verificationStatus, "VERIFIED"), eq(supervisorsTable.suspended, false))).limit(1);
  if (!supervisor) return null;
  return { role: supervisor.role === "super_admin" ? "super_admin" as const : "supervisor" as const, subjectId: supervisor.employeeId, employeeId: supervisor.employeeId, centreId: supervisor.centreId ?? undefined, name: supervisor.officialEmail };
}

router.get("/auth/me", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ message: "Authentication required." });
    return;
  }
  res.json({ user: publicUser(user) });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  await destroySession(req);
  clearSessionCookie(res);
  res.status(204).send();
});

router.get("/auth/supervisor-check", requireAuth(["supervisor", "super_admin"]), (_req, res): void => {
  res.json({ user: publicUser(authUser(res)) });
});

export default router;