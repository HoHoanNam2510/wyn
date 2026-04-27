'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  categorySchema,
  type CategoryFormValues,
} from '@/lib/schemas/category';
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/app/actions/categories';

type Category = {
  id: string;
  name: string;
  color: string;
  _count: { words: number };
};

const PRESET_COLORS = [
  '#dc143c',
  '#dd8c12',
  '#2481a8',
  '#16a34a',
  '#9333ea',
  '#0891b2',
  '#ea580c',
  '#db2777',
  '#65a30d',
  '#7c3aed',
  '#0284c7',
  '#d97706',
];

export function CategoryManager({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', color: '#dc143c' },
  });

  function openCreate() {
    setEditing(null);
    form.reset({ name: '', color: '#dc143c' });
    setDialogOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    form.reset({ name: cat.name, color: cat.color });
    setDialogOpen(true);
  }

  function onSubmit(values: CategoryFormValues) {
    startTransition(async () => {
      try {
        if (editing) {
          await updateCategory(editing.id, values);
          setCategories((prev) =>
            prev.map((c) => (c.id === editing.id ? { ...c, ...values } : c))
          );
          toast.success('Category updated');
        } else {
          const res = await createCategory(values);
          setCategories((prev) => [
            ...prev,
            { ...res.category, _count: { words: 0 } },
          ]);
          toast.success('Category created');
        }
        setDialogOpen(false);
      } catch {
        toast.error('Something went wrong');
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteCategory(id);
        setCategories((prev) => prev.filter((c) => c.id !== id));
        toast.success('Category deleted');
      } catch {
        toast.error('Something went wrong');
      }
    });
  }

  return (
    <>
      <div className="flex justify-end">
        <Button
          onClick={openCreate}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          New category
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>No categories yet. Create one to start organising your words.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between px-4 py-3 bg-card border border-border rounded-lg"
            >
              <Link
                href={`/words?category=${cat.id}`}
                className="flex items-center gap-3 flex-1 min-w-0 group"
              >
                <span
                  className="h-4 w-4 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="font-medium group-hover:text-primary transition-colors truncate">
                  {cat.name}
                </span>
                <Badge variant="secondary" className="text-xs shrink-0">
                  {cat._count.words} {cat._count.words === 1 ? 'word' : 'words'}
                </Badge>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </Link>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openEdit(cat)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(cat.id)}
                  disabled={isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit category' : 'New category'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Business English" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {PRESET_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => field.onChange(c)}
                              className="relative h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                              style={{
                                backgroundColor: c,
                                borderColor:
                                  field.value === c ? '#000' : 'transparent',
                              }}
                            >
                              {field.value === c && (
                                <Check className="absolute inset-0 m-auto h-3.5 w-3.5 text-white" />
                              )}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="h-8 w-8 cursor-pointer rounded border border-input"
                          />
                          <Input
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            placeholder="#dc143c"
                            className="h-8 font-mono text-sm"
                          />
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {editing ? 'Save changes' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
