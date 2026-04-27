import { z } from 'zod';

export const grammarExampleSchema = z.object({
  sentence: z
    .string()
    .min(1, 'Sentence is required')
    .max(500, 'Sentence must be 500 characters or less'),
});

export type GrammarExampleValues = z.infer<typeof grammarExampleSchema>;
