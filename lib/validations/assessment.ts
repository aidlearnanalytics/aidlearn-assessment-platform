import { z } from "zod";

export const assessmentInputSchema = z.object({
  name: z.string().min(3, "Name is too short"),
  companyId: z.string().min(1, "Pick a company"),
  description: z.string().optional(),
  durationMinutes: z.coerce.number().int().min(5).max(480).default(60),
  numQuestions: z.coerce.number().int().min(1).default(20),
  categories: z.array(z.string()).optional(),
  randomizeQuestions: z.boolean().default(true),
  randomizeOptions: z.boolean().default(true),
  requireScreenShare: z.boolean().default(true),
  requireFullscreen: z.boolean().default(true),
  monitorTabSwitch: z.boolean().default(true),
  monitorVisibility: z.boolean().default(true),
  maxViolations: z.coerce.number().int().min(1).optional(),
  passingScorePct: z.coerce.number().int().min(0).max(100).optional(),
});

export type AssessmentInput = z.infer<typeof assessmentInputSchema>;
