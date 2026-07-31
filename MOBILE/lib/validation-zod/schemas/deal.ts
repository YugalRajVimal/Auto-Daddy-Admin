import { z } from "zod";
import { futureDate, moneyPositive, percent1to100, requiredTrimmed } from "../primitives";

export const serviceDealSchema = z.object({
  mode: z.literal("service"),
  subserviceId: requiredTrimmed("Subservice"),
  discountPercent: percent1to100,
  offerEndsOn: futureDate("Offer ends on"),
});

export const partsDealSchema = z.object({
  mode: z.literal("parts"),
  title: requiredTrimmed("Title"),
  description: requiredTrimmed("Description"),
  originalPrice: moneyPositive,
  discountedPrice: moneyPositive,
  offerEndsOn: futureDate("Offer ends on"),
  vehicleId: requiredTrimmed("Vehicle"),
  vehicleModel: requiredTrimmed("Model"),
  vehicleYear: requiredTrimmed("Year"),
});

export const dealFormSchema = z.discriminatedUnion("mode", [serviceDealSchema, partsDealSchema]);

export type DealFormValues = z.infer<typeof dealFormSchema>;
