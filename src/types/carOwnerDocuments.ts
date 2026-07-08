/** GET /api/user/documents */

export type VehicleDocumentsVehicle = {
  _id: string;
  licensePlateNo?: string | null;
  vinNo?: string | null;
  make?: { name?: string | null; model?: string | null } | null;
  year?: number | string | null;
  odometerReading?: number | string | null;
  disabled?: boolean | null;
  carImage?: string | null;
};

export type VehicleDocumentsRecord = {
  _id: string;
  vehicleId: string;
  vehicle?: VehicleDocumentsVehicle | null;
  carOwnershipCertificate?: string | null;
  insuranceCertificate?: string | null;
  drivingLicenseFront?: string | null;
  drivingLicenseBack?: string | null;
};

export type UserDocumentsApiResponse = {
  success?: boolean;
  documents?: VehicleDocumentsRecord[];
};

export type UserDocumentsMutationResponse = {
  success?: boolean;
  message?: string;
};
