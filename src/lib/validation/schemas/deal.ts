import { z } from "zod";
import { futureDate, moneyPositive, percent1to100, requiredTrimmed } from "../primitives";

export const serviceDealSchema = z.object({
  mode: z.literal("service"),
  subserviceId: requiredTrimmed("Subservice"),
  discountPercent: percent1to100,
  offerEndsOn: futureDate("Offer ends on"),
  images: z.array(z.unknown()).min(1, "Deal image is required.").max(2, "You can attach up to 2 images."),
});

export const partsDealSchema = z.object({
  mode: z.literal("parts"),
  title: requiredTrimmed("Title"),
  description: requiredTrimmed("Description"),
  originalPrice: moneyPositive,
  discountedPrice: moneyPositive,
  offerEndsOn: futureDate("Offer ends on"),
  images: z.array(z.unknown()).min(1, "Deal image is required.").max(2, "You can attach up to 2 images."),
});

export const dealFormSchema = z.discriminatedUnion("mode", [serviceDealSchema, partsDealSchema]);

export const shopServiceSubSchema = z.object({
  name: requiredTrimmed("Name"),
  price: moneyPositive,
  description: z.string().optional().default(""),
});

export const shopBusinessProfileSchema = z.object({
  businessName: requiredTrimmed("Business name"),
  businessPhone: z
    .string()
    .refine((v) => {
      const d = (v ?? "").replace(/\D/g, "");
      return d.length >= 10 && d.length <= 15;
    }, "Enter a valid phone number (10-15 digits, digits only)."),
  city: requiredTrimmed("City"),
  address: requiredTrimmed("Address"),
  zip: z
    .string()
    .trim()
    .min(1, "Enter a zip/postal/pincode.")
    .refine((v) => {
      const us = /^\d{5}(-\d{4})?$/.test(v);
      const ca = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i.test(v);
      const inn = /^\d{6}$/.test(v);
      return us || ca || inn;
    }, "Enter a valid US zip, Canada postal code, or India PIN code."),
  email: z
    .string()
    .trim()
    .min(1, "Enter a valid email address.")
    .regex(/^\S+@\S+\.\S+$/, "Enter a valid email address."),
  hst: z
    .string()
    .trim()
    .refine((v) => !v || /^[A-Z0-9]{17}$/.test(v.replace(/\s/g, "").toUpperCase()), {
      message: "Enter a valid TAX ID No (17 uppercase alphanumeric characters).",
    }),
  tax: z
    .string()
    .trim()
    .refine((v) => {
      if (!v) return true;
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 && n <= 50;
    }, "Enter a valid tax percentage (0 - 50)."),
  shopTypes: z.array(z.string()).min(1, "Select at least one business type."),
});

export const shopPersonalProfileSchema = z.object({
  name: requiredTrimmed("Name"),
  city: requiredTrimmed("City"),
  email: z
    .string()
    .trim()
    .refine((v) => !v || /^\S+@\S+\.\S+$/.test(v), "Enter a valid email address."),
});

export type DealFormValues = z.infer<typeof dealFormSchema>;
export type ShopBusinessProfileValues = z.infer<typeof shopBusinessProfileSchema>;
