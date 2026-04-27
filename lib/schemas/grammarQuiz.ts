import { z } from 'zod';

export const grammarQuizSetupSchema = z.object({
  sectionId: z.string(),
  count: z.union([z.coerce.number().int().positive(), z.literal('all')]),
});
