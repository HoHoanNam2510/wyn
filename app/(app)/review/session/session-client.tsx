'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { RefObject } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  CheckCircle2,
  XCircle,
  Trophy,
  Clock,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type {
  ReviewQuestion,
  FlashcardQuestion,
  FillBlankQuestion,
} from '@/lib/review/pickQuestions';
import { logReviewEvent } from '@/app/actions/reviews';

type AnswerRecord = {
  wordId: string;
  term: string;
  correct: boolean;
  userAnswer: string;
};

type FeedbackState = {
  correct: boolean;
  correctAnswer: string;
} | null;

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

export function SessionClient({
  questions,
  mode,
}: {
  questions: ReviewQuestion[];
  mode: 'flashcard' | 'fill_blank';
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [isFeedback, setIsFeedback] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [fillInput, setFillInput] = useState('');
  const [done, setDone] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);

  // Timing refs — set in effects, read only in callbacks (never during render)
  const sessionStartRef = useRef<number>(0);
  const questionStartRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentQ = questions[index];
  const isLast = index === questions.length - 1;
  const progress = (index / questions.length) * 100;
  const currentQType = currentQ?.type;

  // Set session start time once on mount
  useEffect(() => {
    sessionStartRef.current = Date.now();
  }, []);

  // Reset question timer each time the question changes
  useEffect(() => {
    questionStartRef.current = Date.now();
  }, [index]);

  // Auto-focus input when a fill_blank question is shown
  useEffect(() => {
    if (!done && currentQType === 'fill_blank') {
      const id = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [index, done, currentQType]);

  // Advance to the next question or show summary.
  // Resets all per-question UI state inline so no effect is needed.
  const advance = useCallback(() => {
    if (isLast) {
      setSessionDuration(Date.now() - sessionStartRef.current);
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setFillInput('');
      setSelectedChoice(null);
      setFeedback(null);
      setIsFeedback(false);
    }
  }, [isLast]);

  const handleAnswer = useCallback(
    ({
      correct,
      correctAnswer,
      userAnswer,
      wordId,
      modeVal,
    }: {
      correct: boolean;
      correctAnswer: string;
      userAnswer: string;
      wordId: string;
      modeVal: 'flashcard' | 'fill_blank';
    }) => {
      const durationMs = Date.now() - questionStartRef.current;
      setIsFeedback(true);
      setFeedback({ correct, correctAnswer });
      setAnswers((prev) => [
        ...prev,
        { wordId, term: correctAnswer, correct, userAnswer },
      ]);
      logReviewEvent({ wordId, mode: modeVal, correct, durationMs }).catch(
        () => {}
      );
      setTimeout(advance, correct ? 1200 : 1800);
    },
    [advance]
  );

  const handleFlashcardChoice = useCallback(
    (choice: string) => {
      if (isFeedback) return;
      const q = currentQ as FlashcardQuestion;
      setSelectedChoice(choice);
      handleAnswer({
        correct: choice === q.correctChoice,
        correctAnswer: q.correctChoice,
        userAnswer: choice,
        wordId: q.wordId,
        modeVal: 'flashcard',
      });
    },
    [isFeedback, currentQ, handleAnswer]
  );

  const handleFillSubmit = useCallback(() => {
    if (isFeedback) return;
    const q = currentQ as FillBlankQuestion;
    const userAnswer = fillInput.trim();
    if (!userAnswer) return;
    const correct = userAnswer.toLowerCase() === q.term.toLowerCase();
    handleAnswer({
      correct,
      correctAnswer: q.term,
      userAnswer,
      wordId: q.wordId,
      modeVal: 'fill_blank',
    });
  }, [isFeedback, currentQ, fillInput, handleAnswer]);

  // Keyboard shortcuts — re-registers whenever handlers change
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const q = currentQ;
      if (!q) return;

      if (q.type === 'flashcard') {
        const num = parseInt(e.key, 10);
        if (
          !isNaN(num) &&
          num >= 1 &&
          num <= (q as FlashcardQuestion).choices.length
        ) {
          handleFlashcardChoice((q as FlashcardQuestion).choices[num - 1]);
        }
      } else if (q.type === 'fill_blank' && e.key === 'Enter') {
        handleFillSubmit();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentQ, handleFlashcardChoice, handleFillSubmit]);

  // ── Summary ──────────────────────────────────────────────────────────────
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
          <h1 className="text-2xl font-bold">Session complete!</h1>
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
            <div className="space-y-2">
              {wrongAnswers.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-lg"
                >
                  <XCircle className="h-4 w-4 text-destructive shrink-0" />
                  <span className="text-sm text-muted-foreground flex-1 truncate">
                    {a.userAnswer}
                  </span>
                  <span className="text-xs text-muted-foreground">→</span>
                  <span className="text-sm font-semibold text-primary">
                    {a.term}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => router.push('/review')}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button
            className="bg-primary hover:bg-primary/90 text-white"
            onClick={() => router.push('/words')}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Browse words
          </Button>
        </div>
      </div>
    );
  }

  // ── Question screen ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            {index + 1} / {questions.length}
          </span>
          <span>{mode === 'flashcard' ? 'Flashcard MC' : 'Fill in Blank'}</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {currentQ.type === 'flashcard' ? (
        <FlashcardView
          question={currentQ as FlashcardQuestion}
          isFeedback={isFeedback}
          selectedChoice={selectedChoice}
          onChoice={handleFlashcardChoice}
        />
      ) : (
        <FillBlankView
          question={currentQ as FillBlankQuestion}
          isFeedback={isFeedback}
          feedback={feedback}
          fillInput={fillInput}
          onInputChange={setFillInput}
          onSubmit={handleFillSubmit}
          inputRef={inputRef as RefObject<HTMLInputElement>}
        />
      )}
    </div>
  );
}

// ── Flashcard sub-component ──────────────────────────────────────────────────

function FlashcardView({
  question,
  isFeedback,
  selectedChoice,
  onChoice,
}: {
  question: FlashcardQuestion;
  isFeedback: boolean;
  selectedChoice: string | null;
  onChoice: (c: string) => void;
}) {
  return (
    <div className="space-y-4">
      {question.imageUrl ? (
        <div className="relative h-48 w-full rounded-xl overflow-hidden border border-border bg-muted">
          <Image src={question.imageUrl} alt="" fill className="object-cover" />
        </div>
      ) : (
        <div className="h-48 rounded-xl border border-border bg-muted flex items-center justify-center">
          <span className="text-7xl font-bold text-muted-foreground/20">
            {question.term[0]?.toUpperCase()}
          </span>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl px-5 py-4">
        <Badge
          variant="outline"
          className="mb-2 text-xs text-primary border-primary/30"
        >
          {question.partOfSpeech}
        </Badge>
        <p className="text-base leading-relaxed">{question.meaning}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {question.choices.map((choice, i) => {
          const isCorrect = choice === question.correctChoice;
          const isSelected = choice === selectedChoice;

          let stateClasses = '';
          if (!isFeedback) {
            stateClasses =
              'border-border bg-card hover:border-primary/50 hover:bg-primary/5 cursor-pointer';
          } else if (isCorrect) {
            stateClasses =
              'border-green-500 bg-green-50 text-green-700 cursor-default';
          } else if (isSelected) {
            stateClasses =
              'border-destructive bg-destructive/5 text-destructive cursor-default';
          } else {
            stateClasses = 'border-border bg-card opacity-40 cursor-default';
          }

          return (
            <button
              key={choice}
              type="button"
              disabled={isFeedback}
              onClick={() => onChoice(choice)}
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
              <span className="truncate">{choice}</span>
            </button>
          );
        })}
      </div>

      {!isFeedback && (
        <p className="text-xs text-center text-muted-foreground">
          Press 1–{question.choices.length} to select
        </p>
      )}
    </div>
  );
}

// ── Fill-in-blank sub-component ──────────────────────────────────────────────

function FillBlankView({
  question,
  isFeedback,
  feedback,
  fillInput,
  onInputChange,
  onSubmit,
  inputRef,
}: {
  question: FillBlankQuestion;
  isFeedback: boolean;
  feedback: FeedbackState;
  fillInput: string;
  onInputChange: (v: string) => void;
  onSubmit: () => void;
  inputRef: RefObject<HTMLInputElement>;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl px-6 py-6 min-h-32 flex items-center">
        <p className="text-lg leading-relaxed">
          {question.sentence.split('_______').map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span className="inline-block min-w-[5rem] border-b-2 border-primary mx-1 align-bottom" />
              )}
            </span>
          ))}
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={fillInput}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Type your answer…"
          disabled={isFeedback}
          className={cn(
            'text-base',
            feedback?.correct && 'border-green-500 bg-green-50',
            feedback &&
              !feedback.correct &&
              'border-destructive bg-destructive/5'
          )}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSubmit();
          }}
        />
        <Button
          onClick={onSubmit}
          disabled={isFeedback || !fillInput.trim()}
          className="shrink-0 bg-primary hover:bg-primary/90 text-white"
        >
          Submit
        </Button>
      </div>

      {feedback && (
        <div
          className={cn(
            'flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium border',
            feedback.correct
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-destructive/5 text-destructive border-destructive/20'
          )}
        >
          {feedback.correct ? (
            <>
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Correct!
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 shrink-0" />
              Correct answer:{' '}
              <strong className="ml-1">{feedback.correctAnswer}</strong>
            </>
          )}
        </div>
      )}

      {!isFeedback && (
        <p className="text-xs text-center text-muted-foreground">
          Press Enter to submit
        </p>
      )}
    </div>
  );
}
