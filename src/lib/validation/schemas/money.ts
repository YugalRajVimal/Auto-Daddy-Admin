import { z } from "zod";
import { money, moneyPositive, optionalMoney, requiredDate, requiredTrimmed } from "../primitives";

export const walletEntrySchema = z.object({
  amount: moneyPositive,
  date: requiredDate("Date"),
  vendor: requiredTrimmed("Vendor"),
  category: requiredTrimmed("Category"),
  note: z.string().optional().default(""),
  paymentMode: z.string().optional().default(""),
});

export const bankAccountSchema = z.object({
  label: requiredTrimmed("Account label"),
  balance: money,
  bankName: z.string().optional().default(""),
  accountNumber: z.string().optional().default(""),
  email: z.string().optional().default(""),
});

export const accountLedgerEntrySchema = z
  .object({
    amount: moneyPositive,
    date: requiredDate("Date"),
    vendor: requiredTrimmed("Vendor / payee"),
    category: requiredTrimmed("Category"),
    paymentMode: requiredTrimmed("Payment mode"),
    note: z.string().optional().default(""),
    chequeNumber: z.string().optional().default(""),
    bankTransferRef: z.string().optional().default(""),
  })
  .superRefine((data, ctx) => {
    const mode = data.paymentMode.toLowerCase();
    if (mode.includes("cheque") && !data.chequeNumber?.trim()) {
      ctx.addIssue({ code: "custom", message: "Cheque number is required.", path: ["chequeNumber"] });
    }
    if ((mode.includes("bank") || mode.includes("transfer")) && !data.bankTransferRef?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Bank transfer reference is required.",
        path: ["bankTransferRef"],
      });
    }
  });

export const invoiceLineItemSchema = z.object({
  description: requiredTrimmed("Description"),
  quantity: z
    .string()
    .trim()
    .min(1, "Quantity is required.")
    .refine((v) => Number.isFinite(Number(v)) && Number(v) > 0, "Quantity must be greater than 0."),
  rate: money,
  amount: optionalMoney,
});

export const invoiceFormSchema = z.object({
  client: requiredTrimmed("Client"),
  date: requiredDate("Date"),
  items: z.array(invoiceLineItemSchema).min(1, "Add at least one line item."),
  note: z.string().optional().default(""),
});

export type WalletEntryValues = z.infer<typeof walletEntrySchema>;
export type BankAccountValues = z.infer<typeof bankAccountSchema>;
export type AccountLedgerEntryValues = z.infer<typeof accountLedgerEntrySchema>;
