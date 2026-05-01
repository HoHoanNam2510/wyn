import { fetchAdminWords } from '@/lib/admin/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WordsClient } from './words-client';

export default async function AdminWordsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const q = params.q ?? '';
  const pageSize = 30;

  const { words, total } = await fetchAdminWords(page, q, pageSize).catch(
    () => ({ words: [], total: 0 })
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Words</h1>

      <form method="GET" className="flex gap-2 max-w-sm">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search by term..."
          className="flex-1"
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
        {q && (
          <a href="/admin/words">
            <Button type="button" variant="ghost">
              Clear
            </Button>
          </a>
        )}
      </form>

      <p className="text-sm text-muted-foreground">
        {total.toLocaleString()} word{total !== 1 ? 's' : ''} found
        {q && ` for "${q}"`}
      </p>

      <WordsClient
        words={words}
        total={total}
        page={page}
        pageSize={pageSize}
        q={q}
      />
    </div>
  );
}
