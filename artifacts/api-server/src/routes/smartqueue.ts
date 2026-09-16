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
  originalSlot: string;
  delay?: { originalSlot: string; newSlot: string; minutes: number; reason: string; changedAt: string };
};

type Notice = {
  id: number;
  title: string;
  message: string;
  priority: "normal" | "important" | "urgent";
  startDate: string;
  expiryDate: string;
  published: boolean;
  createdAt: string;
};

const farmer = {
  name: "Signed-in farmer",
  farmerId: "Your farmer ID",
  village: "Your village",
  language: "Preferred language",
};

let nextTokenNumber = 127;
let activeBooking: ActiveBooking | null = null;
let nextNoticeId = 1;
const notices: Notice[] = [];

function supervisorOnly(req: { headers: Record<string, string | string[] | undefined> }, res: { status: (code: number) => { json: (body: unknown) => void } }, next: () => void) {
  if (req.headers["x-user-role"] !== "supervisor") {
    res.status(403).json({ message: "Supervisor access required" });
    return;
  }
  next();
}

function activeNotices() {
  const today = new Date().toISOString().slice(0, 10);
  return notices
    .filter((notice) => notice.published && notice.startDate <= today && notice.expiryDate >= today)
    .sort((a, b) => ({ urgent: 0, important: 1, normal: 2 }[a.priority] - { urgent: 0, important: 1, normal: 2 }[b.priority]));
}

function shiftedSlot(slot: string, minutes: number) {
  const match = slot.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);
  if (!match) return slot;
  const format = (total: number) => {
    const hour = Math.floor(total / 60) % 24;
    const minute = total % 60;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  };
  const start = Number(match[1]) * 60 + Number(match[2]) + minutes;
  const end = Number(match[3]) * 60 + Number(match[4]) + minutes;
  return `${format(start)} – ${format(end)}`;
}

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
            paymentStatus: activeBooking.delay ? "Delayed" : "Not started",
          }
        : null,
      notifications: activeBooking?.delay
        ? [{
            id: 1,
            title: "Your procurement slot was delayed",
            message: `New time: ${activeBooking.delay.newSlot}. Reason: ${activeBooking.delay.reason}`,
            time: activeBooking.delay.changedAt,
            unread: true,
          }]
        : [],
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
    originalSlot: input.slot,
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

router.get("/notices", (_req, res) => {
  res.json(activeNotices());
});

router.get("/supervisor/notices", supervisorOnly, (_req, res) => {
  res.json(notices);
});

router.post("/supervisor/notices", supervisorOnly, (req, res) => {
  const { title, message, priority = "normal", startDate, expiryDate, published = false } = req.body ?? {};
  if (!title || !message || !startDate || !expiryDate) {
    res.status(400).json({ message: "Title, message, start date, and expiry date are required." });
    return;
  }
  const notice: Notice = {
    id: nextNoticeId++,
    title,
    message,
    priority: ["normal", "important", "urgent"].includes(priority) ? priority : "normal",
    startDate,
    expiryDate,
    published: Boolean(published),
    createdAt: new Date().toISOString(),
  };
  notices.push(notice);
  res.status(201).json(notice);
});

router.patch("/supervisor/notices/:id", supervisorOnly, (req, res) => {
  const notice = notices.find((item) => item.id === Number(req.params.id));
  if (!notice) {
    res.status(404).json({ message: "Notice not found." });
    return;
  }
  Object.assign(notice, req.body);
  res.json(notice);
});

router.delete("/supervisor/notices/:id", supervisorOnly, (req, res) => {
  const index = notices.findIndex((item) => item.id === Number(req.params.id));
  if (index < 0) {
    res.status(404).json({ message: "Notice not found." });
    return;
  }
  notices.splice(index, 1);
  res.status(204).send();
});

router.get("/supervisor/slots", supervisorOnly, (_req, res) => {
  res.json(activeBooking ? [{
    id: "active-booking-slot",
    date: activeBooking.date,
    time: activeBooking.slot,
    originalTime: activeBooking.originalSlot,
    centre: activeBooking.centre,
    capacity: 1,
    booked: 1,
    available: 0,
    status: activeBooking.delay ? "Delayed" : "Active",
    delay: activeBooking.delay ?? null,
  }] : []);
});

router.post("/supervisor/slots/:id/delay", supervisorOnly, (req, res) => {
  if (!activeBooking || req.params.id !== "active-booking-slot") {
    res.status(404).json({ message: "Slot not found." });
    return;
  }
  const minutes = Number(req.body?.minutes ?? 0);
  const reason = String(req.body?.reason ?? "").trim();
  if (!reason || (![15, 30, 60].includes(minutes) && !req.body?.newStartTime)) {
    res.status(400).json({ message: "Choose a delay and provide a reason." });
    return;
  }
  const newSlot = req.body?.newStartTime && req.body?.newEndTime
    ? `${req.body.newStartTime} – ${req.body.newEndTime}`
    : shiftedSlot(activeBooking.slot, minutes);
  const delayMinutes = minutes || 0;
  activeBooking.delay = {
    originalSlot: activeBooking.originalSlot,
    newSlot,
    minutes: delayMinutes,
    reason,
    changedAt: new Date().toISOString(),
  };
  activeBooking.slot = newSlot;
  res.json(activeBooking.delay);
});

export default router;