export interface BusinessMapLocation {
  _id: string;
  lat: number;
  lng: number;
}

export interface BusinessSubService {
  name: string;
  desc: string;
  price: number;
}

export interface BusinessService {
  service: string;
  subServices: BusinessSubService[];
}

export interface PerDayOpenHourEntry {
  day: string;
  open: string;
  close: string;
  isClosed?: boolean;
}

export type BusinessSubscription = {
  days?: number;
  amount?: number;
  paymentStatus?: string;
  paymentMethod?: string;
  invoiceNo?: string;
  referenceId?: string;
  stripeOrderId?: string;
  stripeSessionId?: string;
  stripeCheckoutUrl?: string;
  stripeClientSecret?: string;
  cashfreeOrderId?: string;
  cashfreePaymentSessionId?: string;
  cashfreePayload?: {
    order_id?: string;
    payment_session_id?: string;
    payments?: { url?: string };
  };
};

export interface AutoShopOwnerBusinessProfile {
  _id: string;
  businessName: string;
  businessAddress: string;
  pincode: string;
  businessMapLocation: BusinessMapLocation;
  businessPhone: string;
  businessEmail: string;
  businessHSTNumber: string;
  gst?: number | string | null;
  city?: string;
  openHours?: string;
  openDays?: string[];
  closedDays?: string[];
  perDayOpenHours?: PerDayOpenHourEntry[];
  businessLogo?: string | null;
  bannerImage?: string | null;
  isBusinessActive: boolean;
  carCompanies?: Array<{ _id: string; companyName: string }>;
  myCarCompanies?: Array<{ _id: string; companyName: string }>;
  shopType?: string;
  shopTypes?: string[];
  myDeals: unknown[];
  teamMembers: unknown[];
  myServices: BusinessService[];
  subscriptions?: BusinessSubscription[];
  websiteTemplateId?: string;
  domainName?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface AutoShopOwnerUserProfile {
  _id: string;
  countryCode: string;
  phone: string;
  pincode: string;
  address: string;
  city?: string;
  profilePhoto?: string | null;
  isProfileComplete: boolean;
  status: string;
  isDisabled: boolean;
  createdAt: string;
  updatedAt: string;
  email: string;
  name: string;
  role: string;
  isAutoShopBusinessProfileComplete: boolean;
  businessProfile: string;
}

export interface AutoShopOwnerProfileData {
  businessProfile: AutoShopOwnerBusinessProfile;
  userProfile: AutoShopOwnerUserProfile;
}

export interface AutoShopOwnerProfileResponse {
  success: boolean;
  data: AutoShopOwnerProfileData;
}
