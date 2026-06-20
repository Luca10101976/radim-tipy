import { z } from "zod";
import { CATEGORIES } from "./types";
import { containsBlockedContent } from "./contentFilter";

const categorySchema = z.enum(CATEGORIES as [string, ...string[]]);

export const REPORT_REASONS = [
  "Nevhodný nebo urážlivý obsah",
  "Nebezpečný postup",
  "Spam nebo nesmysl",
  "Jiný důvod",
] as const;

export const createTipSchema = z
  .object({
    title: z.string().trim().min(1, "Název je povinný.").max(80, "Max. 80 znaků."),
    category: categorySchema,
    problem: z.string().trim().min(1, "Popis problému je povinný.").max(300, "Max. 300 znaků."),
    solution: z.string().trim().min(1, "Řešení je povinné.").max(500, "Max. 500 znaků."),
    authorResult: z.enum(["fungovalo", "nefungovalo"]),
    warning: z
      .string()
      .trim()
      .max(200, "Max. 200 znaků.")
      .optional()
      .transform((v) => (v && v.length > 0 ? v : undefined)),
    tags: z
      .array(z.string().trim().min(1).max(40))
      .max(15)
      .default([]),
    parent_id: z.string().uuid().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    const combined = [data.title, data.problem, data.solution, data.warning ?? ""].join(" ");
    if (containsBlockedContent(combined)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Obsah obsahuje nevhodná slova.",
        path: ["_blocked"],
      });
    }
  });

export const voteSchema = z.object({
  tipId: z.string().uuid(),
  voteType: z.enum(["up", "down"]),
});

export const voteDeleteSchema = z.object({
  tipId: z.string().uuid(),
});

export const reportSchema = z.object({
  tipId: z.string().uuid(),
  reason: z.enum(REPORT_REASONS),
});

export type CreateTipInput = z.infer<typeof createTipSchema>;
