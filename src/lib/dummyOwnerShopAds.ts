export type OwnerShopAd = {
  name: string;
  phone: string;
  city?: string;
  website?: string;
  specialty?: string;
  imageUrl?: string;
};

export const DUMMY_OWNER_SHOP_ADS: OwnerShopAd[] = [
  {
    name: "Prime Auto Care",
    phone: "5125550142",
    city: "Austin",
    website: "primeautocare.example.com",
    specialty: "Full Service Auto Repair",
  },
  {
    name: "Swift Tire & Wheel",
    phone: "5125550198",
    city: "Austin",
    website: "swifttire.example.com",
    specialty: "Tire Sales & Alignment",
  },
  {
    name: "Elite Auto Detailing",
    phone: "5125550163",
    city: "Round Rock",
    website: "eliteautodetail.example.com",
    specialty: "Premium Detailing & Ceramic Coating",
  },
  {
    name: "QuickLube Express",
    phone: "5125550117",
    city: "Austin",
    website: "quicklubeexpress.example.com",
    specialty: "Oil Change & Maintenance",
  },
];
