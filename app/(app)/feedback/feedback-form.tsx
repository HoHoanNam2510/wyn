'use client';

import { useTransition } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { submitFeedback } from '@/app/actions/admin';
import {
  feedbackSubmitSchema,
  type FeedbackSubmitValues,
} from '@/lib/schemas/admin';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const TYPES: { value: FeedbackSubmitValues['type']; label: string }[] = [
  { value: 'GENERAL', label: 'General' },
  { value: 'BUG', label: 'Bug' },
  { value: 'FEATURE_REQUEST', label: 'Feature Request' },
];

export function FeedbackForm() {
  const [isPending, startTransition] = useTransition();

  const form = useForm<FeedbackSubmitValues>({
    resolver: zodResolver(feedbackSubmitSchema),
    defaultValues: { type: 'GENERAL', content: '' },
  });

  const content = useWatch({
    control: form.control,
    name: 'content',
    defaultValue: '',
  });

  function onSubmit(data: FeedbackSubmitValues) {
    startTransition(async () => {
      try {
        await submitFeedback(data);
        toast.success('Cảm ơn bạn đã góp ý!');
        form.reset();
      } catch {
        toast.error('Gửi thất bại, thử lại sau.');
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Loại</FormLabel>
              <div className="flex gap-2">
                {TYPES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => field.onChange(value)}
                    className={cn(
                      'px-4 py-1.5 rounded-full text-sm font-medium border transition-colors',
                      field.value === value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:border-primary hover:text-foreground'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-baseline justify-between">
                <FormLabel>Nội dung</FormLabel>
                <span
                  className={cn(
                    'text-xs tabular-nums',
                    content.length > 1800
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                  )}
                >
                  {content.length} / 2000
                </span>
              </div>
              <FormControl>
                <Textarea placeholder="Mô tả chi tiết..." rows={6} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Đang gửi…' : 'Gửi feedback'}
        </Button>
      </form>
    </Form>
  );
}
