'use server';

import { groq } from '@/lib/groq';

export type WritingCheckResult = {
  correct: boolean;
  feedback: string;
};

export async function checkWritingSentence({
  term,
  partOfSpeech,
  meaning,
  sentence,
}: {
  term: string;
  partOfSpeech: string;
  meaning: string;
  sentence: string;
}): Promise<WritingCheckResult> {
  const prompt = `You are an English writing coach. A learner wrote a sentence to practice the word "${term}" (${partOfSpeech}: ${meaning}).

Their sentence: "${sentence}"

Evaluate in 1-2 short sentences:
1. Is the word used correctly in terms of meaning and grammar?
2. If there's an issue, briefly explain what's wrong and how to fix it.

Respond in JSON only, no markdown:
{"correct": true/false, "feedback": "..."}

Be encouraging but honest. "correct" should be true only if both meaning and grammar are acceptable.`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 150,
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error(`No JSON in response: ${text}`);
    const parsed = JSON.parse(jsonMatch[0]) as WritingCheckResult;
    return {
      correct: Boolean(parsed.correct),
      feedback: String(parsed.feedback ?? ''),
    };
  } catch (err) {
    console.error('[AI check] Groq error:', err);
    return {
      correct: false,
      feedback: 'Could not evaluate your sentence. Please check it yourself.',
    };
  }
}
