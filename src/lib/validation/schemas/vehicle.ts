import { z } from "zod";
import {
  futureDate,
  moneyPositive,
  optionalVin17,
  percent1to100,
  requiredTrimmed,
  vehicleYear,
  vin17,
} from "../primitives";

export const ownerVehicleSchema = z.object({
  company: requiredTrimmed("Company"),
  model: requiredTrimmed("Model"),
  year: vehicleYear,
  licensePlate: requiredTrimmed("License plate"),
  vin: optionalVin17,
  color: z.string().optional().default(""),
  odometer: z.string().optional().default(""),
});

export const ownerVehicleRequireVinSchema = ownerVehicleSchema.extend({
  vin: vin17,
});

export const odometerUpdateSchema = z.object({
  reading: z
    .string({ error: "Odometer reading is required." })
    .trim()
    .min(1, "Odometer reading is required.")
    .refine((v) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0;
    }, "Enter a valid odometer reading."),
});

/** ShopCustomerForm vehicle row: make/model/year + license plate, optional VIN/odometer. */
export const shopCustomerVehicleSchema = z.object({
  vId: z.string().optional(),
  licensePlateNo: requiredTrimmed("License plate"),
  vinNo: optionalVin17,
  vehicleName: requiredTrimmed("Make"),
  model: requiredTrimmed("Model"),
  year: vehicleYear,
  odometerReading: z.string().optional().default(""),
  isNew: z.boolean().optional(),
});

export type OwnerVehicleValues = z.infer<typeof ownerVehicleSchema>;
export type OdometerUpdateValues = z.infer<typeof odometerUpdateSchema>;
export type ShopCustomerVehicleValues = z.infer<typeof shopCustomerVehicleSchema>;

// Re-export deal-related pieces that touch vehicle pricing
export { moneyPositive, percent1to100, futureDate };
