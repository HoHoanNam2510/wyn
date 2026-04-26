import { z } from 'zod';

export const partOfSpeechValues = [
  'noun',
  'verb',
  'adjective',
  'adverb',
  'preposition',
  'conjunction',
  'pronoun',
  'interjection',
  'phrase',
  'other',
] as const;

export const exampleSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, 'Example text is required'),
});

export const contextSchema = z.object({
  id: z.string().optional(),
  partOfSpeech: z.enum(partOfSpeechValues),
  phonetic: z.string().optional(),
  audioUrl: z.string().url().optional().or(z.literal('')),
  meaning: z.string().min(1, 'Meaning is required'),
  order: z.number().int().optional(),
  examples: z.array(exampleSchema).min(1, 'At least one example is required'),
});

export const wordSchema = z.object({
  term: z.string().min(1, 'Term is required').max(100),
  imageUrl: z.string().url().optional().or(z.literal('')),
  categoryIds: z.array(z.string()),
  contexts: z.array(contextSchema).min(1, 'At least one context is required'),
});

export type WordFormValues = z.infer<typeof wordSchema>;
export type ContextFormValues = z.infer<typeof contextSchema>;
export type ExampleFormValues = z.infer<typeof exampleSchema>;
