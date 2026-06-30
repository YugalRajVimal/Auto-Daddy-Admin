import {
  deleteJson,
  getJson,
  patchJson,
  postFormData,
  postJson,
  putFormData,
  putJson,
} from "../api/mobileAuth";

export type ApiEnvelope = { success?: boolean; message?: string };

export type CustomerVehiclePayload = {
  vId?: string;
  licensePlateNo: string;
  vinNo?: string;
  vehicleName: string;
  model: string;
  year: string;
  odometerReading?: string;
};

export type OnboardCustomerBody = {
  name: string;
  email: string;
  countryCode: string;
  phone: string;
  pincode: string;
  address?: string;
  city?: string;
  role?: string;
  vehicles: CustomerVehiclePayload[];
};

export type UpdateCustomerBody = OnboardCustomerBody & {
  carOwnerId: string;
};

export type CustomerImageUploads = {
  profilePhoto?: File | null;
  vehicleImages?: Array<File | null | undefined>;
};

export type DealFormFields = {
  description?: string;
  productName?: string;
  partName?: string;
  vehicleId?: string;
  vehicleName?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  price?: string;
  discountedPrice?: string;
  dealEnabled?: string;
  offersEndOnDate?: string;
  serviceId?: string;
  dealType?: "Service" | "Parts";
  dealImage?: File | null;
};

export type JobCardFormFields = {
  customerId: string;
  vehicleId: string;
  odometerReading: string;
  dueOdometerReading: string;
  issueDescription: string;
  serviceType: string;
  priorityLevel: string;
  servicesJson: string;
  labourCharge?: string;
  labourDuration?: string;
  technicalRemarks?: string;
  vehiclePhotos?: File[];
};

export type TeamMemberPayload = {
  name: string;
  email: string;
  phone: string;
  designation: string;
  isActive: boolean;
  teamMemberPhoto?: File | null;
};

export type MyServiceCategoryPayload = {
  id: string;
  subServices: Array<{ id?: string; name: string; desc: string; price: number }>;
};

function appendText(fd: FormData, key: string, value: unknown) {
  if (value == null) return;
  const s = String(value).trim();
  if (s) fd.append(key, s);
}

export function buildCustomerFormData(
  fields: OnboardCustomerBody | UpdateCustomerBody,
  uploads?: CustomerImageUploads
) {
  const fd = new FormData();
  if ("carOwnerId" in fields) appendText(fd, "carOwnerId", fields.carOwnerId);
  appendText(fd, "name", fields.name);
  appendText(fd, "email", fields.email);
  appendText(fd, "countryCode", fields.countryCode);
  appendText(fd, "phone", fields.phone);
  appendText(fd, "pincode", fields.pincode);
  appendText(fd, "address", fields.address);
  appendText(fd, "city", fields.city);
  appendText(fd, "role", fields.role ?? "carowner");
  fd.append("vehicles", JSON.stringify(fields.vehicles));
  if (uploads?.profilePhoto) fd.append("profilePhoto", uploads.profilePhoto);
  fields.vehicles.forEach((_, i) => {
    const img = uploads?.vehicleImages?.[i];
    if (img) fd.append(`carImage_${i}`, img);
  });
  return fd;
}

export function onboardCarOwner(token: string, body: OnboardCustomerBody, uploads?: CustomerImageUploads) {
  return postFormData<ApiEnvelope>(
    "/api/auto-shop-owner/onboard-carowner",
    buildCustomerFormData(body, uploads),
    token
  );
}

export function updateMyCustomer(token: string, body: UpdateCustomerBody, uploads?: CustomerImageUploads) {
  return putFormData<ApiEnvelope>(
    "/api/auto-shop-owner/my-customers",
    buildCustomerFormData(body, uploads),
    token
  );
}

export function addCarOwnerToMyCustomers(token: string, carOwnerId: string) {
  return postJson<ApiEnvelope>("/api/auto-shop-owner/my-customers", { carOwnerId }, token);
}

export function removeCarOwnerFromMyCustomers(token: string, carOwnerId: string) {
  return deleteJson<ApiEnvelope>(
    `/api/auto-shop-owner/my-customers?carOwnerId=${encodeURIComponent(carOwnerId)}`,
    token,
    { carOwnerId }
  );
}

export function saveMyServices(token: string, services: MyServiceCategoryPayload[]) {
  return postJson<ApiEnvelope>("/api/auto-shop-owner/my-services", { services }, token);
}

export function updateMyServices(token: string, services: MyServiceCategoryPayload[]) {
  return putJson<ApiEnvelope>("/api/auto-shop-owner/my-services", { services }, token);
}

export function removeMyServiceSubServices(
  token: string,
  serviceId: string,
  subServiceName: string
) {
  return putJson<ApiEnvelope>("/api/auto-shop-owner/my-services", {
    services: [{ id: serviceId, removeSubServices: true, subServices: [{ name: subServiceName }] }],
  }, token);
}

export function fetchMainCarCompanies(token: string) {
  return getJson<unknown>("/api/auto-shop-owner/main-car-companies", token);
}

export function fetchVehicleTypesAndServices(token: string) {
  return getJson<unknown>("/api/auto-shop-owner/vehicle-types-and-services", token);
}

export function fetchJobCardById(token: string, jobCardId: string) {
  return getJson<unknown>(`/api/auto-shop-owner/job-cards/${jobCardId}`, token);
}

export function addMyCarCompanies(token: string, carCompanyIds: string[]) {
  return patchJson<ApiEnvelope>("/api/auto-shop-owner/my-car-companies", { carCompanyIds }, token);
}

export function removeMyCarCompanies(token: string, carCompanyIds: string[]) {
  return deleteJson<ApiEnvelope>("/api/auto-shop-owner/my-car-companies", token, { carCompanyIds });
}

export function updatePersonalProfile(
  token: string,
  body: {
    name?: string;
    email?: string;
    phone?: string;
    countryCode?: string;
    pincode?: string;
    address?: string;
    city?: string;
  }
) {
  return putJson<ApiEnvelope>("/api/auto-shop-owner/edit-profile", body, token);
}

export function updatePersonalProfileMultipart(
  token: string,
  fields: Record<string, string | File>
) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (v == null) continue;
    if (v instanceof File) fd.append(k, v);
    else fd.append(k, String(v));
  }
  return putFormData<ApiEnvelope>("/api/auto-shop-owner/edit-profile", fd, token);
}

export function updateBusinessProfileMultipart(token: string, fields: Record<string, string | File | boolean>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (v == null) continue;
    if (v instanceof File) fd.append(k, v);
    else fd.append(k, String(v));
  }
  return putFormData<ApiEnvelope>("/api/auto-shop-owner/edit-business-profile", fd, token);
}

export function updateBusinessOpenHours(token: string, openHoursJson: string) {
  const fd = new FormData();
  fd.append("perDayOpenHours", openHoursJson);
  return putFormData<ApiEnvelope>("/api/auto-shop-owner/edit-business-profile", fd, token);
}

export function updateServiceWeWorkWith(token: string, serviceIds: string[]) {
  const fd = new FormData();
  fd.append("serviceWeWorkWith", JSON.stringify(serviceIds));
  return putFormData<ApiEnvelope>("/api/auto-shop-owner/edit-business-profile", fd, token);
}

export function formatDealOfferEndDate(value: string | Date) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).trim().slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate());
  return `${y}-${m}-${day}`;
}

function buildDealFormData(fields: DealFormFields) {
  const fd = new FormData();
  if (fields.dealImage) fd.append("dealImage", fields.dealImage);
  if (fields.dealType) fd.append("dealType", fields.dealType);
  appendText(fd, "description", fields.description);
  appendText(fd, "discountedPrice", fields.discountedPrice);
  if (fields.offersEndOnDate) {
    fd.append("offerEndsOnDate", formatDealOfferEndDate(fields.offersEndOnDate));
  }
  if (fields.dealType === "Parts") {
    appendText(fd, "partName", fields.partName);
    appendText(fd, "vehicleId", fields.vehicleId);
    appendText(fd, "vehicleName", fields.vehicleName);
    appendText(fd, "vehicleModel", fields.vehicleModel);
    appendText(fd, "vehicleYear", fields.vehicleYear);
  } else {
    appendText(fd, "serviceId", fields.serviceId);
    appendText(fd, "servicesId", fields.serviceId);
    appendText(fd, "productName", fields.productName);
    appendText(fd, "price", fields.price);
    appendText(fd, "dealEnabled", fields.dealEnabled ?? "true");
  }
  return fd;
}

export function createDeal(token: string, fields: DealFormFields) {
  return postFormData<ApiEnvelope>("/api/auto-shop-owner/my-deals", buildDealFormData(fields), token);
}

export function updateDeal(token: string, dealId: string, fields: DealFormFields) {
  return putFormData<ApiEnvelope>(
    `/api/auto-shop-owner/my-deals/${dealId}`,
    buildDealFormData(fields),
    token
  );
}

export function deleteDeal(token: string, dealId: string) {
  return deleteJson<ApiEnvelope>(`/api/auto-shop-owner/my-deals/${dealId}`, token);
}

function buildJobCardFormData(fields: JobCardFormFields) {
  const fd = new FormData();
  fd.append("customerId", fields.customerId);
  fd.append("vehicleId", fields.vehicleId);
  fd.append("odometerReading", fields.odometerReading);
  fd.append("dueOdometerReading", fields.dueOdometerReading);
  fd.append("issueDescription", fields.issueDescription);
  fd.append("serviceType", fields.serviceType);
  fd.append("priorityLevel", fields.priorityLevel);
  fd.append("services", fields.servicesJson);
  if (fields.labourCharge != null) fd.append("labourCharge", fields.labourCharge);
  fd.append("labourDuration", fields.labourDuration ?? "0");
  if (fields.technicalRemarks) fd.append("technicalRemarks", fields.technicalRemarks);
  for (const photo of fields.vehiclePhotos ?? []) {
    fd.append("vehiclePhotos", photo);
  }
  return fd;
}

export const MAX_JOB_CARD_VEHICLE_PHOTOS = 5;

export function createJobCard(token: string, fields: JobCardFormFields) {
  return postFormData<ApiEnvelope>("/api/auto-shop-owner/job-cards", buildJobCardFormData(fields), token);
}

export function updateJobCard(token: string, jobCardId: string, fields: JobCardFormFields) {
  return putFormData<ApiEnvelope>(
    `/api/auto-shop-owner/job-cards/${jobCardId}`,
    buildJobCardFormData(fields),
    token
  );
}

export function deleteJobCard(token: string, jobCardId: string) {
  return deleteJson<ApiEnvelope>(`/api/auto-shop-owner/job-cards/${jobCardId}`, token);
}

export function markJobCardPaymentStatus(token: string, jobCardId: string, paymentStatus: string) {
  return postJson<ApiEnvelope>(
    `/api/auto-shop-owner/job-cards/${jobCardId}/mark-payment-status`,
    { paymentStatus },
    token
  );
}

export function resendJobCardNotification(token: string, jobCardId: string) {
  return postJson<ApiEnvelope>(
    `/api/auto-shop-owner/job-cards/${jobCardId}/resend-notification`,
    {},
    token
  );
}

export function markJobCardPaymentInvoice(token: string, jobCardId: string) {
  return postJson<ApiEnvelope>(
    "/api/auto-shop-owner/job-cards/mark-payment-invoice",
    { jobCardId },
    token
  );
}

export function collectJobCardPayment(
  token: string,
  body: {
    jobCardId: string;
    paymentMethod: "Cash" | "Online";
    remark?: string;
    amount: number;
  },
) {
  return postJson<ApiEnvelope>("/api/auto-shop-owner/job-cards/collect-payment", body, token);
}

export function fetchTeamMembers(token: string) {
  return getJson<unknown>("/api/auto-shop-owner/team-members", token);
}

export function createTeamMember(token: string, data: TeamMemberPayload) {
  const fd = new FormData();
  fd.append("name", data.name.trim());
  fd.append("email", data.email.trim());
  fd.append("phone", data.phone.trim());
  fd.append("designation", data.designation.trim());
  fd.append("isActive", String(data.isActive));
  if (data.teamMemberPhoto) fd.append("teamMemberPhoto", data.teamMemberPhoto);
  return postFormData<ApiEnvelope>("/api/auto-shop-owner/team-members", fd, token);
}

export function updateTeamMember(token: string, id: string, data: TeamMemberPayload) {
  const fd = new FormData();
  fd.append("name", data.name.trim());
  fd.append("email", data.email.trim());
  fd.append("phone", data.phone.trim());
  fd.append("designation", data.designation.trim());
  fd.append("isActive", String(data.isActive));
  if (data.teamMemberPhoto) fd.append("teamMemberPhoto", data.teamMemberPhoto);
  return putFormData<ApiEnvelope>(`/api/auto-shop-owner/team-members/${id}`, fd, token);
}

export function deleteTeamMember(token: string, id: string) {
  return deleteJson<ApiEnvelope>(`/api/auto-shop-owner/team-members/${id}`, token);
}

export function fetchServiceCatalog(token: string) {
  return getJson<unknown>("/api/auto-shop-owner/services", token);
}

export function submitEnquiry(token: string, serviceId: string, serviceName: string, audio: File) {
  const fd = new FormData();
  fd.append("serviceId", serviceId);
  fd.append("serviceName", serviceName);
  fd.append("voiceNote", audio);
  return postFormData<ApiEnvelope>("/api/auto-shop-owner/submit-enquiry", fd, token);
}

export function apiMessage(data: ApiEnvelope | null): string {
  return typeof data?.message === "string" ? data.message.trim() : "";
}
