export type CarOwnerJobCardBusiness = {
  _id: string;
  businessName: string;
  city?: string;
  cityName?: string;
  businessPhone?: string;
  phone?: string;
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

export type CarOwnerJobCardServiceItem = {
  service: string | CarOwnerJobCardServiceRef;
  subServices: CarOwnerJobCardSubService[];
};

export type CarOwnerJobCard = {
  _id: string;
  business: string | CarOwnerJobCardBusiness;
  customerId?: string | CarOwnerJobCardCustomer;
  vehicleId: CarOwnerJobCardVehicle;
  odometerReading?: number | null;
  dueOdometerReading?: number | null;
  issueDescription?: string;
  serviceType?: string;
  priorityLevel?: string;
  services?: CarOwnerJobCardServiceItem[];
  additionalNotes?: string;
  vehiclePhotos?: string[];
  images?: string[];
  totalPayableAmount: number;
  payableAmounts?: CarOwnerJobCardPayableAmounts;
  paymentStatus: string;
  paymentMethod?: string;
  technicalRemarks?: string;
  labourCharge?: number;
  labourDuration?: string | number;
  status: string;
  /** Backend often leaves status "pending" after customer approval; trust this flag. */
  approvedByCustomer?: boolean;
  jobNo: string;
  invoiceNumber?: string;
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
