import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AudioButton } from '@/components/ui/audio-button';
import { WordDeleteButton } from './word-delete-button';

type Props = { params: Promise<{ id: string }> };

export default async function WordDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user.id;

  const word = await db.word.findFirst({
    where: { id, userId },
    include: {
      contexts: {
        orderBy: { order: 'asc' },
        include: { examples: true },
      },
      categories: { include: { category: true } },
    },
  });

  if (!word) notFound();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="shrink-0" asChild>
            <Link href="/words">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold truncate">{word.term}</h1>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" asChild>
            <Link href={`/words/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <WordDeleteButton wordId={id} term={word.term} />
        </div>
      </div>

      {/* Image */}
      {word.imageUrl && (
        <div className="relative h-56 w-full rounded-xl overflow-hidden border border-border">
          <Image
            src={word.imageUrl}
            alt={word.term}
            fill
            sizes="(min-width: 768px) 672px, 100vw"
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Categories */}
      {word.categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {word.categories.map(({ category }) => (
            <Badge
              key={category.id}
              variant="outline"
              className="flex items-center gap-1.5"
              style={{ borderColor: category.color, color: category.color }}
            >
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: category.color }}
              />
              {category.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Contexts */}
      <div className="space-y-4">
        {word.contexts.map((ctx) => (
          <div
            key={ctx.id}
            className="border border-border rounded-xl p-5 space-y-3"
          >
            <div className="flex items-center gap-3 flex-wrap">
              <Badge
                variant="outline"
                className="text-primary border-primary/30 text-xs"
              >
                {ctx.partOfSpeech}
              </Badge>
              {ctx.phonetic && (
                <span className="text-sm text-muted-foreground italic">
                  {ctx.phonetic}
                </span>
              )}
              {ctx.audioUrl && (
                <AudioButton
                  url={ctx.audioUrl}
                  label={`Phát âm ${word.term}`}
                />
              )}
            </div>

            <p className="text-base leading-relaxed">{ctx.meaning}</p>

            {ctx.examples.length > 0 && (
              <ul className="space-y-1.5 border-l-2 border-border pl-4">
                {ctx.examples.map((ex, ei) => (
                  <li key={ex.id} className="text-sm text-muted-foreground italic">
                    <span className="font-semibold not-italic text-muted-foreground/50 mr-1.5">
                      {ei + 1}.
                    </span>
                    {ex.text}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
