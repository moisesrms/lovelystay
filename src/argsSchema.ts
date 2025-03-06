import minimist from "minimist";
import { z } from "zod";

const sqlInjectionPattern =
  /['";]|(--)|(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b)/i;

const ProgrammingLanguagesSchema = z
  .union([z.string(), z.array(z.string())])
  .transform((val) =>
    Array.isArray(val) ? val : val.split(",").map((lang) => lang.trim())
  )
  .refine(
    (langs) =>
      langs.every(
        (lang) =>
          /^[a-zA-Z#+\s]+$/.test(lang) && !sqlInjectionPattern.test(lang)
      ),
    {
      message:
        "Programming languages can only contain letters, spaces, " +
        'and the symbols "+" or "#", ' +
        "and must not include SQL keywords.",
    }
  )
  .optional();

export const FetchArgsSchema = z
  .object({
    _: z.array(z.string()).optional(),
    f: z.literal(true),
    command: z.literal("fetch").default("fetch"),
    name: z
      .string({
        required_error: "Name is required for fetch command",
        invalid_type_error: "Name must be a string",
      })
      .min(2, "Name must be at least 2 characters long")
      .max(50, "Name must be at most 50 characters long")
      .refine(
        (val) => !sqlInjectionPattern.test(val),
        "Invalid characters or SQL keywords detected"
      ),
  })
  .strict();

export const ListArgsSchema = z
  .object({
    _: z.array(z.string()).optional(),
    l: z.literal(true),
    command: z.literal("list").default("list"),
    name: z
      .string()
      .min(2, "Name must be at least 2 characters long")
      .max(50, "Name must be at most 50 characters long")
      .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces")
      .refine(
        (val) => !sqlInjectionPattern.test(val),
        "Invalid characters or SQL keywords detected"
      )
      .optional(),
    location: z
      .string()
      .min(2, "Location must be at least 2 characters long")
      .max(100, "Location must be at most 100 characters long")
      .regex(
        /^[\p{L}0-9\s,."'\-]+$/u,
        "Location can contain letters, numbers, spaces, commas, " +
          "double quotes, apostrophes, periods, and hyphens"
      )
      .refine(
        (val) => !sqlInjectionPattern.test(val),
        "Invalid characters or SQL keywords detected"
      )
      .optional(),
    languages: ProgrammingLanguagesSchema.optional(),
  })
  .strict();

export const HelpArgsSchema = z
  .object({
    _: z.array(z.string()).optional(),
    h: z.boolean().optional().default(true),
    command: z.literal("help").default("help"),
  })
  .strict();

export function validateInput(args: minimist.ParsedArgs) {
  if (args.f) {
    return FetchArgsSchema.safeParse(args);
  }
  if (args.l) {
    return ListArgsSchema.safeParse(args);
  }
  return HelpArgsSchema.safeParse(args);
}

export type FetchArgsType = z.infer<typeof FetchArgsSchema>;
export type ListArgsType = z.infer<typeof ListArgsSchema>;
export type HelpArgsType = z.infer<typeof HelpArgsSchema>;
export type ArgsType = FetchArgsType | ListArgsType | HelpArgsType;
