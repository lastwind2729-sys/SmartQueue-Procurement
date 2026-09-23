import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, farmersTable } from "@workspace/db";
import { createSession } from "../lib/auth";

const router: IRouter = Router();

// Demo-friendly farmer login: access is granted only when the ID exists in the
// verified farmer registry. In production, add a second factor before using
// this endpoint for real personal data.
router.post("/auth/farmer/login", async (req, res): Promise<void> => {
  const farmerId = String(req.body?.farmerId ?? "").trim().toUpperCase();

  if (!farmerId) {
    res.status(400).json({ message: "Farmer ID is required." });
    return;
  }

  const [farmer] = await db
    .select()
    .from(farmersTable)
    .where(
      and(
        eq(farmersTable.farmerId, farmerId),
        eq(farmersTable.verificationStatus, "VERIFIED"),
      ),
    )
    .limit(1);

  if (!farmer) {
    res.status(401).json({ message: "That farmer ID is not registered or active." });
    return;
  }

  const user = {
    role: "farmer" as const,
    subjectId: farmer.farmerId,
    farmerId: farmer.farmerId,
    name: farmer.fullName,
    village: farmer.village,
    district: farmer.district,
  };

  await createSession(res, user);
  res.json({
    user: {
      role: user.role,
      farmerId: user.farmerId,
      name: user.name,
      village: user.village,
      district: user.district,
    },
  });
});

export default router;
