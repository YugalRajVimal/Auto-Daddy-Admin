import { z } from "zod";
import { requiredDate, requiredTrimmed, todayOrFuture } from "../primitives";

export const faqSchema = z.object({
  question: requiredTrimmed("Question"),
  answer: requiredTrimmed("Answer"),
  status: z.string().default(""),
});

/** Admin > Product Features form: a single free-text "feature" description. */
export const featureSchema = z.object({
  feature: requiredTrimmed("Feature"),
});

/** Admin > Privacy and Disclaimer form: date/type are plain selects with defaults; only description is free text. */
export const privacySchema = z.object({
  description: requiredTrimmed("Description"),
});

export const thoughtOfDaySchema = z.object({
  date: todayOrFuture("Date"),
  subject: requiredTrimmed("Subject"),
  note: z.string().default(""),
});

export const inviteHelpSchema = z.object({
  date: requiredDate("Date"),
  title: requiredTrimmed("Title"),
  note: requiredTrimmed("Note"),
});

export const invoiceTemplateContentSchema = z.object({
  date: requiredDate("Date"),
  userType: requiredTrimmed("User type"),
  templateName: requiredTrimmed("Template name"),
});

const DISPLAY_DATE_RE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

/** Validates a "DD/MM/YYYY" display date, matching Owner > Digital Diary's date input. */
function isValidDisplayDate(value: string): boolean {
  const match = value.trim().match(DISPLAY_DATE_RE);
  if (!match) return false;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

/** Owner > Digital Diary note create/edit form. Past-date policy is enforced in the page on create/assign. */
export const diaryNoteSchema = z.object({
  date: requiredTrimmed("Date").refine(isValidDisplayDate, "Enter a valid date as DD/MM/YYYY."),
  title: requiredTrimmed("Title"),
  description: z.string().default(""),
  time: z.string().default(""),
  attachmentName: z.string().default(""),
  urgent: z.boolean().default(false),
});

export type FaqFormInput = z.input<typeof faqSchema>;
export type FaqValues = z.infer<typeof faqSchema>;
export type FeatureValues = z.infer<typeof featureSchema>;
export type PrivacyValues = z.infer<typeof privacySchema>;
export type ThoughtOfDayValues = z.infer<typeof thoughtOfDaySchema>;
export type DiaryNoteFormInput = z.input<typeof diaryNoteSchema>;
export type DiaryNoteValues = z.infer<typeof diaryNoteSchema>;
export type InviteHelpValues = z.infer<typeof inviteHelpSchema>;
export type InvoiceTemplateContentValues = z.infer<typeof invoiceTemplateContentSchema>;

/** Portal help ticket: service subject + recorded audio required. */
export const helpTicketSchema = z
  .object({
    serviceId: requiredTrimmed("Subject"),
    hasRecording: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.hasRecording) {
      ctx.addIssue({
        code: "custom",
        message: "Please record your message before saving.",
        path: ["hasRecording"],
      });
    }
  });
export type HelpTicketValues = z.infer<typeof helpTicketSchema>;
