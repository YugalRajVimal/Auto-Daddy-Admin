/**
 * Normalized row for the car-owner odometer carousel
 * (sourced from GET `/api/user/odometer-readings`).
 */
export type CarOwnerOdometerReading = {
  vehicleId: string;
  licensePlateNo: string;
  make: { name: string; model: string };
  year: string | number | null;
  carImage: string | null;
  odometerReading: number | null;
  dueOdometerReading: number | null;
};

export type CarOwnerOdometerReadingsResponse = {
  success?: boolean;
  data?: unknown;
  message?: string;
} & Record<string, unknown>;

export type CarOwnerUpdateOdometerResponse = {
  success?: boolean;
  message?: string;
  data?: unknown;
};
