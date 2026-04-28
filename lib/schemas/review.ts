import { z } from 'zod';

export const reviewModeValues = [
  'flashcard',
  'fill_blank',
  'sentence_build',
  'writing_practice',
] as const;
export type ReviewMode = (typeof reviewModeValues)[number];

export const reviewSetupSchema = z.object({
  mode: z.enum(reviewModeValues),
  categoryId: z.string().min(1),
  count: z.union([z.literal('all'), z.coerce.number().int().min(1).max(200)]),
});
export type ReviewSetupValues = z.infer<typeof reviewSetupSchema>;
