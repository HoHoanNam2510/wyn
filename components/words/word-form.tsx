'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  useForm,
  useFieldArray,
  useWatch,
  Controller,
  type Control,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  wordSchema,
  partOfSpeechValues,
  type WordFormValues,
} from '@/lib/schemas/word';
import { createWord, updateWord } from '@/app/actions/words';
import type { UnsplashPhoto } from '@/lib/unsplash';
import type { ParsedContext } from '@/lib/dictionary';

type Category = { id: string; name: string; color: string };

type Props = {
  categories: Category[];
  defaultValues?: Partial<WordFormValues>;
  wordId?: string;
};

const DEFAULT_CONTEXT = {
  partOfSpeech: 'noun' as const,
  phonetic: '',
  audioUrl: '',
  meaning: '',
  order: 0,
  examples: [{ text: '' }],
};

export function WordForm({ categories, defaultValues, wordId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isFetching, setIsFetching] = useState(false);
  const [unsplashPhotos, setUnsplashPhotos] = useState<UnsplashPhoto[]>([]);
  const [showUnsplash, setShowUnsplash] = useState(false);

  const form = useForm<WordFormValues>({
    resolver: zodResolver(wordSchema),
    defaultValues: (defaultValues ?? {
      term: '',
      imageUrl: '',
      categoryIds: [] as string[],
      contexts: [DEFAULT_CONTEXT],
    }) as WordFormValues,
  });

  const {
    fields: contextFields,
    append: appendContext,
    remove: removeContext,
  } = useFieldArray({ control: form.control, name: 'contexts' });

  async function fetchDictionary() {
    const term = form.getValues('term').trim();
    if (!term) {
      toast.error('Enter a word first');
      return;
    }
    setIsFetching(true);
    try {
      const res = await fetch(
        `/api/dictionary?term=${encodeURIComponent(term)}`
      );
      const data = await res.json();
      if (!data.contexts?.length) {
        toast.info('No dictionary results found');
        return;
      }
      form.setValue(
        'contexts',
        data.contexts.map((ctx: ParsedContext) => ({
          partOfSpeech:
            ctx.partOfSpeech as WordFormValues['contexts'][0]['partOfSpeech'],
          phonetic: ctx.phonetic ?? '',
          audioUrl: ctx.audioUrl ?? '',
          meaning: ctx.meaning ?? '',
          order: 0,
          examples: (ctx.examples?.length ? ctx.examples : ['']).map(
            (t: string) => ({ text: t })
          ),
        }))
      );
      toast.success('Auto-filled from dictionary');
    } catch {
      toast.error('Dictionary fetch failed');
    } finally {
      setIsFetching(false);
    }
  }

  async function fetchUnsplash() {
    const term = form.getValues('term').trim();
    if (!term) {
      toast.error('Enter a word first');
      return;
    }
    setIsFetching(true);
    try {
      const res = await fetch(`/api/unsplash?q=${encodeURIComponent(term)}`);
      const data = await res.json();
      setUnsplashPhotos(data.photos ?? []);
      setShowUnsplash(true);
    } catch {
      toast.error('Image search failed');
    } finally {
      setIsFetching(false);
    }
  }

  function pickImage(url: string) {
    form.setValue('imageUrl', url);
    setShowUnsplash(false);
  }

  function toggleCategory(id: string) {
    const current = form.getValues('categoryIds');
    form.setValue(
      'categoryIds',
      current.includes(id) ? current.filter((c) => c !== id) : [...current, id]
    );
  }

  function onSubmit(values: WordFormValues) {
    startTransition(async () => {
      try {
        if (wordId) {
          await updateWord(wordId, values);
          toast.success('Word updated');
        } else {
          await createWord(values);
          toast.success('Word added');
        }
        router.push('/words');
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Something went wrong'
        );
      }
    });
  }

  const selectedCategories = useWatch({
    control: form.control,
    name: 'categoryIds',
  });
  const imageUrl = useWatch({ control: form.control, name: 'imageUrl' });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 max-w-2xl"
      >
        {/* Term + dictionary fetch */}
        <div className="space-y-3">
          <FormField
            control={form.control}
            name="term"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold">
                  Word / Term
                </FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      placeholder="e.g. eloquent"
                      className="text-lg font-medium"
                      {...field}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={fetchDictionary}
                    disabled={isFetching}
                    className="shrink-0"
                  >
                    {isFetching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Auto-fill'
                    )}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Contexts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Contexts</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendContext({
                  ...DEFAULT_CONTEXT,
                  order: contextFields.length,
                })
              }
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add context
            </Button>
          </div>

          {contextFields.map((ctxField, ci) => (
            <ContextBlock
              key={ctxField.id}
              index={ci}
              control={form.control as Control<WordFormValues>}
              canRemove={contextFields.length > 1}
              onRemove={() => removeContext(ci)}
            />
          ))}
        </div>

        <Separator />

        {/* Image */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Image (optional)</h2>
          <div className="flex gap-2 items-start">
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      placeholder="Image URL or pick from Unsplash below"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="outline"
              onClick={fetchUnsplash}
              disabled={isFetching}
              className="shrink-0"
            >
              <ImageIcon className="mr-1.5 h-4 w-4" />
              Browse
            </Button>
          </div>

          {imageUrl && (
            <div className="relative h-40 w-full rounded-lg overflow-hidden border border-border">
              <Image
                src={imageUrl}
                alt="Word image"
                fill
                sizes="(min-width: 768px) 672px, 100vw"
                className="object-cover"
              />
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute top-2 right-2 h-7 w-7 rounded-full"
                onClick={() => form.setValue('imageUrl', '')}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {showUnsplash && unsplashPhotos.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Click to select</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUnsplash(false)}
                >
                  Close
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {unsplashPhotos.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => pickImage(photo.urls.regular)}
                    className="relative aspect-video rounded-md overflow-hidden border-2 border-transparent hover:border-primary transition-colors"
                  >
                    <Image
                      src={photo.urls.small}
                      alt={photo.alt_description ?? ''}
                      fill
                      sizes="168px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Categories */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Categories</h2>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No categories yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const selected = selectedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                      selected
                        ? 'text-white border-transparent'
                        : 'bg-background text-foreground border-border hover:border-primary/50'
                    }`}
                    style={
                      selected
                        ? { backgroundColor: cat.color, borderColor: cat.color }
                        : {}
                    }
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: selected ? '#fff' : cat.color }}
                    />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <Separator />

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isPending}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {wordId ? 'Save changes' : 'Add word'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}

function ContextBlock({
  index,
  control,
  canRemove,
  onRemove,
}: {
  index: number;
  control: Control<WordFormValues>;
  canRemove: boolean;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(true);
  const {
    fields: exFields,
    append: appendEx,
    remove: removeEx,
  } = useFieldArray({
    control,
    name: `contexts.${index}.examples`,
  });

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 bg-muted/40 cursor-pointer"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-sm font-medium text-muted-foreground">
          Context {index + 1}
        </span>
        <div className="flex items-center gap-1">
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          {open ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </div>

      {open && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Controller
              control={control}
              name={`contexts.${index}.partOfSpeech`}
              render={({ field, fieldState }) => (
                <div className="space-y-1.5">
                  <Label>Part of speech</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {partOfSpeechValues.map((pos) => (
                        <SelectItem key={pos} value={pos}>
                          {pos.charAt(0).toUpperCase() + pos.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error && (
                    <p className="text-xs text-destructive">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />

            <Controller
              control={control}
              name={`contexts.${index}.phonetic`}
              render={({ field }) => (
                <div className="space-y-1.5">
                  <Label>Phonetic</Label>
                  <Input placeholder="e.g. /ˈɛl.ə.kwənt/" {...field} />
                </div>
              )}
            />
          </div>

          <Controller
            control={control}
            name={`contexts.${index}.meaning`}
            render={({ field, fieldState }) => (
              <div className="space-y-1.5">
                <Label>Meaning</Label>
                <Textarea
                  placeholder="Definition of the word in this context…"
                  rows={2}
                  {...field}
                />
                {fieldState.error && (
                  <p className="text-xs text-destructive">
                    {fieldState.error.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Examples */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Examples</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => appendEx({ text: '' })}
              >
                <Plus className="mr-1 h-3 w-3" />
                Add
              </Button>
            </div>
            {exFields.map((exField, ei) => (
              <div key={exField.id} className="flex gap-2">
                <Controller
                  control={control}
                  name={`contexts.${index}.examples.${ei}.text`}
                  render={({ field, fieldState }) => (
                    <div className="flex-1 space-y-1">
                      <Input placeholder={`Example ${ei + 1}…`} {...field} />
                      {fieldState.error && (
                        <p className="text-xs text-destructive">
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />
                {exFields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-muted-foreground"
                    onClick={() => removeEx(ei)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
