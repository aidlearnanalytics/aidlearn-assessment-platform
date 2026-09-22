import { z } from "zod";

export const questionOptionSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  isCorrect: z.boolean(),
});

export const questionInputSchema = z
  .object({
    prompt: z.string().min(5, "Prompt is too short"),
    type: z.enum(["MULTIPLE_CHOICE", "MULTIPLE_SELECT", "TRUE_FALSE", "SHORT_ANSWER", "FORMULA_ENTRY"]),
    options: z.array(questionOptionSchema).optional(),
    correctAnswer: z.string().optional(),
    explanation: z.string().optional(),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]),
    industry: z.string().optional(),
    points: z.coerce.number().int().min(1).max(20).default(1),
    skillName: z.string().min(1, "Skill is required"),
    categoryName: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const needsOptions = data.type === "MULTIPLE_CHOICE" || data.type === "MULTIPLE_SELECT";
    if (needsOptions) {
      if (!data.options || data.options.length < 2) {
        ctx.addIssue({ code: "custom", message: "Add at least two options", path: ["options"] });
      } else if (!data.options.some((o) => o.isCorrect)) {
        ctx.addIssue({ code: "custom", message: "Mark at least one option correct", path: ["options"] });
      }
    }
    if (data.type === "SHORT_ANSWER" || data.type === "FORMULA_ENTRY") {
      if (!data.correctAnswer || data.correctAnswer.trim().length === 0) {
        ctx.addIssue({ code: "custom", message: "Correct answer is required", path: ["correctAnswer"] });
      }
    }
  });

export type QuestionInput = z.infer<typeof questionInputSchema>;
