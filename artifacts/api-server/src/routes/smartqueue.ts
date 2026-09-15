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

const farmer = {
  name: "Anita Devi",
  farmerId: "FMR-20481",
  village: "Chandpur",
  language: "Hindi",
};

let currentToken = "HBL-A119";
let nextTokenNumber = 127;
let bookingNumber = "SQ-26032-481";
let bookingStatus = "Confirmed";

const notifications = [
  {
    id: 1,
    title: "Your booking is confirmed",
    message: "HBL-A127 is reserved for today at 10:30 AM.",
    time: "8 min ago",
    unread: true,
  },
  {
    id: 2,
    title: "Queue moving smoothly",
    message: "Your estimated wait is now 42 minutes.",
    time: "24 min ago",
    unread: true,
  },
  {
    id: 3,
    title: "Centre opens at 8:00 AM",
    message: "Please carry your farmer ID and weighment slip.",
    time: "Yesterday",
    unread: false,
  },
];

function queueEntries(): QueueEntry[] {
  return [
    { token: "HBL-A116", name: "Ramesh Kumar", status: "completed", time: "9:02 AM" },
    { token: "HBL-A117", name: "Suresh Yadav", status: "completed", time: "9:18 AM" },
    { token: "HBL-A118", name: "Meena Devi", status: "completed", time: "9:34 AM" },
    { token: currentToken, name: "Rajendra Pal", status: "processing", time: "Now" },
    { token: "HBL-A120", name: "Sunita Bai", status: "waiting", time: "9:58 AM" },
    { token: "HBL-A121", name: "Devendra Singh", status: "waiting", time: "10:03 AM" },
    { token: "HBL-A122", name: "Gopal Verma", status: "waiting", time: "10:07 AM" },
    { token: "HBL-A123", name: "Sanjay Patel", status: "waiting", time: "10:12 AM" },
    { token: "HBL-A124", name: "Lakshmi Bai", status: "waiting", time: "10:18 AM" },
    { token: "HBL-A125", name: "Nitin Sharma", status: "waiting", time: "10:21 AM" },
    { token: "HBL-A126", name: "Prakash Rao", status: "waiting", time: "10:26 AM" },
    { token: "HBL-A127", name: "Anita Devi", status: "you", time: "10:30 AM" },
  ];
}

function liveQueue() {
  const entries = queueEntries();
  const farmersAhead = Math.max(
    0,
    entries.findIndex((entry) => entry.status === "you") -
      entries.findIndex((entry) => entry.token === currentToken) -
      1,
  );
  return GetLiveQueueResponse.parse({
    centre: "Haritpur Block Centre",
    currentlyServing: currentToken,
    yourToken: "HBL-A127",
    farmersAhead,
    estimatedWait: farmersAhead * 6,
    updatedAt: "Just now",
    entries,
  });
}

const router: IRouter = Router();

router.get("/dashboard", (_req, res) => {
  res.json(
    GetFarmerDashboardResponse.parse({
      farmer,
      booking: {
        bookingNumber,
        centre: "Haritpur Block Centre",
        crop: "Wheat",
        slot: "10:30 AM – 11:00 AM",
        token: "HBL-A127",
        queuePosition: 8,
        farmersAhead: 6,
        estimatedWait: 42,
        status: bookingStatus,
        paymentStatus: "Pending",
      },
      notifications,
      stats: { farmersServed: 1284, averageWait: 18, paymentDue: 10616 },
    }),
  );
});

router.get("/queue", (_req, res) => {
  res.json(liveQueue());
});

router.post("/bookings", (req, res) => {
  const input = CreateBookingBody.parse(req.body);
  const token = `HBL-A${nextTokenNumber}`;
  nextTokenNumber += 1;
  bookingNumber = `SQ-26032-${Math.floor(100 + Math.random() * 899)}`;
  bookingStatus = "Confirmed";
  res.status(201).json(
    CreateBookingResponse.parse({
      bookingNumber,
      token,
      message: `Your slot at ${input.centre} is confirmed for ${input.date}.`,
    }),
  );
});

router.post("/queue/advance", (_req, res) => {
  const numericToken = Number(currentToken.split("A")[1]);
  currentToken = `HBL-A${numericToken + 1}`;
  res.json(AdvanceQueueResponse.parse(liveQueue()));
});

router.get("/admin/dashboard", (_req, res) => {
  res.json(
    GetAdminDashboardResponse.parse({
      centre: "Haritpur Block Centre",
      metrics: {
        today: 42,
        waiting: 8,
        processing: 1,
        completed: 33,
        averageWait: 18,
        procurement: 284640,
        pendingPayments: 49680,
      },
      throughput: [
        { label: "8 AM", value: 3 },
        { label: "9 AM", value: 8 },
        { label: "10 AM", value: 14 },
        { label: "11 AM", value: 19 },
        { label: "12 PM", value: 24 },
        { label: "1 PM", value: 30 },
      ],
      dailyBookings: [
        { label: "Mon", value: 34 },
        { label: "Tue", value: 42 },
        { label: "Wed", value: 38 },
        { label: "Thu", value: 46 },
        { label: "Fri", value: 51 },
        { label: "Sat", value: 42 },
      ],
    }),
  );
});

export default router;