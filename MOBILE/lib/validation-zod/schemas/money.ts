import { z } from "zod";
import { money, moneyPositive, requiredDate, requiredTrimmed } from "../primitives";

export const walletEntrySchema = z.object({
  amount: moneyPositive,
  date: requiredDate("Date"),
  vendor: requiredTrimmed("Vendor"),
  category: requiredTrimmed("Category"),
  subcategory: requiredTrimmed("Subcategory"),
  note: z.string().optional().default(""),
});

export const bankAccountSchema = z.object({
  label: requiredTrimmed("Account label"),
  balance: money,
  bankName: z.string().optional().default(""),
  accountNumber: z.string().optional().default(""),
});

export type WalletEntryValues = z.infer<typeof walletEntrySchema>;
export type BankAccountValues = z.infer<typeof bankAccountSchema>;
