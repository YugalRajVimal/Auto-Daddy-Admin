export type CarOwnerCustomerRequestPendingEdit = {
  name?: string;
  email?: string;
  city?: string;
};

export type CarOwnerCustomerRequest = {
  businessId: string;
  businessName: string;
  businessLogo: string | null;
  city: string;
  addedAt: string;
  pendingEdit: CarOwnerCustomerRequestPendingEdit | null;
};

export type CarOwnerCustomerRequestsResponse = {
  success?: boolean;
  message?: string;
  data?: unknown;
};

export type CarOwnerJobCardApprovalsResponse = {
  success?: boolean;
  message?: string;
  data?: unknown;
};
