export type CarOwnerDealContactDetails = {
  phone?: string;
  mobile?: string;
  landline?: string;
};

export type CarOwnerDealCreatedBy = {
  _id: string;
  businessName: string;
  businessAddress?: string;
  businessLogo?: string;
  city?: string;
  phone?: string;
  businessPhone?: string;
  mobile?: string;
  contactPhone?: string;
  contactDetails?: CarOwnerDealContactDetails;
};

export type CarOwnerDealService = {
  _id: string;
  name: string;
  desc: string;
};

export type CarOwnerDealSelectedVehicle = {
  id: string;
  name: string;
  model?: string;
  year: string;
};

export type CarOwnerDealBase = {
  _id: string;
  description: string;
  discountedPrice: number;
  originalPrice?: number;
  offerEndsOnDate: string;
  createdBy: CarOwnerDealCreatedBy;
  imagePath: string | null;
  createdAt: string;
  updatedAt: string;
  __v?: number;
};

export type CarOwnerServiceDeal = CarOwnerDealBase & {
  dealType: "service" | "Service";
  serviceId: CarOwnerDealService;
  partName?: never;
  selectedVehicle?: never;
};

export type CarOwnerPartsDeal = CarOwnerDealBase & {
  dealType: "parts" | "Parts" | "Salvages" | "salvage" | "Salvage";
  partName: string;
  selectedVehicle: CarOwnerDealSelectedVehicle;
  serviceId?: never;
};

export type CarOwnerDeal = CarOwnerServiceDeal | CarOwnerPartsDeal;

export type CarOwnerDealBucket = {
  city: CarOwnerDeal[];
  others: CarOwnerDeal[];
};

export type CarOwnerDealsGrouped = {
  Service?: CarOwnerDealBucket | { city?: unknown; others?: unknown };
  Parts?: CarOwnerDealBucket | { city?: unknown; others?: unknown };
  Salvages?: CarOwnerDealBucket | { city?: unknown; others?: unknown };
  service?: CarOwnerDealBucket | { city?: unknown; others?: unknown };
  parts?: CarOwnerDealBucket | { city?: unknown; others?: unknown };
  salvages?: CarOwnerDealBucket | { city?: unknown; others?: unknown };
};

export type CarOwnerDealsApiFilters = {
  makes: string[];
  models: string[];
};

export type CarOwnerDealsResponse = {
  success: boolean;
  deals: CarOwnerDealsGrouped | CarOwnerDeal[] | unknown;
  filters?: {
    makes?: string[];
    models?: string[];
  };
};

export type NormalizedCarOwnerDeals = {
  Service: CarOwnerDealBucket;
  Parts: CarOwnerDealBucket;
  filters: CarOwnerDealsApiFilters;
  all: CarOwnerDeal[];
};
