import type { CarOwnerAutoShopListItem } from "../types/carOwnerAutoShops";
import type { CarOwnerJobCard } from "../types/carOwnerJobCards";
import type { CarOwnerNotification } from "../types/carOwnerNotifications";

export type DummyInvoiceRow = {
  id: string;
  shopName: string;
  jobNo: string;
  plate: string;
  amount: number;
  createdAt: string;
  paymentStatus: string;
  category: string;
};

export const DUMMY_REPORT_JOB_CARDS: CarOwnerJobCard[] = [
  {
    _id: "dummy-jc-1",
    business: {
      _id: "shop-1",
      businessName: "Maple Auto Repair",
      businessPhone: "905 555 1200",
    },
    vehicleId: {
      _id: "veh-1",
      licensePlateNo: "GVTY 884",
      make: { name: "Honda", model: "Civic" },
    },
    totalPayableAmount: 185,
    paymentStatus: "Paid",
    paymentMethod: "Card",
    status: "Approved",
    jobNo: "1256",
    serviceType: "Oil Change",
    createdAt: "2026-03-12T10:00:00.000Z",
    updatedAt: "2026-03-12T10:00:00.000Z",
  },
  {
    _id: "dummy-jc-2",
    business: {
      _id: "shop-2",
      businessName: "Brampton Tire & Brake",
      businessPhone: "905 555 3301",
    },
    vehicleId: {
      _id: "veh-1",
      licensePlateNo: "GVTY 884",
      make: { name: "Honda", model: "Civic" },
    },
    totalPayableAmount: 420,
    paymentStatus: "Unpaid",
    status: "Approved",
    jobNo: "1289",
    serviceType: "Brake Service",
    createdAt: "2026-04-18T14:30:00.000Z",
    updatedAt: "2026-04-18T14:30:00.000Z",
  },
  {
    _id: "dummy-jc-3",
    business: {
      _id: "shop-3",
      businessName: "City Motors",
      businessPhone: "416 555 7788",
    },
    vehicleId: {
      _id: "veh-2",
      licensePlateNo: "BXKP 221",
      make: { name: "Toyota", model: "Camry" },
    },
    totalPayableAmount: 95,
    paymentStatus: "Paid",
    status: "Approved",
    jobNo: "1310",
    serviceType: "Inspection",
    createdAt: "2026-05-02T09:15:00.000Z",
    updatedAt: "2026-05-02T09:15:00.000Z",
  },
  {
    _id: "dummy-jc-4",
    business: {
      _id: "shop-1",
      businessName: "Maple Auto Repair",
      businessPhone: "905 555 1200",
    },
    vehicleId: {
      _id: "veh-2",
      licensePlateNo: "BXKP 221",
      make: { name: "Toyota", model: "Camry" },
    },
    totalPayableAmount: 760,
    paymentStatus: "Unpaid",
    status: "Pending",
    jobNo: "1324",
    serviceType: "Transmission",
    createdAt: "2026-05-28T11:45:00.000Z",
    updatedAt: "2026-05-28T11:45:00.000Z",
  },
];

export const DUMMY_REPORT_INVOICES: DummyInvoiceRow[] = [
  {
    id: "dummy-inv-1",
    shopName: "Maple Auto Repair",
    jobNo: "1256",
    plate: "GVTY 884",
    amount: 185,
    createdAt: "2026-03-15T10:00:00.000Z",
    paymentStatus: "Paid",
    category: "Oil Change",
  },
  {
    id: "dummy-inv-2",
    shopName: "Brampton Tire & Brake",
    jobNo: "1289",
    plate: "GVTY 884",
    amount: 420,
    createdAt: "2026-04-20T14:30:00.000Z",
    paymentStatus: "Unpaid",
    category: "Brake Service",
  },
  {
    id: "dummy-inv-3",
    shopName: "City Motors",
    jobNo: "1310",
    plate: "BXKP 221",
    amount: 95,
    createdAt: "2026-05-05T09:15:00.000Z",
    paymentStatus: "Paid",
    category: "Inspection",
  },
];

export const DUMMY_REPORT_SHOPS: CarOwnerAutoShopListItem[] = [
  {
    id: "dummy-shop-1",
    name: "Maple Auto Repair",
    rating: 4.6,
    logoUrl: null,
    city: "Brampton",
    timing: "",
    openHoursText: "9 AM - 6 PM",
    openDaysText: "Mon - Sat",
    closedScheduleText: "",
    mainServices: ["Oil Change", "Brake Service"],
    mainServiceItems: [
      { id: "svc-1", name: "Oil Change" },
      { id: "svc-2", name: "Brake Service" },
    ],
    subServices: [],
    carCompanies: ["Honda", "Toyota"],
    address: "45 Main St, Brampton",
    phone: "905 555 1200",
    website: "",
    mapLat: null,
    mapLng: null,
    openWeekdays: [],
    closedWeekdays: [],
    isFavorite: true,
    shopType: "autoShop",
    shopTypes: ["autoShop"],
    serviceOfferings: [
      { id: "svc-1", name: "Oil Change", subServices: [] },
      { id: "svc-2", name: "Brake Service", subServices: [] },
    ],
  },
  {
    id: "dummy-shop-2",
    name: "Brampton Tire & Brake",
    rating: 4.2,
    logoUrl: null,
    city: "Brampton",
    timing: "",
    openHoursText: "8 AM - 7 PM",
    openDaysText: "Mon - Sun",
    closedScheduleText: "",
    mainServices: ["Tire Service", "Brake Service"],
    mainServiceItems: [
      { id: "svc-3", name: "Tire Service" },
      { id: "svc-2", name: "Brake Service" },
    ],
    subServices: [],
    carCompanies: ["Ford", "Chevrolet"],
    address: "220 Queen St, Brampton",
    phone: "905 555 3301",
    website: "",
    mapLat: null,
    mapLng: null,
    openWeekdays: [],
    closedWeekdays: [],
    isFavorite: false,
    shopType: "tyreShop",
    shopTypes: ["tyreShop"],
    serviceOfferings: [
      { id: "svc-3", name: "Tire Service", subServices: [] },
      { id: "svc-2", name: "Brake Service", subServices: [] },
    ],
  },
  {
    id: "dummy-shop-3",
    name: "City Motors",
    rating: 4.8,
    logoUrl: null,
    city: "Mississauga",
    timing: "",
    openHoursText: "8:30 AM - 5:30 PM",
    openDaysText: "Mon - Fri",
    closedScheduleText: "",
    mainServices: ["General Repair", "Inspection"],
    mainServiceItems: [
      { id: "svc-4", name: "General Repair" },
      { id: "svc-5", name: "Inspection" },
    ],
    subServices: [],
    carCompanies: ["Toyota", "Lexus"],
    address: "88 Dundas St, Mississauga",
    phone: "416 555 7788",
    website: "",
    mapLat: null,
    mapLng: null,
    openWeekdays: [],
    closedWeekdays: [],
    isFavorite: false,
    shopType: "autoShop",
    shopTypes: ["autoShop"],
    serviceOfferings: [
      { id: "svc-4", name: "General Repair", subServices: [] },
      { id: "svc-5", name: "Inspection", subServices: [] },
    ],
  },
];

export const DUMMY_REPORT_TICKETS_RAISED: CarOwnerNotification[] = [
  {
    id: "dummy-ticket-1",
    userId: null,
    title: "Brake noise complaint",
    message: "Awaiting shop response",
    time: "2026-05-10T08:00:00.000Z",
    arrayIdx: null,
  },
  {
    id: "dummy-ticket-2",
    userId: null,
    title: "Invoice amount mismatch",
    message: "Job 1289 total does not match the invoice amount.",
    time: "2026-05-22T16:20:00.000Z",
    arrayIdx: null,
  },
];

export const DUMMY_REPORT_TICKETS_RESOLVED: CarOwnerNotification[] = [
  {
    id: "dummy-ticket-3",
    userId: null,
    title: "Appointment rescheduled",
    message: "Oil change appointment rescheduled — resolved",
    time: "2026-04-05T12:00:00.000Z",
    arrayIdx: null,
  },
  {
    id: "dummy-ticket-4",
    userId: null,
    title: "Warranty claim closed",
    message: "Warranty claim closed and complete",
    time: "2026-03-28T09:30:00.000Z",
    arrayIdx: null,
  },
];
