import type { Metadata } from 'next';
import { FeedbackForm } from './feedback-form';

export const metadata: Metadata = { title: 'Feedback' };

export default function FeedbackPage() {
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Feedback</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Góp ý, báo lỗi, hoặc đề xuất tính năng mới.
        </p>
      </div>
      <FeedbackForm />
    </div>
  );
}
