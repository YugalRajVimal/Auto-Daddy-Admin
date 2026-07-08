export type CarOwnerJobCardBusiness = {
  _id: string;
  businessName: string;
  city?: string;
  cityName?: string;
  businessPhone?: string;
  phone?: string;
};

export type CarOwnerJobCardCustomer = {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
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
  customerId: string | CarOwnerJobCardCustomer;
  vehicleId: CarOwnerJobCardVehicle;
  odometerReading?: number | null;
  dueOdometerReading?: number | null;
  issueDescription: string;
  serviceType: string;
  priorityLevel: string;
  services: CarOwnerJobCardServiceItem[];
  additionalNotes?: string;
  vehiclePhotos?: string[];
  images?: string[];
  totalPayableAmount: number;
  paymentStatus: string;
  paymentMethod?: string;
  technicalRemarks?: string;
  labourCharge?: number;
  labourDuration?: string | number;
  status: string;
  jobNo: string;
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
