import { z } from "zod";
import { requiredTrimmed, vehicleYear } from "../primitives";

export const vehicleFormSchema = z.object({
  licensePlate: requiredTrimmed("License plate"),
  make: requiredTrimmed("Make"),
  model: requiredTrimmed("Model"),
  year: vehicleYear,
});

export type VehicleFormValues = z.infer<typeof vehicleFormSchema>;
