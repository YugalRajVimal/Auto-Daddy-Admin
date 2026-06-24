export type SalvageDeal = {
  id: string;
  partName: string;
  company: string;
  price: number;
  imageUrl?: string;
  condition?: string;
  year?: string;
  notes?: string;
};

function salvageImage(seed: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/400/400`;
}

export const DUMMY_SALVAGE_DEALS: SalvageDeal[] = [
  {
    id: "salvage-1",
    partName: "Front Brake Pads",
    company: "Toyota",
    price: 89.99,
    year: "2018–2022",
    condition: "Used — Good",
    notes: "OEM pads from Camry; ~40% pad life remaining.",
    imageUrl: salvageImage("salvage-brake-pads"),
  },
  {
    id: "salvage-2",
    partName: "Alternator",
    company: "Honda",
    price: 145,
    year: "2016–2020",
    condition: "Tested — Working",
    notes: "Civic 1.5L; bench-tested, includes pulley.",
    imageUrl: salvageImage("salvage-alternator"),
  },
  {
    id: "salvage-3",
    partName: "Headlight Assembly",
    company: "Ford",
    price: 210.5,
    year: "2019–2023",
    condition: "Used — Fair",
    notes: "F-150 driver side; minor scuff on housing, lens clear.",
    imageUrl: salvageImage("salvage-headlight"),
  },
  {
    id: "salvage-4",
    partName: "Radiator",
    company: "Chevrolet",
    price: 175,
    year: "2015–2019",
    condition: "Used — Good",
    notes: "Malibu 2.5L; no leaks, flushed and inspected.",
    imageUrl: salvageImage("salvage-radiator"),
  },
];

export function formatSalvagePrice(price: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
  }).format(price);
}
