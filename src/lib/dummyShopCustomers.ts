import type { MyCustomer } from "../types/shopOwner";

/** Flip to false once customer list APIs are fully wired on the shop portal. */
export const USE_DUMMY_SHOP_CUSTOMERS = true;

export const DUMMY_SHOP_CUSTOMERS: MyCustomer[] = [
  {
    carOwnerId: "dummy-co-1",
    name: "Raj Singh",
    phone: "4165550192",
    email: "raj.singh@example.com",
    city: "Brampton",
    linkedAt: "2026-06-20T10:00:00.000Z",
    status: "approved",
    vehicles: [
      { licensePlateNo: "BRAM 221", vehicleName: "Toyota", model: "Camry", year: "2019" },
    ],
  },
  {
    carOwnerId: "dummy-co-2",
    name: "Maria Lopez",
    phone: "9055554433",
    email: "maria.lopez@example.com",
    city: "Mississauga",
    linkedAt: "2026-06-18T14:30:00.000Z",
    status: "active",
    vehicles: [
      { licensePlateNo: "ONPK 902", vehicleName: "Honda", model: "Civic", year: "2021" },
      { licensePlateNo: "ONPK 903", vehicleName: "Honda", model: "CR-V", year: "2018" },
    ],
  },
  {
    carOwnerId: "dummy-co-3",
    name: "James Chen",
    phone: "6475558821",
    email: "james.chen@example.com",
    city: "Toronto",
    linkedAt: "2026-06-15T09:15:00.000Z",
    status: "linked",
    vehicles: [
      { licensePlateNo: "GTAA 441", vehicleName: "Ford", model: "F-150", year: "2020" },
    ],
  },
  {
    carOwnerId: "dummy-co-4",
    name: "Priya Patel",
    phone: "2895557710",
    email: "priya.patel@example.com",
    city: "Oakville",
    linkedAt: "2026-06-12T16:45:00.000Z",
    status: "approved",
    vehicles: [
      { licensePlateNo: "MISS 118", vehicleName: "Hyundai", model: "Elantra", year: "2022" },
    ],
  },
  {
    carOwnerId: "dummy-co-5",
    name: "David Miller",
    phone: "5195553399",
    email: "david.miller@example.com",
    city: "Kitchener",
    linkedAt: "2026-06-10T11:20:00.000Z",
    status: "approved",
    vehicles: [
      { licensePlateNo: "KWEL 552", vehicleName: "Chevrolet", model: "Malibu", year: "2017" },
    ],
  },
  {
    carOwnerId: "dummy-co-6",
    name: "Name Customer",
    phone: "7059913785",
    email: "customer@example.com",
    city: "Brampton",
    linkedAt: "2026-06-08T08:00:00.000Z",
    status: "approved",
    vehicles: [
      { licensePlateNo: "GVTY 884", vehicleName: "Nissan", model: "Altima", year: "2016" },
    ],
  },
  {
    carOwnerId: "dummy-co-pending-1",
    name: "Priyanshu",
    phone: "7087819568",
    email: "priyanshu@example.com",
    city: "Brampton",
    addedToShopAt: "2026-06-27T12:00:00.000Z",
    status: "pending",
    linkStatus: "pending",
    vehicles: [],
  },
  {
    carOwnerId: "dummy-co-pending-2",
    name: "Sarah Thompson",
    phone: "4375552244",
    email: "sarah.thompson@example.com",
    city: "Hamilton",
    addedToShopAt: "2026-06-26T15:30:00.000Z",
    status: "pending",
    linkStatus: "sent",
    vehicles: [
      { licensePlateNo: "HAM 334", vehicleName: "Mazda", model: "CX-5", year: "2020" },
    ],
  },
  {
    carOwnerId: "dummy-co-pending-3",
    name: "Alex Nguyen",
    phone: "6135558899",
    email: "alex.nguyen@example.com",
    city: "Ottawa",
    addedToShopAt: "2026-06-25T09:45:00.000Z",
    status: "pending approval",
    vehicles: [],
  },
];
