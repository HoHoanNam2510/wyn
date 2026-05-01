import { z } from 'zod';

export const feedbackSubmitSchema = z.object({
  type: z.enum(['GENERAL', 'BUG', 'FEATURE_REQUEST']),
  content: z
    .string()
    .min(10, 'At least 10 characters required')
    .max(2000, 'Maximum 2000 characters'),
});

export const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  content: z.string().min(1, 'Content is required').max(500),
  expiresAt: z.string().optional(),
});

export type FeedbackSubmitValues = z.infer<typeof feedbackSubmitSchema>;
export type AnnouncementValues = z.infer<typeof announcementSchema>;
