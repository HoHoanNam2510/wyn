import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { WordListClient } from './word-list-client';

const PAGE_SIZE = 20;

type Props = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    page?: string;
    sort?: string;
  }>;
};

const SORT_MAP = {
  newest: { createdAt: 'desc' as const },
  oldest: { createdAt: 'asc' as const },
  az: { term: 'asc' as const },
  za: { term: 'desc' as const },
};

export default async function WordsPage({ searchParams }: Props) {
  const params = await searchParams;
  const session = await auth();
  const userId = session!.user.id;

  const q = params.q?.trim() ?? '';
  const categoryId = params.category ?? '';
  const page = Math.max(1, Number(params.page ?? 1));
  const sort = (params.sort ?? 'newest') as keyof typeof SORT_MAP;
  const skip = (page - 1) * PAGE_SIZE;

  const where = {
    userId,
    ...(q && { term: { contains: q, mode: 'insensitive' as const } }),
    ...(categoryId && { categories: { some: { categoryId } } }),
  };

  const [words, total, categories] = await Promise.all([
    db.word.findMany({
      where,
      skip,
      take: PAGE_SIZE,
      orderBy: SORT_MAP[sort] ?? SORT_MAP.newest,
      include: {
        contexts: { orderBy: { order: 'asc' }, take: 1 },
        categories: { include: { category: true } },
      },
    }),
    db.word.count({ where }),
    db.category.findMany({ where: { userId }, orderBy: { name: 'asc' } }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Words</h1>
          <p className="text-muted-foreground mt-1">
            {total} word{total !== 1 ? 's' : ''}
          </p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 text-white">
          <Link href="/words/new">
            <Plus className="mr-2 h-4 w-4" />
            Add word
          </Link>
        </Button>
      </div>

      <WordListClient
        words={words as never}
        categories={categories}
        total={total}
        page={page}
        totalPages={totalPages}
        initialQ={q}
        initialCategory={categoryId}
        initialSort={sort}
      />
    </div>
  );
}
