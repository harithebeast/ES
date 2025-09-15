import { z } from "zod";

export const cityValues = ["Chandigarh", "Mohali", "Zirakpur", "Panchkula", "Other"] as const;
export const propertyTypeValues = ["Apartment", "Villa", "Plot", "Office", "Retail"] as const;
export const bhkValues = ["1", "2", "3", "4", "Studio"] as const;
export const purposeValues = ["Buy", "Rent"] as const;
export const timelineValues = ["0-3m", "3-6m", ">6m", "Exploring"] as const;
export const sourceValues = ["Website", "Referral", "Walk-in", "Call", "Other"] as const;
export const statusValues = [
  "New",
  "Qualified",
  "Contacted",
  "Visited",
  "Negotiation",
  "Converted",
  "Dropped",
] as const;

export const buyerBaseSchema = z
  .object({
    fullName: z.string().min(2).max(80),
    email: z.string().email().optional().or(z.literal("").transform(() => undefined)),
    phone: z.string().regex(/^\d{10,15}$/),
    city: z.enum(cityValues),
    propertyType: z.enum(propertyTypeValues),
    bhk: z.enum(bhkValues).optional(),
    purpose: z.enum(purposeValues),
    budgetMin: z.coerce.number().int().positive().optional(),
    budgetMax: z.coerce
      .number()
      .int()
      .positive()
      .optional(),
    timeline: z.enum(timelineValues),
    source: z.enum(sourceValues),
    status: z.enum(statusValues).default("New").optional(),
    notes: z.string().max(1000).optional(),
    tags: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      if (data.budgetMin != null && data.budgetMax != null) {
        return data.budgetMax >= data.budgetMin;
      }
      return true;
    },
    { message: "budgetMax must be ≥ budgetMin", path: ["budgetMax"] }
  )
  .refine(
    (data) => {
      const needsBhk = data.propertyType === "Apartment" || data.propertyType === "Villa";
      return needsBhk ? data.bhk != null : true;
    },
    { message: "bhk is required for Apartment/Villa", path: ["bhk"] }
  );

export const createBuyerSchema = buyerBaseSchema;

export const updateBuyerSchema = buyerBaseSchema.safeExtend({
  id: z.string().uuid(),
  updatedAt: z.string().datetime(),
});

export type BuyerCreateInput = z.infer<typeof createBuyerSchema>;
export type BuyerUpdateInput = z.infer<typeof updateBuyerSchema>;


