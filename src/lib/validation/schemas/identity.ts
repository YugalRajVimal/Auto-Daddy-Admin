import { z } from "zod";
import {
  EMAIL_RE,
  digitsOnly,
  email,
  optionalEmail,
  optionalPhone10,
  optionalVin17,
  passwordMin6,
  phone10,
  postalCA,
  requiredTrimmed,
  vehicleYear,
  vin17,
} from "../primitives";
import { shopCustomerVehicleSchema } from "./vehicle";

export const customerIdentitySchema = z.object({
  name: requiredTrimmed("Name"),
  phone: phone10,
  email: optionalEmail,
  city: z.string().optional().default(""),
  address: z.string().optional().default(""),
  pincode: z.string().optional().default(""),
});

export const shopPeopleSchema = z.object({
  name: requiredTrimmed("Name"),
  phone: phone10,
  email: optionalEmail,
  city: requiredTrimmed("City"),
});

export const teamMemberSchema = z.object({
  name: requiredTrimmed("Name"),
  phone: phone10,
  email: optionalEmail,
  designation: requiredTrimmed("Designation"),
});

export const autoShopOwnerCreateSchema = z.object({
  name: requiredTrimmed("Name"),
  phone: phone10,
  email: optionalEmail,
  shopType: requiredTrimmed("Shop type"),
  address: z.string().trim().optional().default(""),
  city: z.string().trim().optional().default(""),
  zip: z.string().trim().optional().default(""),
});

export const autoShopOwnerSchema = autoShopOwnerCreateSchema;

export const carOwnerAdminSchema = z.object({
  name: requiredTrimmed("Name"),
  phone: phone10,
  email: optionalEmail,
  address: requiredTrimmed("Address"),
  pincode: requiredTrimmed("Pincode"),
  city: z.string().optional().default(""),
  attachEmail: z.boolean().optional(),
  password: z.string().optional(),
});

export const carOwnerWithEmailSchema = carOwnerAdminSchema
  .extend({
    email,
    password: z.string().min(6, "Password must be at least 6 characters.").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.attachEmail && !data.email?.trim()) {
      ctx.addIssue({ code: "custom", message: "Valid email required", path: ["email"] });
    }
  });

export const dealerSchema = z.object({
  name: requiredTrimmed("Name"),
  phone: phone10,
  email,
  website: z.string().trim().optional().default(""),
  address: z.string().trim().optional().default(""),
  city: z.string().trim().optional().default(""),
});

export const subAdminSchema = z.object({
  name: requiredTrimmed("Name"),
  email,
  role: requiredTrimmed("Role"),
});

export const subAdminPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export const ownerProfileEditSchema = z.object({
  name: requiredTrimmed("Name").refine((v) => v.length <= 80, "Use at most 80 characters."),
  email: optionalEmail,
  phone: optionalPhone10,
  address: z
    .string()
    .trim()
    .refine((v) => v.length <= 50, "Use at most 50 characters."),
  pincode: postalCA,
});

export const vehicleFormSchema = z.object({
  company: requiredTrimmed("Company"),
  model: requiredTrimmed("Model"),
  year: vehicleYear,
  licensePlate: requiredTrimmed("License plate"),
  vin: optionalVin17,
  color: z.string().optional().default(""),
  odometer: z.string().optional().default(""),
});

export const vehicleFormRequireVinSchema = vehicleFormSchema.extend({
  vin: vin17,
});

export const leadSchema = z.object({
  date: requiredTrimmed("Date"),
  name: requiredTrimmed("Name"),
  phone: phone10,
  city: requiredTrimmed("City"),
  email: optionalEmail,
  website: z.string().trim().optional().default(""),
  notes: z.string().trim().optional().default(""),
});

export type LeadValues = z.infer<typeof leadSchema>;

/** ShopCustomerForm: full add/edit customer form (email required, unlike customerIdentitySchema). */
export const shopCustomerSchema = z.object({
  name: requiredTrimmed("Full Name"),
  email,
  phone: phone10,
  pincode: requiredTrimmed("Postal Code"),
  address: z.string().trim().optional().default(""),
  city: z.string().trim().optional().default(""),
  vehicles: z.array(shopCustomerVehicleSchema).min(1, "Add at least one vehicle."),
});

/** Shared CarOwnerAddEditForm (admin + shop variant): only name/phone/pincode required; email required only when attachEmail is checked. */
export const carOwnerAddEditFormSchema = z
  .object({
    name: requiredTrimmed("Name"),
    phone: phone10,
    email: z.string().optional().default(""),
    pincode: requiredTrimmed("Zip code"),
    address: z.string().trim().optional().default(""),
    city: z.string().trim().optional().default(""),
    attachEmail: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.attachEmail && !EMAIL_RE.test((data.email ?? "").trim())) {
      ctx.addIssue({ code: "custom", message: "Valid email required.", path: ["email"] });
    }
  });

/** Admin > Car Owners page inline add/edit form: address required, no pincode, optional attach-email. */
export const carOwnerPageSchema = z
  .object({
    name: requiredTrimmed("Full Name"),
    phone: phone10,
    email: optionalEmail,
    address: requiredTrimmed("Address"),
    city: z.string().trim().optional().default(""),
    attachEmail: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.attachEmail && !EMAIL_RE.test((data.email ?? "").trim())) {
      ctx.addIssue({ code: "custom", message: "Valid email required.", path: ["email"] });
    }
  });

/** Admin > Auto Shop Owners page inline add/edit form. */
export const autoShopOwnerPageSchema = z.object({
  name: requiredTrimmed("Business Name"),
  phone: phone10,
  email: optionalEmail,
  city: z.string().trim().optional().default(""),
  address: z.string().trim().optional().default(""),
  zipCode: z
    .string({ error: "Postal code is required." })
    .trim()
    .min(1, "Postal code is required.")
    .refine((v) => /^[A-Z]\d[A-Z][ ]?\d[A-Z]\d$/i.test(v), "Enter a valid Canadian Postal Code (e.g. K1A0B1)."),
  shopType: z.array(z.string()).min(1, "Shop type is required."),
});

/** Admin > SubAdmin/Staff User management inline add/edit form. */
export const staffUserFormSchema = z.object({
  name: requiredTrimmed("Name"),
  email,
  phone: z
    .string()
    .optional()
    .default("")
    .refine(
      (v) =>
        !v ||
        /^(\+1\s?\d{3}[\s-]?\d{3}[\s-]?\d{4}|(\+91\s?|0)?[6-9]\d{9}|(\+1|1)?\s?\d{3}[\s-]?\d{3}[\s-]?\d{4})$/.test(v),
      "Enter a valid phone number. Canada/USA: +1 234 567 8901, India: +91 98765 43210",
    ),
  role: requiredTrimmed("Role"),
});

/** Dealers/Associates generic list-page add/edit form (fieldMode-aware). */
export function dummyUserFormSchema(options: { isWebMode: boolean; showAddress: boolean }) {
  return z
    .object({
      name: requiredTrimmed("Full Name"),
      email,
      phone: phone10,
      primaryLabel: requiredTrimmed("This field"),
      city: z.string().trim().optional().default(""),
      address: z.string().trim().optional().default(""),
      region: z.string().trim().optional().default(""),
      websiteUrl: z.string().trim().optional().default(""),
    })
    .superRefine((data, ctx) => {
      if (options.isWebMode) {
        const trimmed = data.websiteUrl.trim();
        let valid = false;
        if (trimmed) {
          try {
            const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
            valid = Boolean(new URL(withProtocol).hostname);
          } catch {
            valid = false;
          }
        }
        if (!valid) {
          ctx.addIssue({ code: "custom", message: "Enter a valid website URL.", path: ["websiteUrl"] });
        }
        if (options.showAddress && !data.address.trim()) {
          ctx.addIssue({ code: "custom", message: "Address is required.", path: ["address"] });
        }
      } else {
        if (!data.address.trim()) {
          ctx.addIssue({ code: "custom", message: "Address is required.", path: ["address"] });
        }
        if (!data.region.trim()) {
          ctx.addIssue({ code: "custom", message: "This field is required.", path: ["region"] });
        }
      }
    });
}

// ─── Public onboarding forms (unauthenticated) ────────────────────────────
/** AutoShopOwnerOnboarding.tsx: initial profile step before OTP verification. */
export const autoShopOwnerOnboardingSchema = z.object({
  phone: z
    .string({ error: "Enter a valid phone number." })
    .refine((v) => {
      const d = digitsOnly(v);
      return d.length >= 5 && d.length <= 15;
    }, "Enter a valid phone number (5-15 digits)."),
  name: requiredTrimmed("Full Name"),
  email,
  pincode: requiredTrimmed("Pincode"),
  address: requiredTrimmed("Address"),
});

/** CarOwnerOnboarding.tsx: complete-profile step after sign-in. */
export const carOwnerOnboardingSchema = z.object({
  name: requiredTrimmed("Full name"),
  email,
  pincode: requiredTrimmed("Postal code"),
  address: requiredTrimmed("Address"),
});

// ─── Auth sign-in schemas ──────────────────────────────────────────────────
export const signInEmailSchema = z.object({ email });
export const signInPhoneSchema = z.object({ phone: phone10 });
/** Admin sign-in "get OTP" step: same field set regardless of email/phone mode, so the resolver type stays stable while switching. */
export function signInRequestSchema(loginWithEmail: boolean) {
  return z.object({
    email: z.string().trim().optional().default(""),
    phone: z.string().trim().optional().default(""),
  }).superRefine((data, ctx) => {
    if (loginWithEmail) {
      if (!EMAIL_RE.test(data.email.trim())) {
        ctx.addIssue({ code: "custom", message: "Enter a valid email address.", path: ["email"] });
      }
    } else if (data.phone.replace(/\D/g, "").length !== 10) {
      ctx.addIssue({ code: "custom", message: "Phone must be exactly 10 digits.", path: ["phone"] });
    }
  });
}
export const signInOtpSchema = z.object({
  otp: z
    .string({ error: "Enter the 6-digit OTP." })
    .trim()
    .length(6, "Enter the 6-digit OTP."),
});
export const emailPasswordSignInSchema = z.object({
  email,
  password: z.string({ error: "Password is required." }).min(1, "Password is required."),
});

/** Sign-up forms (email + password, min 6 chars). */
export const signUpEmailPasswordSchema = z.object({
  email,
  password: passwordMin6,
});

export type CustomerIdentityValues = z.infer<typeof customerIdentitySchema>;
export type ShopPeopleValues = z.infer<typeof shopPeopleSchema>;
export type TeamMemberValues = z.infer<typeof teamMemberSchema>;
export type OwnerProfileEditValues = z.infer<typeof ownerProfileEditSchema>;
export type ShopCustomerValues = z.infer<typeof shopCustomerSchema>;
export type CarOwnerAddEditFormValues = z.infer<typeof carOwnerAddEditFormSchema>;
export type CarOwnerAddEditFormInput = z.input<typeof carOwnerAddEditFormSchema>;
export type CarOwnerPageValues = z.infer<typeof carOwnerPageSchema>;
export type CarOwnerPageFormInput = z.input<typeof carOwnerPageSchema>;
export type AutoShopOwnerPageValues = z.infer<typeof autoShopOwnerPageSchema>;
export type AutoShopOwnerPageFormInput = z.input<typeof autoShopOwnerPageSchema>;
export type StaffUserFormValues = z.infer<typeof staffUserFormSchema>;
export type StaffUserFormInput = z.input<typeof staffUserFormSchema>;
export type ShopCustomerFormInput = z.input<typeof shopCustomerSchema>;
export type DummyUserFormInput = z.input<ReturnType<typeof dummyUserFormSchema>>;
export type SignInEmailValues = z.infer<typeof signInEmailSchema>;
export type SignInPhoneValues = z.infer<typeof signInPhoneSchema>;
export type SignInRequestValues = z.infer<ReturnType<typeof signInRequestSchema>>;
export type SignInRequestInput = z.input<ReturnType<typeof signInRequestSchema>>;
export type SignInOtpValues = z.infer<typeof signInOtpSchema>;
export type EmailPasswordSignInValues = z.infer<typeof emailPasswordSignInSchema>;
export type SignUpEmailPasswordValues = z.infer<typeof signUpEmailPasswordSchema>;
export type AutoShopOwnerOnboardingValues = z.infer<typeof autoShopOwnerOnboardingSchema>;
export type CarOwnerOnboardingValues = z.infer<typeof carOwnerOnboardingSchema>;
