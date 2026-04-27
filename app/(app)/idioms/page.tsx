import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Lightbulb, ChevronRight, Zap } from 'lucide-react';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default async function IdiomsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');

  const categories = await db.idiomCategory.findMany({
    orderBy: { order: 'asc' },
    include: {
      idioms: {
        orderBy: { order: 'asc' },
      },
    },
  });

  const totalIdioms = categories.reduce((acc, c) => acc + c.idioms.length, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
            <Lightbulb className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Idioms & Phrases</h1>
            <p className="text-sm text-muted-foreground">
              {totalIdioms} idioms across {categories.length} categories
            </p>
          </div>
        </div>
        <Button
          asChild
          className="shrink-0 bg-primary hover:bg-primary/90 text-white"
        >
          <Link href="/idioms/quiz">
            <Zap className="mr-2 h-4 w-4" />
            Take Quiz
          </Link>
        </Button>
      </div>

      <Accordion type="multiple" className="space-y-2">
        {categories.map((category) => (
          <AccordionItem
            key={category.id}
            value={category.id}
            className="border border-border rounded-xl bg-card px-4 overflow-hidden"
          >
            <AccordionTrigger className="py-4 hover:no-underline">
              <div className="flex items-center gap-3 text-left">
                <span className="h-6 w-6 rounded-full bg-secondary/10 text-secondary text-xs font-bold flex items-center justify-center shrink-0">
                  {category.order}
                </span>
                <span className="font-semibold">{category.title}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {category.idioms.length} idioms
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="grid gap-2">
                {category.idioms.map((idiom) => (
                  <Link
                    key={idiom.id}
                    href={`/idioms/${idiom.id}`}
                    className="group flex items-start justify-between gap-3 rounded-lg border border-border bg-background hover:border-secondary/40 hover:bg-secondary/5 p-3 transition-colors"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-medium group-hover:text-secondary transition-colors">
                        {idiom.phrase}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {idiom.explanation}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {idiom.register && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {idiom.register}
                        </Badge>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-secondary transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
