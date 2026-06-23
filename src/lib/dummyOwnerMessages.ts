import type { CarOwnerNotification } from "../types/carOwnerNotifications";

/** Outbound service requests sent to shops from Auto Shops. */
export type DummyOwnerServiceRequest = {
  id: string;
  shopName: string;
  service: string;
  plate: string;
  status: "Pending" | "Accepted" | "Declined";
  sentAt: string;
};

export const DUMMY_OWNER_SERVICE_REQUESTS: DummyOwnerServiceRequest[] = [
  {
    id: "dummy-msg-1",
    shopName: "Maple Auto Repair",
    service: "Oil Change",
    plate: "GVTY 884",
    status: "Pending",
    sentAt: "2026-06-18T14:20:00.000Z",
  },
  {
    id: "dummy-msg-2",
    shopName: "Brampton Tire & Brake",
    service: "Brake Service",
    plate: "GVTY 884",
    status: "Accepted",
    sentAt: "2026-06-12T09:45:00.000Z",
  },
  {
    id: "dummy-msg-3",
    shopName: "City Motors",
    service: "Safety Inspection",
    plate: "BXKP 221",
    status: "Pending",
    sentAt: "2026-06-08T16:10:00.000Z",
  },
  {
    id: "dummy-msg-4",
    shopName: "Maple Auto Repair",
    service: "Tire Rotation",
    plate: "GVTY 884",
    status: "Declined",
    sentAt: "2026-05-29T11:00:00.000Z",
  },
  {
    id: "dummy-msg-5",
    shopName: "City Motors",
    service: "General Repair",
    plate: "BXKP 221",
    status: "Accepted",
    sentAt: "2026-05-22T08:30:00.000Z",
  },
];

/** Inbound updates received from shops and the platform. */
export const DUMMY_OWNER_NOTIFICATIONS: CarOwnerNotification[] = [
  {
    id: "dummy-notif-1",
    userId: null,
    message: "Maple Auto Repair accepted your Oil Change request for GVTY 884.",
    time: "2026-06-19T10:15:00.000Z",
    arrayIdx: null,
  },
  {
    id: "dummy-notif-2",
    userId: null,
    message: "Job card #1256 is ready — $185 due for Oil Change at Maple Auto Repair.",
    time: "2026-06-17T13:40:00.000Z",
    arrayIdx: null,
  },
  {
    id: "dummy-notif-3",
    userId: null,
    message: "Brampton Tire & Brake quoted $420 for Brake Service on GVTY 884.",
    time: "2026-06-14T09:05:00.000Z",
    arrayIdx: null,
  },
  {
    id: "dummy-notif-4",
    userId: null,
    message: "Reminder: Safety Inspection appointment tomorrow at 9:00 AM with City Motors.",
    time: "2026-06-11T18:00:00.000Z",
    arrayIdx: null,
  },
  {
    id: "dummy-notif-5",
    userId: null,
    message: "Payment received for Job #1256 — thank you!",
    time: "2026-06-10T15:22:00.000Z",
    arrayIdx: null,
  },
  {
    id: "dummy-notif-6",
    userId: null,
    message: "New deal: 15% off tire rotation at Brampton Tire & Brake this week.",
    time: "2026-06-05T12:00:00.000Z",
    arrayIdx: null,
  },
  {
    id: "dummy-notif-7",
    userId: null,
    message: "City Motors declined your Tire Rotation request — shop is fully booked.",
    time: "2026-05-30T07:50:00.000Z",
    arrayIdx: null,
  },
];
