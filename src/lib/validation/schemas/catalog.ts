import { z } from "zod";
import { httpUrl, requiredTrimmed } from "../primitives";

export const namedCatalogSchema = z.object({
  name: requiredTrimmed("Name"),
  status: z.string().optional().default(""),
});

export const citySchema = z.object({
  name: requiredTrimmed("City name"),
  province: requiredTrimmed("Province"),
  status: z.string().optional().default(""),
});

export const provinceSchema = z.object({
  name: requiredTrimmed("Province name"),
  nickName: z.string().trim().optional().default(""),
  status: z.string().optional().default(""),
});

export const serviceSchema = z.object({
  name: requiredTrimmed("Service name"),
  shopType: requiredTrimmed("Shop type"),
  status: z.string().optional().default(""),
  odoOutRequired: z.boolean().optional().default(false),
});

export const categorySchema = z.object({
  name: requiredTrimmed("Category name"),
  status: z.string().optional().default(""),
});

export const subServiceSchema = z.object({
  serviceId: requiredTrimmed("Service"),
  name: requiredTrimmed("Sub service name"),
  status: requiredTrimmed("Status"),
});

export const carBrandSchema = z.object({
  name: requiredTrimmed("Brand name"),
  status: z.string().optional().default(""),
});

export const carCompanySchema = z.object({
  name: requiredTrimmed("Company name"),
  status: z.string().optional().default(""),
});

export const vehicleTypeSchema = z.object({
  name: requiredTrimmed("Vehicle type"),
  status: z.string().optional().default(""),
});

export const roleManagerSchema = z.object({
  name: requiredTrimmed("Role name"),
  type: requiredTrimmed("Type"),
});

export const taskSchema = z.object({
  name: requiredTrimmed("Task name"),
  description: z.string().trim().optional().default(""),
  link: httpUrl,
});

export type NamedCatalogValues = z.infer<typeof namedCatalogSchema>;
export type NamedCatalogInput = z.input<typeof namedCatalogSchema>;
export type SubServiceValues = z.infer<typeof subServiceSchema>;
export type CitySchemaValues = z.infer<typeof citySchema>;
export type CitySchemaInput = z.input<typeof citySchema>;
export type ProvinceSchemaValues = z.infer<typeof provinceSchema>;
export type ProvinceSchemaInput = z.input<typeof provinceSchema>;
export type ServiceSchemaValues = z.infer<typeof serviceSchema>;
export type ServiceSchemaInput = z.input<typeof serviceSchema>;
export type TaskSchemaValues = z.infer<typeof taskSchema>;
export type TaskSchemaInput = z.input<typeof taskSchema>;
export type RoleManagerValues = z.infer<typeof roleManagerSchema>;

export const servicesSelectionSchema = z.object({
  serviceIds: z.array(z.string()).min(1, "Select at least one service."),
});
export type ServicesSelectionValues = z.infer<typeof servicesSelectionSchema>;
