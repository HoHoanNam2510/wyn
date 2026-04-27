import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BookMarked, ChevronRight, Zap } from 'lucide-react';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  FormulaDisplay,
  type FormulaChunk,
} from '@/components/grammar/formula-display';
import { Button } from '@/components/ui/button';

export default async function GrammarPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');

  const sections = await db.grammarSection.findMany({
    orderBy: { order: 'asc' },
    include: {
      patterns: {
        orderBy: { order: 'asc' },
      },
    },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <BookMarked className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Grammar Reference</h1>
            <p className="text-sm text-muted-foreground">
              {sections.reduce((acc, s) => acc + s.patterns.length, 0)} patterns
              across {sections.length} sections
            </p>
          </div>
        </div>
        <Button
          asChild
          className="shrink-0 bg-primary hover:bg-primary/90 text-white"
        >
          <Link href="/grammar/quiz">
            <Zap className="mr-2 h-4 w-4" />
            Take Quiz
          </Link>
        </Button>
      </div>

      <Accordion type="multiple" className="space-y-2">
        {sections.map((section) => (
          <AccordionItem
            key={section.id}
            value={section.id}
            className="border border-border rounded-xl bg-card px-4 overflow-hidden"
          >
            <AccordionTrigger className="py-4 hover:no-underline">
              <div className="flex items-center gap-3 text-left">
                <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                  {section.order}
                </span>
                <span className="font-semibold">{section.title}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {section.patterns.length} patterns
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="grid gap-2">
                {section.patterns.map((pattern) => {
                  const chunks = pattern.formula as FormulaChunk[];
                  const preview = chunks.slice(0, 6);
                  return (
                    <Link
                      key={pattern.id}
                      href={`/grammar/${pattern.id}`}
                      className="group flex items-start justify-between gap-3 rounded-lg border border-border bg-background hover:border-primary/40 hover:bg-primary/5 p-3 transition-colors"
                    >
                      <div className="min-w-0 space-y-1.5">
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">
                          {pattern.title}
                        </p>
                        <FormulaDisplay chunks={preview} />
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                    </Link>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
