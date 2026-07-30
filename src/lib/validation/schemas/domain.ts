import { z } from "zod";
import { futureDate, httpUrl, requiredDate, requiredTrimmed } from "../primitives";

export const domainSchema = z.object({
  domain: requiredTrimmed("Domain"),
  url: httpUrl,
  expiryDate: futureDate("Expiry date"),
  shopOwner: z.string().optional().default(""),
  status: z.string().optional().default(""),
});

export const websiteTemplateSchema = z.object({
  name: requiredTrimmed("Template name"),
  url: httpUrl,
  date: requiredDate("Date"),
  shopType: requiredTrimmed("Shop type"),
});

export const shopDomainBlockSchema = z.object({
  domain: requiredTrimmed("Domain"),
  url: httpUrl,
  expiryDate: futureDate("Expiry date"),
});

export type DomainValues = z.infer<typeof domainSchema>;
export type WebsiteTemplateValues = z.infer<typeof websiteTemplateSchema>;
