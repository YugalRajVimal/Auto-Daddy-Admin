import { z } from "zod";
import { optionalMoney, optionalNonNegativeInt, requiredTrimmed } from "../primitives";

export const jobCardFormSchema = z
  .object({
    customerId: requiredTrimmed("Customer"),
    vehicleId: requiredTrimmed("Vehicle"),
    odoIn: optionalNonNegativeInt,
    odoOut: optionalNonNegativeInt,
    discount: optionalMoney,
    services: z
      .array(
        z.object({
          id: z.string().optional(),
          name: z.string().optional(),
          price: z.union([z.string(), z.number()]).optional(),
        })
      )
      .min(1, "Add at least one service."),
  })
  .superRefine((data, ctx) => {
    const inn = data.odoIn?.trim();
    const out = data.odoOut?.trim();
    if (inn && out) {
      const a = Number(inn);
      const b = Number(out);
      if (Number.isFinite(a) && Number.isFinite(b) && b < a) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "ODO OUT must be greater than or equal to ODO IN.",
          path: ["odoOut"],
        });
      }
    }
  });

export type JobCardFormValues = z.infer<typeof jobCardFormSchema>;
