import type { CarOwnerContentBlock } from "../hooks/useOwnerPortal";
import type { CarOwnerVehicle } from "./carOwnerVehicles";

export type DummyFaqItem = { question: string; answer: string };

export const DUMMY_OWNER_FAQS: DummyFaqItem[] = [
  {
    question: "How do I add a vehicle to my garage?",
    answer:
      "Open Profile → My Vehicles and tap Add Vehicle. Enter plate, make, model, year, and odometer to get started.",
  },
  {
    question: "Where can I upload ownership and insurance documents?",
    answer:
      "Go to Documents from the top menu, pick a vehicle, then upload ownership, insurance, and license files.",
  },
  {
    question: "How do I approve a shop request?",
    answer:
      "Under Auto Shops → Approvals you can accept or reject shops that asked to add you as a customer.",
  },
  {
    question: "Can I update my odometer from the dashboard?",
    answer:
      "Yes. On Home → Dashboard use the Odometer card to pick a vehicle, enter the new reading, and save.",
  },
  {
    question: "Where do invoices and job cards appear?",
    answer:
      "Expenses shows Job Cards and Invoices. You can also jump there from each vehicle card under My Vehicles.",
  },
];

export const DUMMY_OWNER_PRIVACY_HEADING = "Privacy Policy";

export const DUMMY_OWNER_PRIVACY_BODY = `Your data, your control
AutoDaddy collects only what is needed to run your garage workspace: profile details, vehicle records, documents you upload, and service activity with shops you choose.

How we use information
We use your information to show job cards and invoices, match you with nearby shops, send service reminders, and keep your documents ready when you need them.

Sharing with shops
When you approve a shop or start a job, relevant vehicle and contact details are shared with that shop so they can serve you. You can revoke access from Approvals.

Security
Access is protected with your signed-in session. Uploaded documents are stored securely and only shown to you and authorized shops.

Your choices
You can edit your profile, remove vehicles, replace documents, and log out at any time. Contact support from Help if you need a data request handled.`;

export const DUMMY_OWNER_FEATURES: CarOwnerContentBlock[] = [
  {
    _id: "feat-garage",
    heading: "Digital garage",
    desc: "Keep every vehicle, plate, and odometer reading in one place with quick edits.",
  },
  {
    _id: "feat-docs",
    heading: "Document vault",
    desc: "Store ownership, insurance, and license scans per vehicle and open them anytime.",
  },
  {
    _id: "feat-shops",
    heading: "Shop discovery",
    desc: "Browse nearby auto shops, tire shops, washes, and tow services that fit your car.",
  },
  {
    _id: "feat-deals",
    heading: "Live deals",
    desc: "See spare-part and service offers matched to your makes and models.",
  },
  {
    _id: "feat-expenses",
    heading: "Expense timeline",
    desc: "Track job cards and invoices with paid vs unpaid status at a glance.",
  },
  {
    _id: "feat-diary",
    heading: "Digital diary",
    desc: "Set reminders for renewals, services, and personal garage to-dos.",
  },
];

export const DUMMY_OWNER_PROFILE = {
  name: "Alex Rivera",
  email: "alex.rivera@email.com",
  phone: "55501482",
  address: "128 Harbor Lane",
  city: "Austin",
  pincode: "78701",
};

export const DUMMY_OWNER_VEHICLES: CarOwnerVehicle[] = [
  {
    id: "dummy-vehicle-1",
    licensePlateNo: "ABC 1234",
    vinNo: "1HGCM82633A004352",
    year: 2022,
    odometerReading: 18450,
    dueOdometerReading: 20000,
    make: { name: "Honda", model: "Civic" },
    carImage: null,
    disabled: false,
  },
  {
    id: "dummy-vehicle-2",
    licensePlateNo: "XYZ 9081",
    vinNo: "JM1BL1SF5A1234567",
    year: 2019,
    odometerReading: 41200,
    dueOdometerReading: 45000,
    make: { name: "Mazda", model: "CX-5" },
    carImage: null,
    disabled: false,
  },
  {
    id: "dummy-vehicle-3",
    licensePlateNo: "QWE 5520",
    vinNo: "5YJ3E1EA1KF123456",
    year: 2021,
    odometerReading: 9800,
    dueOdometerReading: 15000,
    make: { name: "Tesla", model: "Model 3" },
    carImage: null,
    disabled: false,
  },
];

/** Prefer live API values; fall back to demo content when empty. */
export function withDummyFaqs(
  heading: string,
  description: string
): { heading: string; items: DummyFaqItem[]; usingDummy: boolean } {
  const hasLive = description.trim().length > 0;
  if (hasLive) {
    return { heading: heading || "FAQs", items: [], usingDummy: false };
  }
  return {
    heading: heading?.trim() || "FAQs",
    items: DUMMY_OWNER_FAQS,
    usingDummy: true,
  };
}

export function withDummyPrivacy(
  heading: string,
  description: string
): { heading: string; description: string; usingDummy: boolean } {
  if (description.trim()) {
    return { heading: heading || DUMMY_OWNER_PRIVACY_HEADING, description, usingDummy: false };
  }
  return {
    heading: heading?.trim() || DUMMY_OWNER_PRIVACY_HEADING,
    description: DUMMY_OWNER_PRIVACY_BODY,
    usingDummy: true,
  };
}

export function withDummyFeatures(sections: CarOwnerContentBlock[]): {
  sections: CarOwnerContentBlock[];
  usingDummy: boolean;
} {
  if (sections.length > 0) return { sections, usingDummy: false };
  return { sections: DUMMY_OWNER_FEATURES, usingDummy: true };
}

export function withDummyVehicles(vehicles: CarOwnerVehicle[]): {
  vehicles: CarOwnerVehicle[];
  usingDummy: boolean;
} {
  if (vehicles.length > 0) return { vehicles, usingDummy: false };
  return { vehicles: DUMMY_OWNER_VEHICLES, usingDummy: true };
}
