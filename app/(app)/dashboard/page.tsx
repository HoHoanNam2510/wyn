import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, FolderOpen } from 'lucide-react';

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [wordCount, categoryCount] = await Promise.all([
    db.word.count({ where: { userId } }),
    db.category.count({ where: { userId } }),
  ]);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back
          {session?.user?.name ? `, ${session.user.name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&rsquo;s your vocabulary overview.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{wordCount}</p>
              <p className="text-sm text-muted-foreground">Words</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{categoryCount}</p>
              <p className="text-sm text-muted-foreground">Categories</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button asChild className="bg-primary hover:bg-primary/90 text-white">
          <Link href="/words/new">
            <Plus className="mr-2 h-4 w-4" />
            Add word
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/words">View all words</Link>
        </Button>
      </div>
    </div>
  );
}
