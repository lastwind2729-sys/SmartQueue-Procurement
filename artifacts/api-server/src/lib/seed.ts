import { db, centresTable, farmersTable, supervisorsTable } from "@workspace/db";
import { hashPassword } from "./auth";

const centres = [
  { centreId: "HBL-001", name: "Hunsur Procurement Centre", district: "Mysuru" },
  { centreId: "HBL-002", name: "Mandya APMC Centre", district: "Mandya" },
  { centreId: "HBL-003", name: "Mysuru Collection Point", district: "Mysuru" },
];

const farmers = [
  { farmerId: "FRM-KAR-10001", profileId: "FARMER-PROFILE-10001", fullName: "Ramesh Gowda", registeredMobile: "+919000000001", village: "Hunsur", district: "Mysuru" },
  { farmerId: "FRM-KAR-10002", profileId: "FARMER-PROFILE-10002", fullName: "Lakshmi Devi", registeredMobile: "+919000000002", village: "Periyapatna", district: "Mysuru" },
  { farmerId: "FRM-KAR-10003", profileId: "FARMER-PROFILE-10003", fullName: "Shivanna M", registeredMobile: "+919000000003", village: "Pandavapura", district: "Mandya" },
  { farmerId: "FRM-KAR-10004", profileId: "FARMER-PROFILE-10004", fullName: "Geetha Bai", registeredMobile: "+919000000004", village: "Srirangapatna", district: "Mandya" },
  { farmerId: "FRM-KAR-10005", profileId: "FARMER-PROFILE-10005", fullName: "Manjunath K", registeredMobile: "+919000000005", village: "Nanjangud", district: "Mysuru" },
];

const supervisors = [
  { employeeId: "SUP-HBL-0001", profileId: "SUPERVISOR-PROFILE-0001", officialEmail: "supervisor.hbl001@farmerconnect.demo", phone: "+919100000001", centreId: "HBL-001" },
  { employeeId: "SUP-HBL-0002", profileId: "SUPERVISOR-PROFILE-0002", officialEmail: "supervisor.hbl002@farmerconnect.demo", phone: "+919100000002", centreId: "HBL-002" },
  { employeeId: "SUP-HBL-0003", profileId: "SUPERVISOR-PROFILE-0003", officialEmail: "supervisor.hbl003@farmerconnect.demo", phone: "+919100000003", centreId: "HBL-003" },
];

export async function seedAuthData() {
  await db.insert(centresTable).values(centres).onConflictDoNothing();
  await db.insert(farmersTable).values(farmers.map((farmer) => ({
    ...farmer,
    verificationStatus: "VERIFIED",
    verifiedAt: new Date(),
  }))).onConflictDoNothing();
  await db.insert(supervisorsTable).values(supervisors.map((supervisor) => ({
    ...supervisor,
    passwordHash: hashPassword("Supervisor@123", `seed-${supervisor.employeeId}`),
    verificationStatus: "VERIFIED",
    role: "supervisor",
    suspended: false,
    createdBy: "SYSTEM-SEED",
  }))).onConflictDoNothing();
}