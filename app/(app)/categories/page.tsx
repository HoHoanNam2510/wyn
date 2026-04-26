import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { CategoryManager } from './category-manager';

export default async function CategoriesPage() {
  const session = await auth();
  const userId = session!.user.id;

  const categories = await db.category.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
    include: { _count: { select: { words: true } } },
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground mt-1">
            Organise your words into groups.
          </p>
        </div>
      </div>
      <CategoryManager initialCategories={categories} />
    </div>
  );
}
