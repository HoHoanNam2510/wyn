'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  Trophy,
  Clock,
  RotateCcw,
  Lightbulb,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { IdiomQuizQuestion } from '@/lib/idiomQuiz/pickQuestions';
import { logIdiomReviewEvent } from '@/app/actions/idiomQuiz';

const ANSWER_SECS = 30;
const REVIEW_SECS = 15;

type AnswerRecord = {
  sentence: string;
  userChoicePhrase: string;
  correctIdiomPhrase: string;
  correctIdiomExplanation: string;
  correct: boolean;
};

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

export function IdiomQuizSessionClient({
  questions,
}: {
  questions: IdiomQuizQuestion[];
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'answering' | 'reviewing'>('answering');
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [done, setDone] = useState(false);
  const [countdown, setCountdown] = useState(ANSWER_SECS);
  const [sessionDuration, setSessionDuration] = useState(0);

  const sessionStartRef = useRef<number>(0);
  const questionStartRef = useRef<number>(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const advanceRef = useRef<() => void>(() => {});

  const currentQ = questions[index];
  const isLast = index === questions.length - 1;
  const progress = (index / questions.length) * 100;
  const isFeedback = phase === 'reviewing';

  useEffect(() => {
    sessionStartRef.current = Date.now();
  }, []);

  const advance = useCallback(() => {
    if (isLast) {
      setSessionDuration(Date.now() - sessionStartRef.current);
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setSelectedChoiceId(null);
      setPhase('answering');
      setCountdown(ANSWER_SECS);
    }
  }, [isLast]);

  useEffect(() => {
    advanceRef.current = advance;
  }, [advance]);

  // Per-question answering countdown
  useEffect(() => {
    questionStartRef.current = Date.now();
    if (done) return;
    if (countdownRef.current) clearInterval(countdownRef.current);

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          countdownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [index, done]);

  useEffect(() => {
    if (countdown === 0 && !done) {
      advanceRef.current();
    }
  }, [countdown, done]);

  const handleNext = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    advance();
  }, [advance]);

  const handleChoice = useCallback(
    (choiceId: string) => {
      if (phase !== 'answering') return;
      const q = currentQ;
      const correct = choiceId === q.correctIdiomId;
      const durationMs = Date.now() - questionStartRef.current;
      const userChoice = q.choices.find((c) => c.id === choiceId);

      setSelectedChoiceId(choiceId);
      setPhase('reviewing');
      setAnswers((prev) => [
        ...prev,
        {
          sentence: q.sentence,
          userChoicePhrase: userChoice?.phrase ?? '',
          correctIdiomPhrase: q.correctIdiomPhrase,
          correctIdiomExplanation: q.correctIdiomExplanation,
          correct,
        },
      ]);

      logIdiomReviewEvent({
        idiomId: q.correctIdiomId,
        correct,
        durationMs,
      }).catch(() => {});

      if (countdownRef.current) clearInterval(countdownRef.current);
      setCountdown(REVIEW_SECS);
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current!);
            countdownRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [phase, currentQ]
  );

  // Keyboard shortcuts 1-4
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!currentQ) return;
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= currentQ.choices.length) {
        handleChoice(currentQ.choices[num - 1].id);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentQ, handleChoice]);

  // ── Summary ───────────────────────────────────────────────────────────────
  if (done) {
    const correctCount = answers.filter((a) => a.correct).length;
    const wrongAnswers = answers.filter((a) => !a.correct);
    const pct =
      answers.length > 0
        ? Math.round((correctCount / answers.length) * 100)
        : 0;

    return (
      <div className="space-y-8">
        <div className="text-center py-6">
          <Trophy className="h-14 w-14 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Quiz complete!</h1>
          <div className="mt-6 flex flex-wrap items-start justify-center gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{pct}%</p>
              <p className="text-sm text-muted-foreground">accuracy</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">
                {correctCount}/{answers.length}
              </p>
              <p className="text-sm text-muted-foreground">correct</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1.5 justify-center">
                <Clock className="h-6 w-6 text-muted-foreground" />
                <p className="text-3xl font-bold">
                  {formatTime(sessionDuration)}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">time</p>
            </div>
          </div>
        </div>

        {wrongAnswers.length > 0 && (
          <div>
            <h2 className="font-semibold mb-3 text-xs text-muted-foreground uppercase tracking-wider">
              Needs work ({wrongAnswers.length})
            </h2>
            <div className="space-y-3">
              {wrongAnswers.map((a, i) => (
                <div
                  key={i}
                  className="px-4 py-3 bg-card border border-border rounded-lg space-y-2"
                >
                  <p className="text-sm italic text-muted-foreground">
                    &ldquo;{a.sentence}&rdquo;
                  </p>
                  <div className="flex items-start gap-2 text-sm">
                    <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <span className="text-muted-foreground line-through truncate">
                      {a.userChoicePhrase}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-sm font-semibold text-primary italic">
                        &ldquo;{a.correctIdiomPhrase}&rdquo;
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {a.correctIdiomExplanation}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => router.push('/idioms/quiz')}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button
            className="bg-primary hover:bg-primary/90 text-white"
            onClick={() => router.push('/idioms')}
          >
            <Lightbulb className="mr-2 h-4 w-4" />
            Idioms reference
          </Button>
        </div>
      </div>
    );
  }

  // ── Question screen ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            {index + 1} / {questions.length}
          </span>
          <span>Idiom Quiz</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Sentence card */}
      <div className="bg-card border border-border rounded-xl px-6 py-8 min-h-32 flex items-center justify-center">
        <p className="text-lg leading-relaxed text-center italic">
          &ldquo;{currentQ.sentence}&rdquo;
        </p>
      </div>

      {/* Question prompt */}
      <p className="text-sm font-medium text-muted-foreground text-center">
        Which idiom or phrase does this sentence use?
      </p>

      {/* Choice grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {currentQ.choices.map((choice, i) => {
          const isCorrect = choice.id === currentQ.correctIdiomId;
          const isSelected = choice.id === selectedChoiceId;

          let stateClasses = '';
          if (!isFeedback) {
            stateClasses =
              'border-border bg-card hover:border-primary/50 hover:bg-primary/5 cursor-pointer';
          } else if (isCorrect) {
            stateClasses =
              'border-green-500 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 cursor-default';
          } else if (isSelected) {
            stateClasses =
              'border-destructive bg-destructive/5 text-destructive cursor-default';
          } else {
            stateClasses = 'border-border bg-card opacity-40 cursor-default';
          }

          return (
            <button
              key={choice.id}
              type="button"
              disabled={isFeedback}
              onClick={() => handleChoice(choice.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium text-left transition-all',
                stateClasses
              )}
            >
              <span className="shrink-0 text-xs font-mono text-muted-foreground w-4">
                {i + 1}
              </span>
              {isFeedback && isCorrect && (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
              )}
              {isFeedback && isSelected && !isCorrect && (
                <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
              )}
              <span className="italic">&ldquo;{choice.phrase}&rdquo;</span>
            </button>
          );
        })}
      </div>

      {/* Countdown bar */}
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-1000 ease-linear',
            isFeedback ? 'bg-primary' : 'bg-muted-foreground/40'
          )}
          style={{
            width: `${(countdown / (isFeedback ? REVIEW_SECS : ANSWER_SECS)) * 100}%`,
          }}
        />
      </div>

      {/* Bottom row */}
      {isFeedback ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>
              Next in{' '}
              <span className="font-mono font-semibold text-primary">
                {countdown}s
              </span>
            </span>
          </div>
          <Button
            size="sm"
            onClick={handleNext}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Press 1–{currentQ.choices.length} to select</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span className="font-mono">{countdown}s</span>
          </span>
        </div>
      )}
    </div>
  );
}
