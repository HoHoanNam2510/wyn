import { z } from 'zod';

export const idiomExampleSchema = z.object({
  sentence: z
    .string()
    .min(1, 'Sentence is required.')
    .max(500, 'Sentence must be 500 characters or less.'),
});
