export type DictionaryMeaning = {
  partOfSpeech: string;
  definitions: { definition: string; example?: string }[];
};

export type DictionaryPhonetic = {
  text?: string;
  audio?: string;
};

export type DictionaryResult = {
  word: string;
  phonetics: DictionaryPhonetic[];
  meanings: DictionaryMeaning[];
};

export type ParsedContext = {
  partOfSpeech: string;
  phonetic: string;
  audioUrl: string;
  meaning: string;
  examples: string[];
};

export async function fetchDictionary(
  term: string,
  userId?: string
): Promise<ParsedContext[]> {
  if (userId) {
    const { recordApiUsage } = await import('@/lib/admin/apiUsage');
    void recordApiUsage('dictionary', userId);
  }
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(term)}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return [];

    const data: DictionaryResult[] = await res.json();
    const entry = data[0];
    if (!entry) return [];

    const bestPhonetic =
      entry.phonetics.find((p) => p.text && p.audio) ??
      entry.phonetics.find((p) => p.text) ??
      entry.phonetics[0];

    return entry.meanings.map((meaning) => ({
      partOfSpeech: normalizePos(meaning.partOfSpeech),
      phonetic: bestPhonetic?.text ?? '',
      audioUrl: bestPhonetic?.audio ?? '',
      meaning: meaning.definitions[0]?.definition ?? '',
      examples: meaning.definitions
        .filter((d) => d.example)
        .slice(0, 3)
        .map((d) => d.example!),
    }));
  } catch {
    return [];
  }
}

const POS_MAP: Record<string, string> = {
  noun: 'noun',
  verb: 'verb',
  adjective: 'adjective',
  adverb: 'adverb',
  preposition: 'preposition',
  conjunction: 'conjunction',
  pronoun: 'pronoun',
  interjection: 'interjection',
};

function normalizePos(pos: string): string {
  return POS_MAP[pos.toLowerCase()] ?? 'other';
}
