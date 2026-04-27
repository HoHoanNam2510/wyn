type FormulaChunkType =
  | 'subject'
  | 'auxiliary'
  | 'verb'
  | 'object'
  | 'connector'
  | 'note';
export type FormulaChunk = { text: string; type: FormulaChunkType };

const badgeClasses: Record<string, string> = {
  subject:
    'bg-tertiary/10 text-tertiary border border-tertiary/30 rounded-md px-2 py-0.5 text-sm font-medium',
  auxiliary:
    'bg-primary/10 text-primary border border-primary/30 rounded-md px-2 py-0.5 text-sm font-medium',
  verb: 'bg-secondary/10 text-secondary border border-secondary/30 rounded-md px-2 py-0.5 text-sm font-medium',
  object:
    'bg-muted text-foreground border border-border rounded-md px-2 py-0.5 text-sm font-medium',
};

export function FormulaDisplay({ chunks }: { chunks: FormulaChunk[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chunks.map((chunk, i) => {
        if (chunk.type === 'connector') {
          return (
            <span key={i} className="text-muted-foreground text-sm select-none">
              {chunk.text}
            </span>
          );
        }
        if (chunk.type === 'note') {
          return (
            <span key={i} className="text-muted-foreground text-xs italic">
              {chunk.text}
            </span>
          );
        }
        return (
          <span key={i} className={badgeClasses[chunk.type]}>
            {chunk.text}
          </span>
        );
      })}
    </div>
  );
}
