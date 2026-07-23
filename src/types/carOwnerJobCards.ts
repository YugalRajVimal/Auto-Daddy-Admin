export type CarOwnerJobCardBusiness = {
  _id: string;
  businessName: string;
  city?: string;
  cityName?: string;
  businessPhone?: string;
  phone?: string;
  businessEmail?: string;
  businessAddress?: string;
  address?: string;
  pincode?: string;
  businessLogo?: string;
  businessHSTNumber?: string;
  accountName?: string;
  interacEmail?: string;
  termsAndConditions?: string;
  gst?: number;
};

export type CarOwnerJobCardPayableAmounts = {
  invoiceTotal?: number;
  cash?: number;
  online?: number;
  gstRate?: number;
  gstAmount?: number;
  roundOff?: number;
};

export type CarOwnerJobCardCustomer = {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  pincode?: string;
};

export type CarOwnerJobCardVehicleMake = {
  name: string;
  model: string;
};

export type CarOwnerJobCardVehicle = {
  _id: string;
  licensePlateNo: string;
  make: CarOwnerJobCardVehicleMake;
  carImages?: string[];
  vin?: string;
  cin?: string;
};

export type CarOwnerJobCardSubService = {
  name: string;
  desc?: string;
  price: number;
  labourCharge?: number;
};

export type CarOwnerJobCardServiceRef = {
  _id?: string;
  name: string;
};

/** Newer shop job-card line items (unit/qty/amount). */
export type CarOwnerJobCardServiceLine = {
  service: string | CarOwnerJobCardServiceRef;
  category?: string;
  desc?: string;
  unitCost?: number;
  qty?: number;
  amount?: number;
  odoOutReading?: number;
  subServices?: CarOwnerJobCardSubService[];
};

/** Legacy shape with nested subServices. */
export type CarOwnerJobCardServiceItem = {
  service: string | CarOwnerJobCardServiceRef;
  subServices: CarOwnerJobCardSubService[];
};

export type CarOwnerJobCard = {
  _id: string;
  business: string | CarOwnerJobCardBusiness;
  customerId?: string | CarOwnerJobCardCustomer;
  vehicleId?: CarOwnerJobCardVehicle | null;
  /** Top-level plate when vehicleId is null or missing make. */
  licensePlateNo?: string;
  customerName?: string;
  phone?: string;
  email?: string;
  city?: string;
  odometerReading?: number | null;
  dueOdometerReading?: number | null;
  odoIn?: number | null;
  issueDescription?: string;
  serviceType?: string;
  priorityLevel?: string;
  services?: Array<CarOwnerJobCardServiceItem | CarOwnerJobCardServiceLine>;
  additionalNotes?: string;
  vehiclePhotos?: string[];
  images?: string[];
  totalPayableAmount: number;
  /** Raw API total when present. */
  totalAmount?: number;
  payableAmounts?: CarOwnerJobCardPayableAmounts;
  paymentStatus: string;
  paymentMethod?: string;
  /** API flag for converted invoices. */
  invoicePaid?: boolean;
  technicalRemarks?: string;
  labourCharge?: number;
  labourDuration?: string | number;
  terms?: string;
  status: string;
  /** Backend often leaves status "pending" after customer approval; trust this flag. */
  approvedByCustomer?: boolean;
  jobNo: string;
  /** Numeric job card number from API. */
  jobCardNo?: number | string;
  invoiceNumber?: string;
  /** Invoice id from API (e.g. INV-4). */
  invoiceId?: string | null;
  date?: string;
  bank?: string;
  bankName?: string;
  createdAt: string;
  updatedAt: string;
  unpaid?: boolean;
};

export type CarOwnerJobCardsBuckets = {
  pending: CarOwnerJobCard[];
  approved: CarOwnerJobCard[];
  rejected: CarOwnerJobCard[];
  autoRejected?: CarOwnerJobCard[];
};

export type CarOwnerJobCardsResponse = {
  success: boolean;
  data?: CarOwnerJobCardsBuckets;
  pending?: CarOwnerJobCard[];
  approved?: CarOwnerJobCard[];
  rejected?: CarOwnerJobCard[];
  autoRejected?: CarOwnerJobCard[];
};
