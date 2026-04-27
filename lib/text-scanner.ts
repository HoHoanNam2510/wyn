export type WordEntry = {
  id: string;
  term: string;
  status: 'mastered' | 'learning';
  meaning: string | null;
  partOfSpeech: string | null;
};

export type Token = { display: string; lookup: string };

export function tokenize(text: string): Token[] {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((raw) => ({
      display: raw,
      lookup: raw.replace(/^[^a-zA-Z']+|[^a-zA-Z']+$/g, '').toLowerCase(),
    }));
}
