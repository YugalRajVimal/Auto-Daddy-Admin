import type { PartsDealerCard } from "./shopPartsDealers";
import { partsDealerDummyImage } from "./shopAdDummyImages";

/** Sample parts dealers shown in the shop portal until real dealers are listed. */
export const DUMMY_PARTS_DEALERS: PartsDealerCard[] = [
  { name: "Hindustan Agencies", city: "Brampton", phone: "9055550110", specialty: "Aftermarket spare parts available" },
  { name: "East Coast Diesel", city: "Brampton", phone: "9055550111", specialty: "Diesel engine parts & injectors" },
  { name: "Kenworth Spare", city: "Mississauga", phone: "9055550112", specialty: "Truck spares specialist" },
  { name: "Maple Brake Supply", city: "Vaughan", phone: "9055550113", specialty: "Brake pads, rotors & calipers" },
  { name: "Prince Auto Parts", city: "Brampton", phone: "9055550114", specialty: "OEM body parts" },
  { name: "Auto Mart Electricals", city: "Toronto", phone: "4165550115", specialty: "Batteries, alternators & starters" },
].map((dealer, index) => ({ ...dealer, imageUrl: partsDealerDummyImage(index) }));
