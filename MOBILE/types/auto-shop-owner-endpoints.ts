/** Loose shapes for auto-shop-owner API payloads; backend may add fields. */

export type ApiEnvelope = {
  success?: boolean;
  message?: string;
  data?: unknown;
};

export type CustomerVehicle = {
  _id?: string;
  /** Vehicle id for PUT /api/auto-shop-owner/my-customers (`vehicles[].vId`). */
  vId?: string;
  /** When true, the car owner has disabled this vehicle (inactive for bookings). */
  disabled?: boolean;
  licensePlateNo?: string;
  vinNo?: string;
  vehicleName?: string;
  model?: string;
  year?: string;
  odometerReading?: string;
  dueOdometerReading?: string;
};

export type CarOwnerSearchHit = {
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
  cityId?: string;
  vehicles?: CustomerVehicle[];
  createdAt?: string;
  updatedAt?: string;
};

/** When present, these describe the shop–customer link (preferred for date filters). */
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
  dealEnabled?: boolean;
  offersEndOnDate?: string;
  serviceId?: string;
  vehicleId?: string;
  service?: { id?: string; name?: string; desc?: string };
  selectedVehicle?: {
    id?: string;
    /** API may send `name` (preferred) or legacy `vehicleName`. */
    name?: string;
    vehicleName?: string;
    model?: string;
    year?: string;
  };
  dealImage?: string;
  /** Legacy response field; prefer `dealImage`. */
  productImage?: string;
};

export type OnboardVehicle = {
  licensePlateNo: string;
  vinNo?: string;
  vehicleName: string;
  model: string;
  year: string;
  odometerReading?: string;
};

/** One row in `vehicles` for PUT /api/auto-shop-owner/my-customers (shop edits a linked car owner). */
export type UpdateMyCustomerVehiclePayload = {
  /** Required when updating an existing vehicle row. */
  vId?: string;
  licensePlateNo: string;
  vinNo?: string;
  vehicleName: string;
  model: string;
  year: string;
  odometerReading?: string;
};

/** Profile fields for PUT /api/auto-shop-owner/my-customers (shop edits linked car owner profile). */
export type UpdateMyCustomerProfilePayload = {
  carOwnerId: string;
  name: string;
  email: string;
  countryCode: string;
  phone: string;
  pincode: string;
  /** Omitted when the shop leaves city unselected. */
  city?: string;
  address: string;
};

/** Body for PUT /api/auto-shop-owner/my-customers when updating profile and vehicles. */
export type UpdateMyCustomerPayload = UpdateMyCustomerProfilePayload & {
  vehicles: UpdateMyCustomerVehiclePayload[];
};

export type OnboardCarOwnerBody = {
  name: string;
  email: string;
  countryCode: string;
  phone: string;
  pincode: string;
  /** Omitted when the shop leaves city unselected. */
  city?: string;
  role: string;
  address: string;
  vehicles: OnboardVehicle[];
};

export type MyServiceSubServicePayload = {
  /** Present for existing rows so the API updates in place instead of inserting duplicates. */
  id?: string;
  name: string;
  desc: string;
  price: number;
};

export type MyServiceCategoryPayload = {
  id: string;
  subServices: MyServiceSubServicePayload[];
};

/** Payload row for DELETE behavior via PUT /api/auto-shop-owner/my-services */
export type MyServiceRemoveSubServicesPayload = {
  id: string;
  removeSubServices: true;
  subServices: Array<{
    /** Backend supports deleting by name (per Postman collection). */
    name: string;
  }>;
};
