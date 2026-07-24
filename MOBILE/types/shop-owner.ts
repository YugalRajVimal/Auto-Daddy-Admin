export type CustomerVehicle = {
  _id?: string;
  vId?: string;
  disabled?: boolean;
  licensePlateNo?: string;
  vinNo?: string;
  vehicleName?: string;
  model?: string;
  year?: string;
  odometerReading?: string;
  dueOdometerReading?: string;
};

export type MyCustomer = {
  _id?: string;
  id?: string;
  carOwnerId?: string;
  name?: string;
  email?: string;
  phone?: string;
  countryCode?: string;
  address?: string;
  pincode?: string;
  city?: string;
  vehicles?: CustomerVehicle[];
  recentJobCard?: {
    subServices?: string[];
    date?: string;
    time?: string;
    vehicleNumberPlate?: string;
  } | null;
  addedAt?: string;
  linkedAt?: string;
  addedToShopAt?: string;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
  linkStatus?: string;
  approvalStatus?: string;
};

export type ShopDeal = {
  _id?: string;
  id?: string;
  dealType?: string;
  productName?: string;
  partName?: string;
  description?: string;
  price?: number | string;
  discountedPrice?: number | string;
  discountPercentage?: number | string;
  dealEnabled?: boolean;
  offersEndOnDate?: string;
  createdAt?: string;
  soldToCustomerId?: string;
  soldToCustomerName?: string;
  soldAt?: string;
  serviceId?: string;
  /** When set, deal applies to this catalog sub-service name. */
  subServiceName?: string;
  vehicleId?: string;
  service?: { id?: string; name?: string; desc?: string };
  selectedVehicle?: {
    id?: string;
    name?: string;
    vehicleName?: string;
    model?: string;
    year?: string;
  };
  dealImage?: string;
  productImage?: string;
};

export type ShopOwnerNotification = {
  id: string;
  userId: string | null;
  message: string;
  time: string;
  arrayIdx: number | null;
};

export type ShopServiceCategory = {
  id: string;
  name?: string;
  desc?: string;
  shopType?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
  odoOutRequired?: boolean;
  subServices: {
    id?: string;
    make?: string;
    model?: string;
    name: string;
    desc: string;
    price: number;
    qty?: number;
    quantityType?: "Unit" | "Days";
    labourCost?: number;
    tax?: number;
  }[];
};

export type DashboardIncomeBreakdown = {
  date: string;
  totalSale: number;
  received: number;
  pending: number;
};

export type DashboardIncomeOverview = {
  daily: DashboardIncomeBreakdown;
};

export type ShopProfileBusiness = {
  _id?: string;
  id?: string;
  businessName?: string;
  businessPhone?: string;
  city?: string;
  businessLogo?: string;
  bannerImage?: string;
  isBusinessActive?: boolean;
  perDayOpenHours?: string;
  address?: string;
  businessAddress?: string;
  pincode?: string;
  email?: string;
  hstNumber?: string;
  businessHSTNumber?: string;
  gstPercent?: number | string;
  shopType?: string;
  /** Multiple business types when the shop offers more than one specialty. */
  shopTypes?: string[];
  websiteTemplateId?: string;
  invoiceTemplateSlug?: string;
  jobCardTemplateSlug?: string;
};

export type ShopProfileUser = {
  name?: string;
  email?: string;
  phone?: string;
  countryCode?: string;
  city?: string;
  address?: string;
  pincode?: string;
  profilePhoto?: string | null;
  shopType?: string;
};

export type ShopProfileResponse = {
  success?: boolean;
  data?: {
    businessProfile?: ShopProfileBusiness;
    userProfile?: ShopProfileUser;
    teamMembers?: Array<{
      _id?: string;
      id?: string;
      name?: string;
      designation?: string;
      phone?: string;
      isActive?: boolean;
    }>;
    subscriptions?: Array<{ daysLeft?: number; planName?: string }>;
  };
};
