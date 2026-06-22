export type DummyLeadStatus = "approved" | "rejected";

export type DummyLead = {
  id: string;
  name: string;
  city: string;
  status: DummyLeadStatus;
  contactName?: string;
  phone?: string;
};

export type DummyWebsite = {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
};

export const DUMMY_ASSOCIATE_PROFILE = {
  email: "alex.morgan@autodaddy.demo",
  phone: "+1 416 555 0198",
  city: "Toronto, ON",
  address: "124 King Street West, Suite 400",
  pincode: "M5H 1A1",
  role: "Business Associate",
} as const;

export const DUMMY_ASSOCIATE_LEADS: DummyLead[] = [
  {
    id: "lead-1",
    name: "Maple Auto Care",
    city: "Toronto",
    status: "approved",
    contactName: "Priya Sharma",
    phone: "+1 416 555 0101",
  },
  {
    id: "lead-2",
    name: "Northern Tire & Brake",
    city: "Mississauga",
    status: "rejected",
    contactName: "James Okonkwo",
    phone: "+1 905 555 0142",
  },
  {
    id: "lead-3",
    name: "Lakeside Motors",
    city: "Hamilton",
    status: "approved",
    contactName: "Sofia Nguyen",
    phone: "+1 289 555 0177",
  },
  {
    id: "lead-4",
    name: "Capital City Garage",
    city: "Ottawa",
    status: "rejected",
    contactName: "Marc Dubois",
    phone: "+1 613 555 0133",
  },
  {
    id: "lead-5",
    name: "West End Auto Works",
    city: "London",
    status: "approved",
    contactName: "Emily Carter",
    phone: "+1 519 555 0166",
  },
  {
    id: "lead-6",
    name: "Bayview Collision",
    city: "Vaughan",
    status: "rejected",
    contactName: "Omar Hassan",
    phone: "+1 905 555 0188",
  },
];

export const DUMMY_ASSOCIATE_WEBSITES: DummyWebsite[] = [
  {
    id: "web-1",
    name: "Classic Garage",
    description: "Clean layout for independent repair shops.",
    previewUrl: "https://example.com",
  },
  {
    id: "web-2",
    name: "Modern Service Hub",
    description: "Bold hero and service blocks for multi-bay shops.",
    previewUrl: "https://www.wikipedia.org",
  },
  {
    id: "web-3",
    name: "Premium Auto Studio",
    description: "Luxury styling for detailing and specialty shops.",
    previewUrl: "https://autodaddy.ca",
  },
];
