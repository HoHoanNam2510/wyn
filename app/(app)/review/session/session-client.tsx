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
  ChevronRight,
  BookMarked,
  Type,
  Volume2,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type {
  ReviewQuestion,
  FlashcardQuestion,
  FillBlankQuestion,
  SentenceBuildQuestion,
  WritingPracticeQuestion,
} from '@/lib/review/pickQuestions';
import { Textarea } from '@/components/ui/textarea';
import { logReviewEvent } from '@/app/actions/reviews';
import {
  checkWritingSentence,
  type WritingCheckResult,
} from '@/app/actions/writing';
import { AudioButton } from '@/components/ui/audio-button';

const REVIEW_SECS = 15;
const ANSWER_SECS = 30;
const SENTENCE_BUILD_SECS = 45;

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

type LifelineKey = 'definition' | 'phonetic' | 'audio' | 'partial';
type Lifelines = Record<LifelineKey, boolean>;
const LIFELINES_INIT: Lifelines = {
  definition: false,
  phonetic: false,
  audio: false,
  partial: false,
};

function maskWord(word: string): string {
  return word
    .split(' ')
    .map((w) => {
      if (w.length <= 2) return w;
      const chars = [...w];
      const candidates = chars
        .map((_, i) => i)
        .filter(
          (i) => i > 0 && i < chars.length - 1 && /[a-zA-Z]/.test(chars[i])
        );
      const hideCount = Math.min(
        Math.max(1, Math.floor(w.length * 0.45)),
        candidates.length
      );
      const toHide = new Set(
        [...candidates].sort(() => Math.random() - 0.5).slice(0, hideCount)
      );
      return chars.map((c, i) => (toHide.has(i) ? '_' : c)).join('');
    })
    .join(' ');
}

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
  mode: 'flashcard' | 'fill_blank' | 'sentence_build' | 'writing_practice';
}) {
  const answerSecs =
    mode === 'sentence_build' ? SENTENCE_BUILD_SECS : ANSWER_SECS;

  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'answering' | 'reviewing'>('answering');
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [fillInput, setFillInput] = useState('');
  const [sentenceIndices, setSentenceIndices] = useState<number[]>([]);
  const [writingInput, setWritingInput] = useState('');
  const [done, setDone] = useState(false);
  const [lifelinesUsed, setLifelinesUsed] = useState<Lifelines>(LIFELINES_INIT);
  const [activeHints, setActiveHints] = useState<Lifelines>(LIFELINES_INIT);
  const [partialAnswer, setPartialAnswer] = useState<string | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [countdown, setCountdown] = useState(answerSecs);

  const sessionStartRef = useRef<number>(0);
  const questionStartRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const advanceRef = useRef<() => void>(() => {});

  const currentQ = questions[index];
  const isLast = index === questions.length - 1;
  const progress = (index / questions.length) * 100;
  const currentQType = currentQ?.type;
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
      setFillInput('');
      setWritingInput('');
      setSelectedChoice(null);
      setFeedback(null);
      setPhase('answering');
      setCountdown(answerSecs);
      setActiveHints(LIFELINES_INIT);
      setPartialAnswer(null);
      setSentenceIndices([]);
    }
  }, [isLast, answerSecs]);

  const handleUseLifeline = useCallback(
    (key: LifelineKey) => {
      setLifelinesUsed((prev) => ({ ...prev, [key]: true }));
      setActiveHints((prev) => ({ ...prev, [key]: true }));
      if (key === 'partial') {
        setPartialAnswer(maskWord((currentQ as FillBlankQuestion).term));
      }
    },
    [currentQ]
  );

  useEffect(() => {
    advanceRef.current = advance;
  }, [advance]);

  // Per-question: start answering countdown
  useEffect(() => {
    questionStartRef.current = Date.now();
    if (done) return;
    if (mode === 'writing_practice') return;
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
  }, [index, done, mode]);

  // When countdown hits 0 → advance (both phases)
  useEffect(() => {
    if (countdown === 0 && !done) {
      advanceRef.current();
    }
  }, [countdown, done]);

  // Auto-focus input for fill_blank
  useEffect(() => {
    if (!done && currentQType === 'fill_blank' && phase === 'answering') {
      const id = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [index, done, currentQType, phase]);

  const handleNext = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    advance();
  }, [advance]);

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
      modeVal:
        | 'flashcard'
        | 'fill_blank'
        | 'sentence_build'
        | 'writing_practice';
    }) => {
      const durationMs = Date.now() - questionStartRef.current;
      setFeedback({ correct, correctAnswer });
      setPhase('reviewing');
      setAnswers((prev) => [
        ...prev,
        { wordId, term: correctAnswer, correct, userAnswer },
      ]);
      logReviewEvent({ wordId, mode: modeVal, correct, durationMs }).catch(
        () => {}
      );
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
    []
  );

  const handleFlashcardChoice = useCallback(
    (choice: string) => {
      if (phase !== 'answering') return;
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
    [phase, currentQ, handleAnswer]
  );

  const handleFillSubmit = useCallback(() => {
    if (phase !== 'answering') return;
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
  }, [phase, currentQ, fillInput, handleAnswer]);

  const handleTokenToSentence = useCallback(
    (tokenIdx: number) => {
      if (phase !== 'answering') return;
      setSentenceIndices((prev) => [...prev, tokenIdx]);
    },
    [phase]
  );

  const handleTokenToPool = useCallback(
    (sentencePos: number) => {
      if (phase !== 'answering') return;
      setSentenceIndices((prev) => prev.filter((_, i) => i !== sentencePos));
    },
    [phase]
  );

  const handleSentenceBuildSubmit = useCallback(() => {
    if (phase !== 'answering') return;
    const q = currentQ as SentenceBuildQuestion;
    if (sentenceIndices.length === 0) return;
    const userAnswer = sentenceIndices.map((i) => q.tokens[i]).join(' ');
    const correct =
      userAnswer.toLowerCase().trim() === q.answer.toLowerCase().trim();
    handleAnswer({
      correct,
      correctAnswer: q.answer,
      userAnswer,
      wordId: q.wordId,
      modeVal: 'sentence_build',
    });
  }, [phase, currentQ, sentenceIndices, handleAnswer]);

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
      } else if (q.type === 'sentence_build' && e.key === 'Enter') {
        handleSentenceBuildSubmit();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    currentQ,
    handleFlashcardChoice,
    handleFillSubmit,
    handleSentenceBuildSubmit,
  ]);

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
                  <span className="text-sm font-semibold text-primary truncate max-w-[40%]">
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

  const modeLabel =
    mode === 'flashcard'
      ? 'Flashcard MC'
      : mode === 'fill_blank'
        ? 'Fill in Blank'
        : mode === 'writing_practice'
          ? 'Writing Practice'
          : 'Sentence Builder';

  // ── Question screen ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            {index + 1} / {questions.length}
          </span>
          <span>{modeLabel}</span>
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
      ) : currentQ.type === 'fill_blank' ? (
        <FillBlankView
          question={currentQ as FillBlankQuestion}
          isFeedback={isFeedback}
          feedback={feedback}
          fillInput={fillInput}
          onInputChange={setFillInput}
          onSubmit={handleFillSubmit}
          inputRef={inputRef as RefObject<HTMLInputElement>}
          lifelinesUsed={lifelinesUsed}
          activeHints={activeHints}
          partialAnswer={partialAnswer}
          onUseLifeline={handleUseLifeline}
        />
      ) : currentQ.type === 'writing_practice' ? (
        <WritingPracticeView
          key={currentQ.wordId}
          question={currentQ as WritingPracticeQuestion}
          phase={phase}
          writingInput={writingInput}
          onInputChange={setWritingInput}
          onSubmitWriting={() => setPhase('reviewing')}
          onGrade={(correct) => {
            const q = currentQ as WritingPracticeQuestion;
            const durationMs = Date.now() - questionStartRef.current;
            setAnswers((prev) => [
              ...prev,
              {
                wordId: q.wordId,
                term: q.term,
                correct,
                userAnswer: writingInput,
              },
            ]);
            logReviewEvent({
              wordId: q.wordId,
              mode: 'writing_practice',
              correct,
              durationMs,
            }).catch(() => {});
            handleNext();
          }}
        />
      ) : (
        <SentenceBuildView
          question={currentQ as SentenceBuildQuestion}
          isFeedback={isFeedback}
          feedback={feedback}
          sentenceIndices={sentenceIndices}
          onTokenToSentence={handleTokenToSentence}
          onTokenToPool={handleTokenToPool}
          onSubmit={handleSentenceBuildSubmit}
        />
      )}

      {/* Countdown progress bar — hidden for writing_practice */}
      {mode !== 'writing_practice' && (
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-1000 ease-linear',
              isFeedback ? 'bg-primary' : 'bg-muted-foreground/40'
            )}
            style={{
              width: `${(countdown / (isFeedback ? REVIEW_SECS : answerSecs)) * 100}%`,
            }}
          />
        </div>
      )}

      {/* Bottom: keyboard hint + timer / Next button — hidden for writing_practice */}
      {mode !== 'writing_practice' &&
        (isFeedback ? (
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
            <span>
              {currentQ.type === 'flashcard'
                ? `Press 1–${(currentQ as FlashcardQuestion).choices.length} to select`
                : currentQ.type === 'fill_blank'
                  ? 'Press Enter to submit'
                  : 'Click chips to build the sentence'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span className="font-mono">{countdown}s</span>
            </span>
          </div>
        ))}
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
          <Image
            src={question.imageUrl}
            alt=""
            fill
            sizes="(min-width: 640px) 576px, 100vw"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="h-48 rounded-xl border border-border bg-muted flex items-center justify-center">
          <span className="text-7xl font-bold text-muted-foreground/20">
            {question.term[0]?.toUpperCase()}
          </span>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <Badge
            variant="outline"
            className="text-xs text-primary border-primary/30"
          >
            {question.partOfSpeech}
          </Badge>
          {isFeedback && question.audioUrl && (
            <AudioButton
              url={question.audioUrl}
              label={`Phát âm ${question.term}`}
            />
          )}
        </div>
        {isFeedback && question.phonetic && (
          <p className="text-xs text-muted-foreground italic mb-1">
            {question.phonetic}
          </p>
        )}
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
              'border-green-500 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 cursor-default';
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
    </div>
  );
}

const POS_ABBR: Record<string, string> = {
  noun: 'n',
  verb: 'v',
  adjective: 'adj',
  adverb: 'adv',
  preposition: 'prep',
  conjunction: 'conj',
  pronoun: 'pron',
  interjection: 'interj',
  phrase: 'phr',
  other: '?',
};

// ── Fill-in-blank sub-component ──────────────────────────────────────────────

const LIFELINE_CONFIG: {
  key: LifelineKey;
  label: string;
  Icon: React.ElementType;
}[] = [
  { key: 'definition', label: 'Definition', Icon: BookMarked },
  { key: 'phonetic', label: 'Phonetic', Icon: Type },
  { key: 'audio', label: 'Pronunciation', Icon: Volume2 },
  { key: 'partial', label: 'Reveal', Icon: Eye },
];

function FillBlankView({
  question,
  isFeedback,
  feedback,
  fillInput,
  onInputChange,
  onSubmit,
  inputRef,
  lifelinesUsed,
  activeHints,
  partialAnswer,
  onUseLifeline,
}: {
  question: FillBlankQuestion;
  isFeedback: boolean;
  feedback: FeedbackState;
  fillInput: string;
  onInputChange: (v: string) => void;
  onSubmit: () => void;
  inputRef: RefObject<HTMLInputElement>;
  lifelinesUsed: Lifelines;
  activeHints: Lifelines;
  partialAnswer: string | null;
  onUseLifeline: (key: LifelineKey) => void;
}) {
  const posHint = POS_ABBR[question.partOfSpeech] ?? question.partOfSpeech;

  const isUnavailable = (key: LifelineKey) =>
    (key === 'phonetic' && !question.phonetic) ||
    (key === 'audio' && !question.audioUrl);

  const anyHintActive =
    activeHints.definition ||
    activeHints.phonetic ||
    activeHints.audio ||
    activeHints.partial;

  return (
    <div className="space-y-4">
      {/* Sentence */}
      <div className="bg-card border border-border rounded-xl px-6 py-6 min-h-32 flex items-center">
        <p className="text-lg leading-relaxed">
          {question.sentence.split('_______').map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span className="inline-flex items-end gap-0.5 mx-1">
                  <span className="text-xs font-semibold text-primary/70 leading-none mb-0.5">
                    ({posHint})
                  </span>
                  <span className="inline-block min-w-16 border-b-2 border-primary align-bottom" />
                </span>
              )}
            </span>
          ))}
        </p>
      </div>

      {/* Lifeline buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {LIFELINE_CONFIG.map(({ key, label, Icon }) => {
          const used = lifelinesUsed[key];
          const unavailable = isUnavailable(key);
          const disabled = used || unavailable || isFeedback;
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onUseLifeline(key)}
              className={cn(
                'flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-xs font-medium transition-all',
                disabled
                  ? 'opacity-40 cursor-not-allowed border-border bg-muted/30 text-muted-foreground'
                  : 'border-secondary/50 bg-secondary/5 text-secondary hover:bg-secondary/10 cursor-pointer'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
              {used && (
                <span className="text-[10px] leading-none opacity-60">
                  Used
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Hints revealed */}
      {anyHintActive && (
        <div className="space-y-1.5 bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
          <p className="text-[10px] font-semibold text-primary/60 uppercase tracking-wider mb-2">
            Hints
          </p>
          {activeHints.definition && (
            <p className="text-sm text-foreground">
              <span className="font-semibold text-primary">Definition: </span>
              {question.meaning}
            </p>
          )}
          {activeHints.phonetic && question.phonetic && (
            <p className="text-sm text-foreground">
              <span className="font-semibold text-primary">Phonetic: </span>
              <span className="italic">{question.phonetic}</span>
            </p>
          )}
          {activeHints.audio && question.audioUrl && (
            <div className="flex items-center gap-2 text-sm text-foreground">
              <span className="font-semibold text-primary">Pronunciation:</span>
              <AudioButton url={question.audioUrl} label="Play pronunciation" />
            </div>
          )}
          {activeHints.partial && partialAnswer && (
            <p className="text-sm text-foreground">
              <span className="font-semibold text-primary">Letter hint: </span>
              <span className="font-mono tracking-widest">{partialAnswer}</span>
            </p>
          )}
        </div>
      )}

      {/* Input */}
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
    </div>
  );
}

// ── Writing Practice sub-component ──────────────────────────────────────────

function HighlightedFeedback({
  text,
  correct,
}: {
  text: string;
  correct: boolean;
}) {
  // Only match quotes NOT preceded by a letter (avoids one's, don't, 'll, etc.)
  const parts = text.split(/((?<![a-zA-Z])'[^']{2,}'(?![a-zA-Z])|"[^"]{2,}")/g);
  return (
    <p className="leading-relaxed">
      {parts.map((part, i) => {
        const isQuoted =
          (part.startsWith("'") && part.endsWith("'") && part.length > 2) ||
          (part.startsWith('"') && part.endsWith('"') && part.length > 2);
        if (isQuoted) {
          return (
            <mark
              key={i}
              className={cn(
                'font-semibold rounded px-0.5 not-italic text-foreground',
                correct
                  ? 'bg-green-200/70 dark:bg-green-700/40'
                  : 'bg-amber-200/70 dark:bg-amber-700/40'
              )}
            >
              {part}
            </mark>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

function WritingPracticeView({
  question,
  phase,
  writingInput,
  onInputChange,
  onSubmitWriting,
  onGrade,
}: {
  question: WritingPracticeQuestion;
  phase: 'answering' | 'reviewing';
  writingInput: string;
  onInputChange: (v: string) => void;
  onSubmitWriting: () => void;
  onGrade: (correct: boolean) => void;
}) {
  const [aiResult, setAiResult] = useState<WritingCheckResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  async function handleAiCheck() {
    setAiLoading(true);
    setAiResult(null);
    const result = await checkWritingSentence({
      term: question.term,
      partOfSpeech: question.partOfSpeech,
      meaning: question.meaning,
      sentence: writingInput,
    });
    setAiResult(result);
    setAiLoading(false);
  }

  return (
    <div className="space-y-4">
      {/* Word card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {question.imageUrl ? (
          <div className="relative h-40 w-full bg-muted">
            <Image
              src={question.imageUrl}
              alt=""
              fill
              sizes="(min-width: 640px) 576px, 100vw"
              className="object-cover"
            />
          </div>
        ) : null}
        <div className="px-5 py-4 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">
              {question.term}
            </span>
            <Badge
              variant="outline"
              className="text-xs text-primary border-primary/30"
            >
              {question.partOfSpeech}
            </Badge>
            {question.audioUrl && (
              <AudioButton
                url={question.audioUrl}
                label={`Phát âm ${question.term}`}
              />
            )}
          </div>
          {question.phonetic && (
            <p className="text-xs text-muted-foreground italic">
              {question.phonetic}
            </p>
          )}
          <p className="text-sm text-muted-foreground">{question.meaning}</p>
        </div>
      </div>

      {phase === 'answering' ? (
        <>
          <Textarea
            value={writingInput}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Write 1–2 sentences using this word…"
            rows={4}
            className="resize-none text-base"
          />
          <Button
            onClick={onSubmitWriting}
            disabled={!writingInput.trim()}
            className="w-full bg-primary hover:bg-primary/90 text-white"
          >
            Submit Writing
          </Button>
        </>
      ) : (
        <>
          {/* User's writing */}
          <div className="bg-muted/50 border border-border rounded-lg px-4 py-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Your writing
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {writingInput || (
                <span className="italic opacity-50">(empty)</span>
              )}
            </p>
          </div>

          {/* AI feedback */}
          {aiResult ? (
            <div
              className={cn(
                'flex items-start gap-3 px-4 py-3 rounded-lg border text-sm',
                aiResult.correct
                  ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-800 dark:text-green-300'
                  : 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300'
              )}
            >
              {aiResult.correct ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
              )}
              <HighlightedFeedback
                text={aiResult.feedback}
                correct={aiResult.correct}
              />
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAiCheck}
              disabled={aiLoading}
              className="w-full border-tertiary/40 text-tertiary hover:bg-tertiary/5"
            >
              {aiLoading ? (
                <>
                  <span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-tertiary border-t-transparent inline-block" />
                  Checking…
                </>
              ) : (
                <>✦ Check with AI</>
              )}
            </Button>
          )}

          {/* Reference examples */}
          {question.exampleSentences.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Reference examples
              </p>
              {question.exampleSentences.map((sentence, i) => (
                <div
                  key={i}
                  className="border-l-2 border-primary/30 pl-3 py-0.5"
                >
                  <p className="text-sm italic text-muted-foreground">
                    {sentence}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Self-grade buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onGrade(true)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-green-500 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 font-medium text-sm transition-colors hover:bg-green-100 dark:hover:bg-green-950/50"
            >
              <CheckCircle2 className="h-4 w-4" />
              Correct ✓
            </button>
            <button
              type="button"
              onClick={() => onGrade(false)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 font-medium text-sm transition-colors hover:bg-amber-100 dark:hover:bg-amber-950/50"
            >
              <RotateCcw className="h-4 w-4" />
              Needs Practice
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Sentence Builder sub-component ──────────────────────────────────────────

function SentenceBuildView({
  question,
  isFeedback,
  feedback,
  sentenceIndices,
  onTokenToSentence,
  onTokenToPool,
  onSubmit,
}: {
  question: SentenceBuildQuestion;
  isFeedback: boolean;
  feedback: FeedbackState;
  sentenceIndices: number[];
  onTokenToSentence: (tokenIdx: number) => void;
  onTokenToPool: (sentencePos: number) => void;
  onSubmit: () => void;
}) {
  const usedSet = new Set(sentenceIndices);
  const poolItems = question.tokens
    .map((token, idx) => ({ token, idx }))
    .filter(({ idx }) => !usedSet.has(idx));

  const isTargetToken = (token: string) =>
    token.toLowerCase().replace(/[.,!?;:'"()\-]/g, '') ===
    question.term.toLowerCase();

  return (
    <div className="space-y-4">
      {/* Context */}
      <div className="bg-card border border-border rounded-xl px-5 py-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge
            variant="outline"
            className="text-xs text-primary border-primary/30"
          >
            {question.partOfSpeech}
          </Badge>
        </div>
        <p className="text-base leading-relaxed">{question.meaning}</p>
      </div>

      {/* Sentence assembly area */}
      <div
        className={cn(
          'min-h-16 border-2 rounded-xl px-4 py-3 flex flex-wrap gap-2 items-start content-start transition-colors',
          isFeedback
            ? feedback?.correct
              ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
              : 'border-destructive bg-destructive/5'
            : sentenceIndices.length > 0
              ? 'border-primary/40 bg-primary/5'
              : 'border-dashed border-border bg-card'
        )}
      >
        {sentenceIndices.length === 0 && !isFeedback ? (
          <p className="text-sm text-muted-foreground italic self-center">
            Click chips below to build the sentence…
          </p>
        ) : (
          sentenceIndices.map((tokenIdx, pos) => {
            const token = question.tokens[tokenIdx];
            const isTarget = isTargetToken(token);
            return (
              <button
                key={pos}
                type="button"
                disabled={isFeedback}
                onClick={() => onTokenToPool(pos)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
                  isFeedback
                    ? isTarget
                      ? 'bg-primary text-white border-primary cursor-default'
                      : 'bg-muted text-foreground border-border cursor-default'
                    : isTarget
                      ? 'bg-primary text-white border-primary hover:bg-primary/90 cursor-pointer'
                      : 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 cursor-pointer'
                )}
              >
                {token}
              </button>
            );
          })
        )}
      </div>

      {/* Feedback banner */}
      {isFeedback && (
        <div
          className={cn(
            'flex items-start gap-2 px-4 py-3 rounded-lg text-sm font-medium border',
            feedback?.correct
              ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800'
              : 'bg-destructive/5 text-destructive border-destructive/20'
          )}
        >
          {feedback?.correct ? (
            <>
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Correct!</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium">Correct sentence: </span>
                <span className="font-normal">{question.answer}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Chip pool */}
      {!isFeedback && (
        <div className="flex flex-wrap gap-2 min-h-10">
          {poolItems.map(({ token, idx }) => {
            const isTarget = isTargetToken(token);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onTokenToSentence(idx)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all cursor-pointer',
                  isTarget
                    ? 'bg-primary text-white border-primary hover:bg-primary/90'
                    : 'bg-card border-border hover:border-primary/50 hover:bg-primary/5'
                )}
              >
                {token}
              </button>
            );
          })}
          {poolItems.length === 0 && (
            <p className="text-xs text-muted-foreground italic self-center">
              All chips placed — press Enter or click Check Answer
            </p>
          )}
        </div>
      )}

      {/* Submit */}
      {!isFeedback && (
        <Button
          onClick={onSubmit}
          disabled={sentenceIndices.length === 0}
          className="w-full bg-primary hover:bg-primary/90 text-white"
        >
          Check Answer
        </Button>
      )}
    </div>
  );
}
