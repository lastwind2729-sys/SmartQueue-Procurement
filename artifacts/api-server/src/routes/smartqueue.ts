import { Router, type IRouter } from "express";
import {
  AdvanceQueueResponse,
  CreateBookingBody,
  CreateBookingResponse,
  GetAdminDashboardResponse,
  GetFarmerDashboardResponse,
  GetLiveQueueResponse,
} from "@workspace/api-zod";

type QueueEntry = {
  token: string;
  name: string;
  status: "completed" | "processing" | "waiting" | "you";
  time: string;
};

type ActiveBooking = {
  bookingNumber: string;
  centre: string;
  crop: string;
  date: string;
  slot: string;
  quantity: number;
  token: string;
};

const farmer = {
  name: "Signed-in farmer",
  farmerId: "Your farmer ID",
  village: "Your village",
  language: "Preferred language",
};

let nextTokenNumber = 127;
let activeBooking: ActiveBooking | null = null;

function queueEntries(): QueueEntry[] {
  if (!activeBooking) return [];
  return [
    {
      token: activeBooking.token,
      name: "",
      status: "you",
      time: activeBooking.slot,
    },
  ];
}

function liveQueue() {
  const entries = queueEntries();
  return GetLiveQueueResponse.parse({
    centre: activeBooking?.centre ?? "No centre selected",
    currentlyServing: activeBooking?.token ?? "—",
    yourToken: activeBooking?.token ?? "—",
    farmersAhead: 0,
    estimatedWait: 0,
    updatedAt: activeBooking ? "Just now" : "Waiting for centre updates",
    entries,
  });
}

const router: IRouter = Router();

router.get("/dashboard", (_req, res) => {
  res.json(
    GetFarmerDashboardResponse.parse({
      farmer,
      booking: activeBooking
        ? {
            bookingNumber: activeBooking.bookingNumber,
            centre: activeBooking.centre,
            crop: activeBooking.crop,
            slot: activeBooking.slot,
            token: activeBooking.token,
            queuePosition: 1,
            farmersAhead: 0,
            estimatedWait: 0,
            status: "Confirmed",
            paymentStatus: "Not started",
          }
        : null,
      notifications: [],
      stats: { farmersServed: 0, averageWait: 0, paymentDue: 0 },
    }),
  );
});

router.get("/queue", (_req, res) => {
  res.json(liveQueue());
});

router.post("/bookings", (req, res) => {
  const input = CreateBookingBody.parse(req.body);
  const token = `HBL-A${nextTokenNumber}`;
  const bookingNumber = `SQ-${nextTokenNumber}`;
  nextTokenNumber += 1;
  activeBooking = {
    bookingNumber,
    centre: input.centre,
    crop: input.crop,
    date: input.date,
    slot: input.slot,
    quantity: input.quantity,
    token,
  };
  res.status(201).json(
    CreateBookingResponse.parse({
      bookingNumber,
      token,
      message: `Your slot at ${input.centre} is confirmed for ${input.date}.`,
    }),
  );
});

router.post("/queue/advance", (_req, res) => {
  res.json(AdvanceQueueResponse.parse(liveQueue()));
});

router.get("/admin/dashboard", (_req, res) => {
  res.json(
    GetAdminDashboardResponse.parse({
      centre: activeBooking?.centre ?? "No centre selected",
      metrics: {
        today: activeBooking ? 1 : 0,
        waiting: activeBooking ? 1 : 0,
        processing: 0,
        completed: 0,
        averageWait: 0,
        procurement: 0,
        pendingPayments: 0,
      },
      throughput: [],
      dailyBookings: [],
    }),
  );
});

export default router;