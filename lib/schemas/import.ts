import { z } from 'zod';
import { partOfSpeechValues } from './word';

export const importWordSchema = z.object({
  term: z.string().min(1, 'Term is required').max(100),
  imageUrl: z.string().url().optional().or(z.literal('')),
  categories: z.array(z.string().min(1)).optional().default([]),
  contexts: z
    .array(
      z.object({
        partOfSpeech: z.enum(partOfSpeechValues),
        phonetic: z.string().optional(),
        audioUrl: z.string().url().optional().or(z.literal('')),
        meaning: z.string().min(1, 'Meaning is required'),
        examples: z
          .array(z.object({ text: z.string().min(1) }))
          .min(1, 'At least one example is required'),
      })
    )
    .min(1, 'At least one context is required'),
});

export const importFileSchema = z
  .array(importWordSchema)
  .min(1, 'File must contain at least one word')
  .max(500, 'Maximum 500 words per import');

export type ImportWord = z.infer<typeof importWordSchema>;
export type ImportFileData = z.infer<typeof importFileSchema>;
