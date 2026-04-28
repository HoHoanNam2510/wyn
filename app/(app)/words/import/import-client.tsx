'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import {
  Upload,
  FileJson,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  SkipForward,
  Info,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { importWordSchema, type ImportWord } from '@/lib/schemas/import';
import { importWords, type ImportResult } from '@/app/actions/import';

type UIState = 'idle' | 'previewing' | 'importing' | 'done';

type ParsedRow =
  | {
      word: ImportWord;
      valid: true;
    }
  | {
      index: number;
      term: string;
      valid: false;
      reason: string;
    };

const EXAMPLE_JSON = `[
  {
    "term": "eloquent",
    "categories": ["Academic"],
    "contexts": [
      {
        "partOfSpeech": "adjective",
        "phonetic": "/ˈel.ə.kwənt/",
        "meaning": "Expressing ideas clearly and effectively",
        "examples": [
          { "text": "She gave an eloquent speech." }
        ]
      }
    ]
  }
]`;

function FormatHint() {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded-lg overflow-hidden text-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 font-medium hover:bg-muted/50 transition-colors"
      >
        <span>JSON format reference</span>
        {open ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
      {open && (
        <div className="border-t px-4 py-3 space-y-3 bg-muted/30">
          <p className="text-muted-foreground">
            Required fields: <code className="text-primary">term</code>,{' '}
            <code className="text-primary">contexts[].partOfSpeech</code>,{' '}
            <code className="text-primary">contexts[].meaning</code>,{' '}
            <code className="text-primary">contexts[].examples[].text</code>
          </p>
          <p className="text-muted-foreground">
            Optional: <code>imageUrl</code>, <code>categories</code> (names),{' '}
            <code>phonetic</code>, <code>audioUrl</code> per context
          </p>
          <p className="text-muted-foreground">
            Valid <code>partOfSpeech</code> values:{' '}
            <code>
              noun · verb · adjective · adverb · preposition · conjunction ·
              pronoun · interjection · phrase · other
            </code>
          </p>
          <pre className="bg-muted rounded p-3 text-xs overflow-x-auto leading-relaxed">
            {EXAMPLE_JSON}
          </pre>
        </div>
      )}
    </div>
  );
}

function DropZone({ onFile }: { onFile: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      alert('Please upload a .json file');
      return;
    }
    onFile(file);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files[0]);
      }}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center gap-3 cursor-pointer transition-colors select-none
        ${dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'}`}
    >
      <FileJson
        className={`h-10 w-10 ${dragging ? 'text-primary' : 'text-muted-foreground'}`}
      />
      <div className="text-center">
        <p className="font-medium">Drop your JSON file here</p>
        <p className="text-sm text-muted-foreground mt-1">
          or{' '}
          <span className="text-primary underline underline-offset-2">
            browse to select
          </span>
        </p>
      </div>
      <p className="text-xs text-muted-foreground">Max 500 words per import</p>
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}

function PreviewTable({ rows }: { rows: ParsedRow[] }) {
  const validRows = rows.filter(
    (r): r is ParsedRow & { valid: true } => r.valid
  );
  const invalidRows = rows.filter(
    (r): r is ParsedRow & { valid: false } => !r.valid
  );

  return (
    <div className="space-y-4">
      {invalidRows.length > 0 && (
        <div className="flex items-start gap-2 text-sm text-destructive border border-destructive/30 bg-destructive/5 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">
              {invalidRows.length} word{invalidRows.length > 1 ? 's' : ''} have
              validation errors and will be skipped:
            </p>
            <ul className="mt-1 list-disc list-inside space-y-0.5 text-destructive/80">
              {invalidRows.map((r, i) => (
                <li key={i}>
                  <span className="font-mono">&quot;{r.term}&quot;</span> —{' '}
                  {r.reason}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">Term</th>
              <th className="text-left px-4 py-2.5 font-medium hidden sm:table-cell">
                Part of speech
              </th>
              <th className="text-left px-4 py-2.5 font-medium">Meaning</th>
              <th className="text-left px-4 py-2.5 font-medium hidden md:table-cell">
                Categories
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {validRows.map((r, i) => {
              const firstCtx = r.word.contexts[0];
              return (
                <tr key={i} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-medium">{r.word.term}</td>
                  <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell capitalize">
                    {firstCtx.partOfSpeech}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground max-w-[200px] truncate">
                    {firstCtx.meaning}
                  </td>
                  <td className="px-4 py-2.5 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(r.word.categories ?? []).map((cat) => (
                        <Badge
                          key={cat}
                          variant="secondary"
                          className="text-xs"
                        >
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResultCard({
  result,
  onReset,
}: {
  result: ImportResult;
  onReset: () => void;
}) {
  return (
    <div className="space-y-4">
      {result.created > 0 && (
        <div className="flex items-start gap-3 border border-green-500/30 bg-green-500/5 rounded-lg p-4">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-green-700 dark:text-green-400">
              {result.created} word{result.created > 1 ? 's' : ''} imported
              successfully
            </p>
          </div>
        </div>
      )}

      {result.skipped.length > 0 && (
        <div className="flex items-start gap-3 border border-amber-500/30 bg-amber-500/5 rounded-lg p-4">
          <SkipForward className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-700 dark:text-amber-400">
              {result.skipped.length} word{result.skipped.length > 1 ? 's' : ''}{' '}
              skipped (already exist)
            </p>
            <p className="text-sm text-amber-600/80 dark:text-amber-400/70 mt-1">
              {result.skipped.join(', ')}
            </p>
          </div>
        </div>
      )}

      {result.errors.length > 0 && (
        <div className="flex items-start gap-3 border border-destructive/30 bg-destructive/5 rounded-lg p-4">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive">
              {result.errors.length} word{result.errors.length > 1 ? 's' : ''}{' '}
              failed
            </p>
            <ul className="mt-1 list-disc list-inside space-y-0.5 text-sm text-destructive/80">
              {result.errors.map((e, i) => (
                <li key={i}>
                  <span className="font-mono">&quot;{e.term}&quot;</span> —{' '}
                  {e.reason}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {result.created === 0 &&
        result.skipped.length === 0 &&
        result.errors.length === 0 && (
          <div className="flex items-center gap-3 border rounded-lg p-4 text-muted-foreground">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>No words were processed.</p>
          </div>
        )}

      <div className="flex gap-3 pt-2">
        <Button asChild className="bg-primary hover:bg-primary/90 text-white">
          <Link href="/words">Back to words</Link>
        </Button>
        <Button variant="outline" onClick={onReset}>
          Import another file
        </Button>
      </div>
    </div>
  );
}

export function ImportClient() {
  const [state, setState] = useState<UIState>('idle');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [pasteText, setPasteText] = useState('');

  function processJsonText(text: string, errorPrefix = 'the file') {
    setParseError(null);

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      setParseError(
        `Invalid JSON — could not parse ${errorPrefix}. Please check the format.`
      );
      return;
    }

    if (!Array.isArray(json)) {
      setParseError(
        'Invalid format — the JSON must be an array of word objects.'
      );
      return;
    }

    const parsed: ParsedRow[] = json.map((item, i) => {
      const result = importWordSchema.safeParse(item);
      if (result.success) {
        return { word: result.data, valid: true };
      }
      const termGuess =
        typeof item === 'object' && item !== null && 'term' in item
          ? String((item as Record<string, unknown>).term)
          : `item[${i}]`;
      return {
        index: i,
        term: termGuess,
        valid: false,
        reason: result.error.issues[0]?.message ?? 'Validation error',
      };
    });

    if (parsed.filter((r) => r.valid).length === 0) {
      setParseError(
        'No valid words found. Please check the format and try again.'
      );
      return;
    }

    setRows(parsed);
    setState('previewing');
  }

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text !== 'string') return;
      processJsonText(text, 'the file');
    };
    reader.readAsText(file);
  }

  function handlePaste() {
    if (!pasteText.trim()) {
      setParseError('Please paste some JSON text first.');
      return;
    }
    processJsonText(pasteText.trim(), 'the pasted text');
  }

  async function handleImport() {
    const validWords = rows
      .filter((r): r is ParsedRow & { valid: true } => r.valid)
      .map((r) => r.word);

    setState('importing');
    try {
      const result = await importWords(validWords);
      setImportResult(result);
      setState('done');
    } catch (err) {
      setParseError(
        err instanceof Error ? err.message : 'Import failed. Please try again.'
      );
      setState('previewing');
    }
  }

  function handleReset() {
    setState('idle');
    setRows([]);
    setParseError(null);
    setImportResult(null);
  }

  const validCount = rows.filter((r) => r.valid).length;

  return (
    <div className="space-y-6">
      {state === 'idle' && (
        <>
          <DropZone onFile={handleFile} />

          <div className="relative flex items-center gap-3">
            <div className="flex-1 border-t" />
            <span className="text-xs text-muted-foreground shrink-0">
              or paste JSON directly
            </span>
            <div className="flex-1 border-t" />
          </div>

          <div className="space-y-2">
            <div className="relative">
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={`[\n  {\n    "term": "eloquent",\n    "contexts": [{ "partOfSpeech": "adjective", "meaning": "...", "examples": [{ "text": "..." }] }]\n  }\n]`}
                rows={6}
                className="w-full rounded-lg border bg-background px-3 py-2 pr-8 text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
              />
              {pasteText && (
                <button
                  type="button"
                  onClick={() => setPasteText('')}
                  className="absolute top-2 right-6 bg-destructive hover:bg-destructive/80 text-white rounded p-0.5 transition-colors"
                  aria-label="Clear"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button
              onClick={handlePaste}
              variant="outline"
              className="w-full"
              disabled={!pasteText.trim()}
            >
              Preview pasted JSON
            </Button>
          </div>

          <div className="flex items-start gap-2.5 text-sm border border-blue-500/30 bg-blue-500/5 rounded-lg p-3 text-blue-700 dark:text-blue-400">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <p>
              <span className="font-medium">
                Phonetic &amp; audio auto-fill:
              </span>{' '}
              if a word is missing either <code>phonetic</code> or{' '}
              <code>audioUrl</code> (or both), the system will fetch them from
              the dictionary to keep both fields consistent. If you provide{' '}
              <em>both</em> fields yourself, your values are kept as-is. If the
              dictionary has no result, your partial data is preserved.
            </p>
          </div>

          {parseError && (
            <div className="flex items-start gap-2 text-sm text-destructive border border-destructive/30 bg-destructive/5 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>{parseError}</p>
            </div>
          )}
          <FormatHint />
        </>
      )}

      {state === 'previewing' && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {validCount} word{validCount !== 1 ? 's' : ''} ready to import
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Review the list below, then click Import to proceed.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Change file
            </Button>
          </div>

          {parseError && (
            <div className="flex items-start gap-2 text-sm text-destructive border border-destructive/30 bg-destructive/5 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>{parseError}</p>
            </div>
          )}

          <PreviewTable rows={rows} />

          <div className="flex gap-3">
            <Button
              onClick={handleImport}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              <Upload className="mr-2 h-4 w-4" />
              Import {validCount} word{validCount !== 1 ? 's' : ''}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/words">Cancel</Link>
            </Button>
          </div>
        </>
      )}

      {state === 'importing' && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm">Importing {validCount} words…</p>
        </div>
      )}

      {state === 'done' && importResult && (
        <ResultCard result={importResult} onReset={handleReset} />
      )}
    </div>
  );
}
