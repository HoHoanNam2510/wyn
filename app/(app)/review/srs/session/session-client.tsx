'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { BrainCircuit, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SrsQuestion } from '@/lib/review/pickQuestions';
import type { SrsGrade } from '@/lib/srs';
import { updateWordSRS } from '@/app/actions/srs';
import { AudioButton } from '@/components/ui/audio-button';

type GradeCount = Record<SrsGrade, number>;

const GRADE_CONFIG: { grade: SrsGrade; label: string; className: string }[] = [
  {
    grade: 'again',
    label: 'Again',
    className:
      'bg-primary text-primary-foreground hover:bg-primary/90 border-primary',
  },
  {
    grade: 'hard',
    label: 'Hard',
    className:
      'bg-secondary text-secondary-foreground hover:bg-secondary/90 border-secondary',
  },
  {
    grade: 'good',
    label: 'Good',
    className:
      'bg-tertiary text-tertiary-foreground hover:bg-tertiary/90 border-tertiary',
  },
  {
    grade: 'easy',
    label: 'Easy',
    className: 'bg-green-600 text-white hover:bg-green-700 border-green-600',
  },
];

export function SrsSessionClient({ questions }: { questions: SrsQuestion[] }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'revealing' | 'grading'>('revealing');
  const [gradeCount, setGradeCount] = useState<GradeCount>({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const current = questions[index];
  const total = questions.length;

  async function handleGrade(grade: SrsGrade) {
    if (submitting) return;
    setSubmitting(true);
    await updateWordSRS(current.wordId, grade);
    setGradeCount((prev) => ({ ...prev, [grade]: prev[grade] + 1 }));
    if (index + 1 >= total) {
      setDone(true);
    } else {
      setIndex(index + 1);
      setPhase('revealing');
    }
    setSubmitting(false);
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto mt-10 flex flex-col items-center gap-6">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <BrainCircuit className="h-8 w-8 text-primary" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold">Session complete!</h2>
          <p className="text-muted-foreground mt-1">
            {total} word{total !== 1 ? 's' : ''} reviewed
          </p>
        </div>

        <div className="w-full bg-card border border-border rounded-xl p-5 space-y-3">
          <p className="text-sm font-semibold">Grade breakdown</p>
          {GRADE_CONFIG.map(({ grade, label }) => (
            <div
              key={grade}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium">{gradeCount[grade]}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push('/review/srs')}>
            Back to SRS
          </Button>
          <Button onClick={() => router.push('/review')}>Review more</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span className="font-medium flex items-center gap-1.5">
          <BrainCircuit className="h-4 w-4" />
          SRS Review
        </span>
        <span>
          {index + 1} / {total}
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-1.5">
        <div
          className="bg-primary h-1.5 rounded-full transition-all"
          style={{ width: `${(index / total) * 100}%` }}
        />
      </div>

      {/* Card */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        {/* Term + phonetic + audio on same row */}
        <div className="text-center space-y-1">
          <p className="text-3xl font-bold tracking-tight">{current.term}</p>
          {(current.phonetic || current.audioUrl) && (
            <div className="flex items-center justify-center gap-2">
              {current.phonetic && (
                <span className="text-muted-foreground text-sm">
                  {current.phonetic}
                </span>
              )}
              {current.audioUrl && <AudioButton url={current.audioUrl} />}
            </div>
          )}
        </div>

        {/* Image */}
        {current.imageUrl && (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
            <Image
              src={current.imageUrl}
              alt={current.term}
              fill
              sizes="(max-width: 640px) 100vw, 512px"
              className="object-cover"
            />
          </div>
        )}

        {/* Meaning */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{current.partOfSpeech}</Badge>
          <span className="text-sm text-muted-foreground">
            {current.meaning}
          </span>
        </div>

        {/* Example sentences — shown after reveal */}
        {phase === 'grading' && current.exampleSentences.length > 0 && (
          <div className="border-t border-border pt-4 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Examples
            </p>
            {current.exampleSentences.map((s, i) => (
              <p key={i} className="text-sm text-muted-foreground italic">
                &ldquo;{s}&rdquo;
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      {phase === 'revealing' ? (
        <Button className="w-full" onClick={() => setPhase('grading')}>
          Show Answer
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {GRADE_CONFIG.map(({ grade, label, className }) => (
            <button
              key={grade}
              disabled={submitting}
              onClick={() => handleGrade(grade)}
              className={cn(
                'rounded-lg border px-2 py-3 text-sm font-semibold transition-opacity',
                className,
                submitting && 'opacity-50 cursor-not-allowed'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
