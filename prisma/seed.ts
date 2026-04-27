import 'dotenv/config';
import { PrismaClient } from '../app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

type FormulaChunkType =
  | 'subject'
  | 'auxiliary'
  | 'verb'
  | 'object'
  | 'connector'
  | 'note';
type FormulaChunk = { text: string; type: FormulaChunkType };

type PatternInput = {
  title: string;
  formula: FormulaChunk[];
  notes?: string;
  order: number;
  examples: string[];
};

type SectionInput = {
  title: string;
  order: number;
  patterns: PatternInput[];
};

const s = (text: string): FormulaChunk => ({ text, type: 'subject' });
const a = (text: string): FormulaChunk => ({ text, type: 'auxiliary' });
const v = (text: string): FormulaChunk => ({ text, type: 'verb' });
const o = (text: string): FormulaChunk => ({ text, type: 'object' });
const c = (text: string): FormulaChunk => ({ text, type: 'connector' });
const n = (text: string): FormulaChunk => ({ text, type: 'note' });

const sections: SectionInput[] = [
  {
    title: 'Present Tenses',
    order: 1,
    patterns: [
      {
        title: 'Present Simple — Affirmative',
        formula: [
          s('Subject'),
          c('+'),
          v('V(s/es)'),
          c('+'),
          o('Object'),
          n('(adverb of frequency)'),
        ],
        notes:
          'Use for habits, general truths, routines, and permanent situations.',
        order: 1,
        examples: [
          'She reads books every evening.',
          'The sun rises in the east.',
          'He plays football on weekends.',
        ],
      },
      {
        title: 'Present Continuous — Affirmative',
        formula: [
          s('Subject'),
          c('+'),
          a('am/is/are'),
          c('+'),
          v('V-ing'),
          c('+'),
          o('Object'),
        ],
        notes:
          'Use for actions happening right now or temporary situations in progress.',
        order: 2,
        examples: [
          'She is reading a book right now.',
          'They are working on a new project this week.',
          'I am learning English.',
        ],
      },
      {
        title: 'Present Perfect — Affirmative',
        formula: [
          s('Subject'),
          c('+'),
          a('have/has'),
          c('+'),
          v('Past Participle'),
          c('+'),
          o('Object'),
        ],
        notes:
          'Use for past actions with present relevance, or life experiences up to now.',
        order: 3,
        examples: [
          'She has read that book twice.',
          'They have finished the project.',
          'I have never visited Paris.',
        ],
      },
      {
        title: 'Present Perfect Continuous',
        formula: [
          s('Subject'),
          c('+'),
          a('have/has'),
          c('+'),
          a('been'),
          c('+'),
          v('V-ing'),
        ],
        notes:
          'Use for ongoing actions that started in the past and continue up to now, often with for or since.',
        order: 4,
        examples: [
          'She has been reading for two hours.',
          'They have been working on this project all week.',
          'I have been learning English for three years.',
        ],
      },
    ],
  },
  {
    title: 'Past Tenses',
    order: 2,
    patterns: [
      {
        title: 'Past Simple — Affirmative',
        formula: [s('Subject'), c('+'), v('V2'), c('+'), o('Object')],
        notes: 'Use for completed actions at a specific time in the past.',
        order: 1,
        examples: [
          'She read the book yesterday.',
          'They finished the project last week.',
          'I visited Paris in 2020.',
        ],
      },
      {
        title: 'Past Continuous — Affirmative',
        formula: [
          s('Subject'),
          c('+'),
          a('was/were'),
          c('+'),
          v('V-ing'),
          c('+'),
          o('Object'),
        ],
        notes:
          'Use for ongoing actions in the past, often interrupted by a sudden event.',
        order: 2,
        examples: [
          'She was reading when I called.',
          'They were working all evening.',
          'I was studying when the lights went out.',
        ],
      },
      {
        title: 'Past Perfect — Affirmative',
        formula: [
          s('Subject'),
          c('+'),
          a('had'),
          c('+'),
          v('Past Participle'),
          c('+'),
          o('Object'),
        ],
        notes:
          'Use for actions completed before another past event (the earlier of two past actions).',
        order: 3,
        examples: [
          'She had read the book before the exam.',
          'They had already left when we arrived.',
          'I had eaten before she cooked dinner.',
        ],
      },
      {
        title: 'Past Perfect Continuous',
        formula: [
          s('Subject'),
          c('+'),
          a('had'),
          c('+'),
          a('been'),
          c('+'),
          v('V-ing'),
        ],
        notes:
          'Use for ongoing actions that were in progress before another past event.',
        order: 4,
        examples: [
          'She had been reading for two hours when he called.',
          'They had been working all day before the power went out.',
          'I had been waiting for an hour before the bus arrived.',
        ],
      },
    ],
  },
  {
    title: 'Future Forms',
    order: 3,
    patterns: [
      {
        title: 'Future Simple — Will',
        formula: [
          s('Subject'),
          c('+'),
          a('will'),
          c('+'),
          v('V'),
          c('+'),
          o('Object'),
        ],
        notes:
          'Use for predictions, spontaneous decisions, promises, and offers.',
        order: 1,
        examples: [
          'She will finish the report tomorrow.',
          'I will help you with that.',
          'They will probably be late.',
        ],
      },
      {
        title: 'Be Going To — Intention / Evidence',
        formula: [
          s('Subject'),
          c('+'),
          a('am/is/are'),
          c('+'),
          a('going to'),
          c('+'),
          v('V'),
          c('+'),
          o('Object'),
        ],
        notes:
          'Use for planned intentions or predictions based on current evidence.',
        order: 2,
        examples: [
          'She is going to read all night to prepare for the exam.',
          'Look at those clouds — it is going to rain.',
          'They are going to launch a new product next month.',
        ],
      },
      {
        title: 'Future Continuous',
        formula: [
          s('Subject'),
          c('+'),
          a('will'),
          c('+'),
          a('be'),
          c('+'),
          v('V-ing'),
        ],
        notes: 'Use for ongoing actions at a specific point in the future.',
        order: 3,
        examples: [
          'She will be studying at midnight.',
          'They will be travelling next week.',
          'I will be working when you arrive.',
        ],
      },
      {
        title: 'Future Perfect',
        formula: [
          s('Subject'),
          c('+'),
          a('will'),
          c('+'),
          a('have'),
          c('+'),
          v('Past Participle'),
          c('+'),
          o('Object'),
        ],
        notes:
          'Use for actions that will be completed before a specific future time.',
        order: 4,
        examples: [
          'She will have read the book by Friday.',
          'They will have finished the project by next month.',
          'I will have lived here for ten years next spring.',
        ],
      },
      {
        title: 'Present Continuous for Future',
        formula: [
          s('Subject'),
          c('+'),
          a('am/is/are'),
          c('+'),
          v('V-ing'),
          n('(future time)'),
        ],
        notes:
          'Use for definite personal arrangements already made for the near future.',
        order: 5,
        examples: [
          'She is meeting her boss tomorrow morning.',
          'They are flying to London next week.',
          'I am seeing the doctor on Friday.',
        ],
      },
    ],
  },
  {
    title: 'Conditional Sentences',
    order: 4,
    patterns: [
      {
        title: 'Type 0 — Zero Conditional',
        formula: [
          a('If'),
          c('+'),
          s('Subject'),
          c('+'),
          v('V (present)'),
          c(','),
          s('Subject'),
          c('+'),
          v('V (present)'),
        ],
        notes:
          'Use for universal truths and scientific facts. The result always follows the condition.',
        order: 1,
        examples: [
          'If you heat water to 100°C, it boils.',
          'If it rains, the streets get wet.',
          'If plants do not get sunlight, they die.',
        ],
      },
      {
        title: 'Type 1 — First Conditional',
        formula: [
          a('If'),
          c('+'),
          s('Subject'),
          c('+'),
          v('V (present)'),
          c(','),
          s('Subject'),
          c('+'),
          a('will'),
          c('+'),
          v('V'),
        ],
        notes:
          'Use for real and likely future situations — the condition is possible.',
        order: 2,
        examples: [
          'If she studies hard, she will pass the exam.',
          'If it rains tomorrow, we will stay home.',
          'If you call me, I will answer immediately.',
        ],
      },
      {
        title: 'Type 2 — Second Conditional',
        formula: [
          a('If'),
          c('+'),
          s('Subject'),
          c('+'),
          v('V2 (past)'),
          c(','),
          s('Subject'),
          c('+'),
          a('would'),
          c('+'),
          v('V'),
        ],
        notes:
          'Use for hypothetical present or future situations that are unlikely or imaginary.',
        order: 3,
        examples: [
          'If she studied harder, she would pass.',
          'If I won the lottery, I would travel the world.',
          'If he knew the answer, he would tell us.',
        ],
      },
      {
        title: 'Type 3 — Third Conditional',
        formula: [
          a('If'),
          c('+'),
          s('Subject'),
          c('+'),
          a('had'),
          c('+'),
          v('Past Participle'),
          c(','),
          s('Subject'),
          c('+'),
          a('would have'),
          c('+'),
          v('Past Participle'),
        ],
        notes:
          'Use for hypothetical past situations — things that did not happen.',
        order: 4,
        examples: [
          'If she had studied, she would have passed.',
          'If it had rained, we would have stayed home.',
          'If I had known, I would have helped you.',
        ],
      },
      {
        title: 'Mixed Conditional',
        formula: [
          a('If'),
          c('+'),
          s('Subject'),
          c('+'),
          a('had'),
          c('+'),
          v('Past Participle'),
          c(','),
          s('Subject'),
          c('+'),
          a('would'),
          c('+'),
          v('V now'),
        ],
        notes: 'Use when a past condition has a present consequence.',
        order: 5,
        examples: [
          'If she had studied medicine, she would be a doctor now.',
          'If I had taken that job, I would live in Paris.',
          'If he had saved more money, he would not be broke now.',
        ],
      },
    ],
  },
  {
    title: 'Passive Voice',
    order: 5,
    patterns: [
      {
        title: 'Present Simple Passive',
        formula: [
          s('Subject'),
          c('+'),
          a('am/is/are'),
          c('+'),
          v('Past Participle'),
          n('(by Agent)'),
        ],
        notes: 'Use when the action is more important than who performs it.',
        order: 1,
        examples: [
          'English is spoken in many countries.',
          'The books are written by experts.',
          'The office is cleaned every morning.',
        ],
      },
      {
        title: 'Past Simple Passive',
        formula: [
          s('Subject'),
          c('+'),
          a('was/were'),
          c('+'),
          v('Past Participle'),
          n('(by Agent)'),
        ],
        notes: 'Use for passive voice describing completed past actions.',
        order: 2,
        examples: [
          'The book was written by Hemingway.',
          'The windows were cleaned yesterday.',
          'The report was submitted last week.',
        ],
      },
      {
        title: 'Present Perfect Passive',
        formula: [
          s('Subject'),
          c('+'),
          a('have/has been'),
          c('+'),
          v('Past Participle'),
          n('(by Agent)'),
        ],
        notes: 'Use for passive actions with present relevance.',
        order: 3,
        examples: [
          'The project has been completed.',
          'Three new employees have been hired this month.',
          'The contract has been signed by both parties.',
        ],
      },
      {
        title: 'Future Simple Passive',
        formula: [
          s('Subject'),
          c('+'),
          a('will be'),
          c('+'),
          v('Past Participle'),
          n('(by Agent)'),
        ],
        notes: 'Use for future passive actions.',
        order: 4,
        examples: [
          'The book will be published next month.',
          'The windows will be cleaned tomorrow.',
          'The report will be reviewed by the manager.',
        ],
      },
      {
        title: 'Modal Passive',
        formula: [
          s('Subject'),
          c('+'),
          a('modal'),
          c('+'),
          a('be'),
          c('+'),
          v('Past Participle'),
        ],
        notes: 'Use with modal verbs: can, must, should, may, might, could.',
        order: 5,
        examples: [
          'The report must be submitted by Friday.',
          'This form should be filled out carefully.',
          'The package might be delivered tomorrow.',
        ],
      },
    ],
  },
  {
    title: 'Modal Verbs',
    order: 6,
    patterns: [
      {
        title: 'Can / Could — Ability',
        formula: [
          s('Subject'),
          c('+'),
          a('can/could'),
          c('+'),
          v('V'),
          c('+'),
          o('Object'),
        ],
        notes: 'Can = present ability; Could = past ability or polite request.',
        order: 1,
        examples: [
          'She can speak three languages.',
          'He could run very fast when he was young.',
          'Could you help me, please?',
        ],
      },
      {
        title: 'May / Might — Possibility',
        formula: [
          s('Subject'),
          c('+'),
          a('may/might'),
          c('+'),
          v('V'),
          c('+'),
          o('Object'),
        ],
        notes:
          'May = stronger possibility (~50%); Might = weaker possibility or less certainty.',
        order: 2,
        examples: [
          'It may rain later this afternoon.',
          'She might be at home — I am not sure.',
          'They may arrive early if traffic is light.',
        ],
      },
      {
        title: 'Must / Have To — Obligation',
        formula: [
          s('Subject'),
          c('+'),
          a('must/have to'),
          c('+'),
          v('V'),
          c('+'),
          o('Object'),
        ],
        notes:
          'Must = internal obligation or strong conviction; Have to = external rule or obligation.',
        order: 3,
        examples: [
          'You must submit the application by Friday.',
          'She has to wear a uniform at work.',
          'I must call him — it is urgent.',
        ],
      },
      {
        title: 'Should / Ought To — Advice',
        formula: [
          s('Subject'),
          c('+'),
          a('should/ought to'),
          c('+'),
          v('V'),
          c('+'),
          o('Object'),
        ],
        notes:
          'Use to give advice, make recommendations, or express expectation.',
        order: 4,
        examples: [
          'You should see a doctor about that cough.',
          'She ought to apologize for what she said.',
          'They should arrive by noon if they leave now.',
        ],
      },
      {
        title: 'Will / Would — Prediction / Request',
        formula: [
          s('Subject'),
          c('+'),
          a('will/would'),
          c('+'),
          v('V'),
          c('+'),
          o('Object'),
        ],
        notes:
          'Will = future prediction or instant offer; Would = polite request or hypothetical.',
        order: 5,
        examples: [
          'She will be here soon.',
          'Would you like some coffee?',
          'I would rather stay home tonight.',
        ],
      },
      {
        title: 'Shall — Offers / Suggestions',
        formula: [
          a('Shall'),
          c('+'),
          s('I/We'),
          c('+'),
          v('V'),
          c('+'),
          o('Object'),
          c('?'),
        ],
        notes:
          'Use with I or We only, for offers, suggestions, or requesting instructions.',
        order: 6,
        examples: [
          'Shall I open the window for you?',
          'Shall we go to the cinema tonight?',
          'Shall I make some tea?',
        ],
      },
      {
        title: 'Need To — Necessity',
        formula: [
          s('Subject'),
          c('+'),
          a('need to'),
          c('+'),
          v('V'),
          c('+'),
          o('Object'),
        ],
        notes:
          'Expresses necessity — similar to have to but more personal or subjective.',
        order: 7,
        examples: [
          'I need to finish this report before lunch.',
          'She needs to call her mother tonight.',
          'They need to study more if they want to pass.',
        ],
      },
      {
        title: 'Used To — Past Habit / State',
        formula: [
          s('Subject'),
          c('+'),
          a('used to'),
          c('+'),
          v('V'),
          c('+'),
          o('Object'),
        ],
        notes: 'Use for past habits or states that no longer exist.',
        order: 8,
        examples: [
          'She used to live in Paris before moving to London.',
          'I used to play tennis every weekend.',
          'He used to smoke, but he quit five years ago.',
        ],
      },
    ],
  },
  {
    title: 'Reported Speech',
    order: 7,
    patterns: [
      {
        title: 'Reported Statements',
        formula: [
          s('Subject'),
          c('+'),
          v('said'),
          n('(that)'),
          c('+'),
          s('Subject'),
          c('+'),
          v('V (backshifted)'),
        ],
        notes:
          'Tense shifts back: present → past, past → past perfect, will → would. Time expressions also shift.',
        order: 1,
        examples: [
          '"I am tired." → She said she was tired.',
          '"I finished the work." → He said he had finished the work.',
          '"I will help you." → She said she would help me.',
        ],
      },
      {
        title: 'Reported Yes/No Questions',
        formula: [
          s('Subject'),
          c('+'),
          v('asked'),
          c('+'),
          a('if/whether'),
          c('+'),
          s('Subject'),
          c('+'),
          v('V (backshifted)'),
        ],
        notes:
          'Use if or whether for yes/no questions. Remove the auxiliary; use normal word order.',
        order: 2,
        examples: [
          '"Are you ready?" → He asked if I was ready.',
          '"Did she come?" → He asked whether she had come.',
          '"Will you help?" → She asked if I would help her.',
        ],
      },
      {
        title: 'Reported Wh- Questions',
        formula: [
          s('Subject'),
          c('+'),
          v('asked'),
          c('+'),
          o('Wh-word'),
          c('+'),
          s('Subject'),
          c('+'),
          v('V (backshifted)'),
        ],
        notes:
          'Keep the wh- word; use normal word order (no inversion) inside the reported clause.',
        order: 3,
        examples: [
          '"Where do you live?" → She asked where I lived.',
          '"What did he say?" → I asked what he had said.',
          '"Why are you crying?" → He asked why she was crying.',
        ],
      },
      {
        title: 'Reported Commands',
        formula: [
          s('Subject'),
          c('+'),
          v('told/asked'),
          c('+'),
          o('Object'),
          c('+'),
          a('to/not to'),
          c('+'),
          v('V'),
        ],
        notes:
          'Use told + to + infinitive for commands; asked + to for polite requests; told + not to for negative commands.',
        order: 4,
        examples: [
          '"Close the door." → She told him to close the door.',
          '"Please do not be late." → He asked her not to be late.',
          '"Sit down!" → The teacher told the students to sit down.',
        ],
      },
    ],
  },
  {
    title: 'Comparatives & Superlatives',
    order: 8,
    patterns: [
      {
        title: 'Comparatives',
        formula: [
          s('Subject'),
          c('+'),
          v('V'),
          c('+'),
          v('adj-er / more + adj'),
          c('+'),
          c('than'),
          c('+'),
          o('Object'),
        ],
        notes:
          'Short adjectives (1–2 syllables): add -er. Long adjectives (3+ syllables): use more.',
        order: 1,
        examples: [
          'She is taller than her brother.',
          'This book is more interesting than that one.',
          'Running is faster than walking.',
        ],
      },
      {
        title: 'Superlatives',
        formula: [
          s('Subject'),
          c('+'),
          v('V'),
          c('+'),
          a('the'),
          c('+'),
          v('adj-est / most + adj'),
          c('+'),
          o('Object'),
        ],
        notes:
          'Short adjectives: the + -est. Long adjectives: the most. Use to compare one thing against a group.',
        order: 2,
        examples: [
          'She is the tallest student in the class.',
          'This is the most interesting book I have ever read.',
          'Mount Everest is the highest mountain in the world.',
        ],
      },
      {
        title: 'As...As — Equality',
        formula: [
          s('Subject'),
          c('+'),
          v('V'),
          c('+'),
          a('as'),
          c('+'),
          v('adj'),
          c('+'),
          a('as'),
          c('+'),
          o('Object'),
        ],
        notes:
          'Use to show two things are equal. Use not as...as to show inequality.',
        order: 3,
        examples: [
          'She is as tall as her sister.',
          'This film is not as good as the book.',
          'He runs as fast as a professional athlete.',
        ],
      },
    ],
  },
  {
    title: 'Questions',
    order: 9,
    patterns: [
      {
        title: 'Yes/No Questions',
        formula: [
          a('Do/Did/Aux'),
          c('+'),
          s('Subject'),
          c('+'),
          v('V'),
          c('+'),
          o('Object'),
          c('?'),
        ],
        notes:
          'Use do/does/did (for simple tenses) or the auxiliary verb (for other tenses) before the subject.',
        order: 1,
        examples: [
          'Do you speak English?',
          'Did she finish her homework?',
          'Is he coming to the meeting tomorrow?',
        ],
      },
      {
        title: 'Wh- Questions',
        formula: [
          o('Wh-word'),
          c('+'),
          a('Aux'),
          c('+'),
          s('Subject'),
          c('+'),
          v('V'),
          c('+'),
          o('Object'),
          c('?'),
        ],
        notes:
          'Wh- words: what, where, when, why, who, which, how. The auxiliary comes before the subject.',
        order: 2,
        examples: [
          'Where do you live?',
          'What did she say to you?',
          'Why are you so late today?',
        ],
      },
      {
        title: 'Tag Questions',
        formula: [
          s('Subject'),
          c('+'),
          v('V (positive)'),
          c(','),
          a('aux (neg)'),
          c('+'),
          s('S?'),
          c('/'),
          s('Subject'),
          c('+'),
          v('V (negative)'),
          c(','),
          a('aux (pos)'),
          c('+'),
          s('S?'),
        ],
        notes:
          'Positive statement → negative tag. Negative statement → positive tag.',
        order: 3,
        examples: [
          'She is coming, is not she?',
          'He did not call, did he?',
          'You can swim, can not you?',
        ],
      },
      {
        title: 'Indirect Questions',
        formula: [
          o('I wonder / Could you tell me'),
          c('+'),
          a('if/wh-word'),
          c('+'),
          s('Subject'),
          c('+'),
          v('V'),
        ],
        notes:
          'Use normal word order inside indirect questions — no inversion. Use if/whether for yes/no.',
        order: 4,
        examples: [
          'Could you tell me where the station is?',
          'I wonder if she is coming tonight.',
          'Do you know what time the meeting starts?',
        ],
      },
    ],
  },
  {
    title: 'Gerunds & Infinitives',
    order: 10,
    patterns: [
      {
        title: 'Gerund as Subject or Object',
        formula: [
          v('V-ing'),
          c('+'),
          v('V'),
          n('(as subject)'),
          c('/'),
          s('Subject'),
          c('+'),
          v('V'),
          c('+'),
          v('V-ing'),
          n('(as object)'),
        ],
        notes:
          'Gerund = verb used as noun. Common verbs followed by gerund: enjoy, avoid, suggest, mind, finish, consider.',
        order: 1,
        examples: [
          'Swimming is good exercise.',
          'She enjoys reading novels in her free time.',
          'He avoided talking about the issue.',
        ],
      },
      {
        title: 'Infinitive after Certain Verbs',
        formula: [
          s('Subject'),
          c('+'),
          v('V'),
          c('+'),
          a('to'),
          c('+'),
          v('V (base form)'),
        ],
        notes:
          'Common verbs followed by infinitive: want, hope, decide, plan, need, agree, refuse, promise, manage.',
        order: 2,
        examples: [
          'She wants to learn French this year.',
          'He decided to quit his job last month.',
          'They agreed to help us with the project.',
        ],
      },
      {
        title: 'Gerund vs Infinitive — Meaning Change',
        formula: [
          s('Subject'),
          c('+'),
          v('remember/forget/stop/try'),
          c('+'),
          v('V-ing'),
          c('/'),
          a('to'),
          c('+'),
          v('V'),
        ],
        notes:
          'Some verbs change meaning: gerund = past/general action; infinitive = future/purposeful action.',
        order: 3,
        examples: [
          '"Remember to lock the door." (future task) vs "I remember locking the door." (past memory)',
          '"He stopped smoking." (quit) vs "He stopped to smoke." (paused to do it)',
          '"She tried calling him." (attempted) vs "She tried to call him." (made an effort)',
        ],
      },
    ],
  },
  {
    title: 'Relative Clauses',
    order: 11,
    patterns: [
      {
        title: 'Defining Relative Clause',
        formula: [
          o('Noun'),
          c('+'),
          a('who/which/that'),
          c('+'),
          v('V'),
          c('+'),
          o('[...]'),
        ],
        notes:
          'Identifies which person or thing — no commas. "That" can replace who or which.',
        order: 1,
        examples: [
          'The book that I read last week was excellent.',
          'The woman who called me is my teacher.',
          'The car which broke down has been repaired.',
        ],
      },
      {
        title: 'Non-defining Relative Clause',
        formula: [
          o('Noun'),
          c(','),
          a('who/which'),
          c('+'),
          v('V'),
          c('+'),
          o('[...]'),
          c(','),
        ],
        notes:
          'Adds extra information about a noun — use commas. "That" cannot be used here.',
        order: 2,
        examples: [
          'My brother, who lives in London, is a doctor.',
          'The Eiffel Tower, which was built in 1889, is in Paris.',
          'She passed the exam, which made everyone happy.',
        ],
      },
      {
        title: 'Reduced Relative Clause',
        formula: [
          o('Noun'),
          c('+'),
          v('V-ing / Past Participle'),
          c('+'),
          o('[...]'),
        ],
        notes:
          'Remove who/which and the auxiliary verb. Active clause → V-ing; Passive clause → Past Participle.',
        order: 3,
        examples: [
          'The woman standing by the door is my teacher.',
          'The car parked outside belongs to John.',
          'The report submitted last week contains several errors.',
        ],
      },
    ],
  },
  {
    title: 'Articles',
    order: 12,
    patterns: [
      {
        title: 'Indefinite Article — A / An',
        formula: [a('a / an'), c('+'), o('singular countable noun')],
        notes:
          '"a" before consonant sounds; "an" before vowel sounds. Use for first mention or non-specific nouns.',
        order: 1,
        examples: [
          'She has a dog named Max.',
          'I read an interesting article this morning.',
          'He wants to be an engineer when he grows up.',
        ],
      },
      {
        title: 'Definite Article — The',
        formula: [a('the'), c('+'), o('noun')],
        notes:
          'Use when both speaker and listener know which specific thing is meant, or for unique items.',
        order: 2,
        examples: [
          'Can you pass the salt, please?',
          'She is the best student in the class.',
          'The sun rises in the east and sets in the west.',
        ],
      },
      {
        title: 'Zero Article',
        formula: [n('∅'), c('+'), o('noun')],
        notes:
          'No article with: plural generics, uncountable generics, most proper nouns, languages, sports, meals.',
        order: 3,
        examples: [
          'I love music, especially jazz.',
          'She studies English at university.',
          'Gold is a precious metal.',
        ],
      },
    ],
  },
];

// ─── Idiom seed data ──────────────────────────────────────────────────────────

type IdiomInput = {
  phrase: string;
  explanation: string;
  register?: string;
  notes?: string;
  order: number;
  examples: string[];
};

type IdiomCategoryInput = {
  title: string;
  order: number;
  idioms: IdiomInput[];
};

const idiomCategories: IdiomCategoryInput[] = [
  {
    title: 'Social Interaction',
    order: 1,
    idioms: [
      {
        phrase: 'break the ice',
        explanation:
          'To do or say something to relieve tension or awkwardness in a social situation.',
        register: 'neutral',
        order: 1,
        examples: [
          'He told a funny story to break the ice at the party.',
          'The team-building activity was designed to break the ice among new employees.',
          'She broke the ice by complimenting his shirt.',
        ],
      },
      {
        phrase: 'read the room',
        explanation:
          'To understand and respond appropriately to the mood or atmosphere of a situation.',
        register: 'informal',
        order: 2,
        examples: [
          'He kept making jokes during the serious meeting — he really needs to read the room.',
          'She read the room and decided not to bring up the bad news.',
          'A good presenter knows how to read the room and adjust their style.',
        ],
      },
      {
        phrase: 'hit it off',
        explanation:
          'To immediately like someone and begin a friendly relationship.',
        register: 'informal',
        order: 3,
        examples: [
          'We hit it off immediately at the conference.',
          'She and her new colleague really hit it off.',
          'They hit it off so well that they ended up talking for hours.',
        ],
      },
      {
        phrase: 'clear the air',
        explanation:
          'To talk openly about a problem in order to reduce tension or resolve a misunderstanding.',
        register: 'neutral',
        order: 4,
        examples: [
          'We need to have a meeting to clear the air about what happened.',
          'The apology helped to clear the air between the two colleagues.',
          "Let's clear the air before this misunderstanding gets worse.",
        ],
      },
      {
        phrase: 'go out of your way',
        explanation: 'To make a special effort to do something for someone.',
        register: 'neutral',
        order: 5,
        examples: [
          'She went out of her way to make the guests feel welcome.',
          'He went out of his way to help me find the information I needed.',
          'They really went out of their way to accommodate our requests.',
        ],
      },
      {
        phrase: 'small talk',
        explanation:
          'Light, casual conversation about unimportant topics, especially with people you do not know well.',
        register: 'neutral',
        order: 6,
        examples: [
          'She is not very good at small talk at parties.',
          'They made small talk while waiting for the meeting to start.',
          'He found small talk exhausting and preferred meaningful conversations.',
        ],
      },
      {
        phrase: 'bend over backwards',
        explanation: 'To try very hard to help someone or to do something.',
        register: 'informal',
        order: 7,
        examples: [
          'The hotel staff bent over backwards to make our stay perfect.',
          'She bent over backwards to finish the project on time.',
          'We bent over backwards to accommodate every client request.',
        ],
      },
      {
        phrase: "keep someone at arm's length",
        explanation: 'To avoid becoming too friendly or involved with someone.',
        register: 'neutral',
        order: 8,
        examples: [
          "He kept his new colleagues at arm's length until he got to know them better.",
          "She tended to keep people at arm's length after being hurt.",
          "The company kept its suppliers at arm's length to maintain objectivity.",
        ],
      },
    ],
  },
  {
    title: 'Time & Deadlines',
    order: 2,
    idioms: [
      {
        phrase: 'in the nick of time',
        explanation:
          'Just in time; at the last possible moment before something happens.',
        register: 'neutral',
        order: 1,
        examples: [
          'We caught the train in the nick of time.',
          'The ambulance arrived in the nick of time to save his life.',
          'She submitted her application in the nick of time before the deadline.',
        ],
      },
      {
        phrase: 'once in a blue moon',
        explanation: 'Very rarely; not very often at all.',
        register: 'informal',
        order: 2,
        examples: [
          'He only visits his parents once in a blue moon.',
          'Once in a blue moon, you find a truly outstanding restaurant.',
          'She writes to me once in a blue moon, so I was surprised to hear from her.',
        ],
      },
      {
        phrase: 'around the clock',
        explanation:
          'For all 24 hours of the day; continuously without stopping.',
        register: 'neutral',
        order: 3,
        examples: [
          'The hospital staff worked around the clock during the emergency.',
          'They monitored the system around the clock to detect any issues.',
          'He studied around the clock before his final exams.',
        ],
      },
      {
        phrase: 'at the eleventh hour',
        explanation:
          'At the last possible moment, especially before a deadline.',
        register: 'neutral',
        order: 4,
        examples: [
          'The deal was agreed at the eleventh hour, saving the company.',
          'She finished her essay at the eleventh hour.',
          'The rescue team arrived at the eleventh hour to pull them out.',
        ],
      },
      {
        phrase: 'on borrowed time',
        explanation:
          'In a situation that cannot last much longer; living or existing beyond the expected time.',
        register: 'neutral',
        order: 5,
        examples: [
          'The old factory was on borrowed time and eventually had to close.',
          'After that warning, his career was on borrowed time.',
          'With those outdated systems, the company is living on borrowed time.',
        ],
      },
    ],
  },
  {
    title: 'Success & Achievement',
    order: 3,
    idioms: [
      {
        phrase: 'hit the nail on the head',
        explanation:
          'To describe exactly what is causing a situation or problem; to be precisely correct.',
        register: 'neutral',
        order: 1,
        examples: [
          "You hit the nail on the head — that's exactly what we need to fix.",
          'Her analysis hit the nail on the head.',
          'The report hit the nail on the head when it identified the communication gap.',
        ],
      },
      {
        phrase: 'go the extra mile',
        explanation: 'To do more than is expected or required.',
        register: 'neutral',
        order: 2,
        examples: [
          'She always goes the extra mile for her clients.',
          'Going the extra mile is what separates good service from great service.',
          'He went the extra mile by preparing a detailed handover document.',
        ],
      },
      {
        phrase: 'raise the bar',
        explanation: 'To set a higher standard of quality or performance.',
        register: 'neutral',
        order: 3,
        examples: [
          'Their new product really raised the bar for the entire industry.',
          'We need to raise the bar on customer service.',
          'Her performance raised the bar for all future presentations.',
        ],
      },
      {
        phrase: 'reap the rewards',
        explanation: 'To enjoy the benefits of hard work or a good decision.',
        register: 'neutral',
        order: 4,
        examples: [
          'After years of training, she is now reaping the rewards.',
          'Investors who stayed calm during the dip are now reaping the rewards.',
          'He reaped the rewards of his consistent effort.',
        ],
      },
      {
        phrase: 'on top of the world',
        explanation: 'Feeling extremely happy and successful.',
        register: 'informal',
        order: 5,
        examples: [
          'She felt on top of the world after getting the promotion.',
          'Winning the championship made the whole team feel on top of the world.',
          'He was on top of the world after his first major sale.',
        ],
      },
      {
        phrase: 'make a mark',
        explanation:
          "To achieve something notable; to become recognized for one's contributions.",
        register: 'neutral',
        order: 6,
        examples: [
          'She made her mark in the industry at a very young age.',
          'The new manager made his mark quickly with bold decisions.',
          'This film made its mark as a turning point in cinema.',
        ],
      },
    ],
  },
  {
    title: 'Difficulty & Challenges',
    order: 4,
    idioms: [
      {
        phrase: 'bite off more than you can chew',
        explanation:
          'To take on more responsibility or work than you can handle.',
        register: 'informal',
        order: 1,
        examples: [
          'He bit off more than he could chew by taking three projects at once.',
          "Don't bite off more than you can chew — ask for help if you need it.",
          'She realized she had bitten off more than she could chew with the new role.',
        ],
      },
      {
        phrase: 'face the music',
        explanation: "To accept the unpleasant consequences of one's actions.",
        register: 'informal',
        order: 2,
        examples: [
          'He finally had to face the music and admit his mistake.',
          'After months of avoiding it, she faced the music and apologized.',
          "It's time to face the music and tell the client about the delay.",
        ],
      },
      {
        phrase: 'uphill battle',
        explanation:
          'A task or situation that is very difficult to achieve because you face many obstacles.',
        register: 'neutral',
        order: 3,
        examples: [
          'Getting the project approved was an uphill battle from the start.',
          'Changing public opinion on this issue will be an uphill battle.',
          'She faced an uphill battle to prove herself in the male-dominated field.',
        ],
      },
      {
        phrase: 'in deep water',
        explanation:
          'In a difficult or serious situation that is hard to escape from.',
        register: 'informal',
        order: 4,
        examples: [
          'He was in deep water after missing the deadline twice.',
          'The company found itself in deep water after the scandal.',
          'She was in deep water with her supervisor over the budget overrun.',
        ],
      },
      {
        phrase: 'catch someone off guard',
        explanation: 'To surprise someone when they are not prepared.',
        register: 'neutral',
        order: 5,
        examples: [
          'The unexpected question caught her completely off guard.',
          'The sudden market crash caught many investors off guard.',
          'He was caught off guard by the announcement.',
        ],
      },
    ],
  },
  {
    title: 'Communication',
    order: 5,
    idioms: [
      {
        phrase: 'get to the point',
        explanation:
          'To say the most important thing directly, without wasting time on unnecessary details.',
        register: 'neutral',
        order: 1,
        examples: [
          'We only have five minutes — please get to the point.',
          'He tends to talk a lot before getting to the point.',
          'Can you get to the point? I have another meeting in ten minutes.',
        ],
      },
      {
        phrase: 'beat around the bush',
        explanation:
          'To avoid talking about what is important; to speak in a vague or indirect way.',
        register: 'informal',
        order: 2,
        examples: [
          'Stop beating around the bush and tell me what happened.',
          'She beat around the bush for ten minutes before mentioning the real issue.',
          "Don't beat around the bush — just say what you mean.",
        ],
      },
      {
        phrase: 'on the same page',
        explanation:
          'In agreement or having the same understanding about something.',
        register: 'neutral',
        order: 3,
        examples: [
          "Let's have a quick meeting to make sure we are all on the same page.",
          'I want to make sure we are on the same page before we proceed.',
          'After the briefing, the team was finally on the same page.',
        ],
      },
      {
        phrase: 'speak your mind',
        explanation:
          'To say exactly what you think, even if it might upset others.',
        register: 'neutral',
        order: 4,
        examples: [
          'She has never been afraid to speak her mind in meetings.',
          'He finally spoke his mind about the unfair policy.',
          'The manager encouraged employees to speak their minds.',
        ],
      },
      {
        phrase: 'touch base',
        explanation:
          'To make brief contact with someone to share information or check in.',
        register: 'informal',
        order: 5,
        examples: [
          "Let's touch base on Friday to see how the project is going.",
          'I just wanted to touch base with you before the presentation.',
          'She touched base with every team member before the deadline.',
        ],
      },
    ],
  },
  {
    title: 'Emotions & Feelings',
    order: 6,
    idioms: [
      {
        phrase: 'under the weather',
        explanation: 'Feeling slightly ill or unwell.',
        register: 'informal',
        order: 1,
        examples: [
          'She is feeling a bit under the weather today, so she stayed home.',
          'I was under the weather last week and missed a few meetings.',
          'He looks under the weather — I hope he is okay.',
        ],
      },
      {
        phrase: 'over the moon',
        explanation: 'Extremely happy and excited about something.',
        register: 'informal',
        order: 2,
        examples: [
          'She was over the moon when she got the scholarship.',
          'The whole team was over the moon after winning the award.',
          'He was over the moon about the new baby.',
        ],
      },
      {
        phrase: 'on cloud nine',
        explanation: 'Extremely happy; in a state of euphoria.',
        register: 'informal',
        order: 3,
        examples: [
          'She has been on cloud nine since she got engaged.',
          'After the promotion, he was on cloud nine for days.',
          'They were on cloud nine after their team won the championship.',
        ],
      },
      {
        phrase: 'have butterflies in your stomach',
        explanation:
          'To feel nervous or anxious, especially before an important event.',
        register: 'informal',
        order: 4,
        examples: [
          'I always have butterflies in my stomach before a big presentation.',
          'She had butterflies in her stomach before the job interview.',
          'Even experienced performers can have butterflies before going on stage.',
        ],
      },
      {
        phrase: 'at the end of your rope',
        explanation:
          'To have no more patience or ability to cope with a difficult situation.',
        register: 'informal',
        order: 5,
        examples: [
          'After months of delays, the client was at the end of his rope.',
          'She was at the end of her rope trying to manage everything alone.',
          "I'm at the end of my rope with this broken software.",
        ],
      },
    ],
  },
  {
    title: 'Work & Career',
    order: 7,
    idioms: [
      {
        phrase: 'burn the midnight oil',
        explanation: 'To work very late into the night on something.',
        register: 'neutral',
        order: 1,
        examples: [
          'She burned the midnight oil to finish the report before the morning meeting.',
          'The developers burned the midnight oil to fix the critical bug.',
          'He has been burning the midnight oil all week to prepare for the launch.',
        ],
      },
      {
        phrase: 'ahead of the curve',
        explanation:
          'More advanced or progressive than others; anticipating future trends.',
        register: 'neutral',
        order: 2,
        examples: [
          'The company stayed ahead of the curve by investing in AI early.',
          'She was always ahead of the curve when it came to industry trends.',
          'Their research put them ahead of the curve in renewable energy.',
        ],
      },
      {
        phrase: 'back to square one',
        explanation:
          'Having to start again from the beginning after a failure.',
        register: 'informal',
        order: 3,
        examples: [
          'The client rejected our proposal, so we are back to square one.',
          'After the system crashed, we were back to square one.',
          'The contract fell through, putting us back to square one.',
        ],
      },
      {
        phrase: 'get the ball rolling',
        explanation: 'To start an activity or process.',
        register: 'informal',
        order: 4,
        examples: [
          "Let's get the ball rolling on the new project this week.",
          'She was the one who got the ball rolling on the merger discussions.',
          'Can someone get the ball rolling on the agenda, please?',
        ],
      },
      {
        phrase: 'pull your weight',
        explanation: 'To do your fair share of work within a group.',
        register: 'informal',
        order: 5,
        examples: [
          'Everyone on the team needs to pull their weight.',
          'He was criticized for not pulling his weight during the project.',
          'If you pull your weight, the team will respect you.',
        ],
      },
      {
        phrase: 'think outside the box',
        explanation:
          'To think creatively and unconventionally; to approach problems in new ways.',
        register: 'neutral',
        order: 6,
        examples: [
          'We need to think outside the box to solve this complex problem.',
          'The campaign succeeded because the team was willing to think outside the box.',
          'Her ability to think outside the box made her a valuable designer.',
        ],
      },
    ],
  },
  {
    title: 'Money & Business',
    order: 8,
    idioms: [
      {
        phrase: 'cost an arm and a leg',
        explanation: 'To be extremely expensive.',
        register: 'informal',
        order: 1,
        examples: [
          'The renovation cost an arm and a leg but was worth it.',
          'Hiring a specialist in this field can cost an arm and a leg.',
          'Those designer shoes cost an arm and a leg.',
        ],
      },
      {
        phrase: 'break even',
        explanation:
          'To make exactly enough money to cover costs, without profit or loss.',
        register: 'neutral',
        order: 2,
        examples: [
          'The business hopes to break even within the first year.',
          'After all the expenses, we barely broke even on the event.',
          'The film needs to sell 100,000 copies just to break even.',
        ],
      },
      {
        phrase: 'make ends meet',
        explanation: 'To earn just enough money to pay for basic necessities.',
        register: 'neutral',
        order: 3,
        examples: [
          'With rising prices, many families struggle to make ends meet.',
          'She took a second job to make ends meet.',
          'They could barely make ends meet after the pay cut.',
        ],
      },
      {
        phrase: 'cut corners',
        explanation:
          'To do something in the easiest or cheapest way, often compromising quality.',
        register: 'informal',
        order: 4,
        examples: [
          'The contractor cut corners and used cheaper materials.',
          'Cutting corners on safety is never acceptable.',
          'They cut corners to meet the deadline and the product suffered.',
        ],
      },
    ],
  },
  {
    title: 'Relationships',
    order: 9,
    idioms: [
      {
        phrase: 'tie the knot',
        explanation: 'To get married.',
        register: 'informal',
        order: 1,
        examples: [
          'They finally tied the knot after dating for six years.',
          'When are you two planning to tie the knot?',
          'She and her partner tied the knot in a small ceremony last spring.',
        ],
      },
      {
        phrase: 'on thin ice',
        explanation:
          'In a risky or dangerous situation where one wrong move could cause serious trouble.',
        register: 'informal',
        order: 2,
        examples: [
          'After the second warning, he was on thin ice with his manager.',
          'The diplomat was on thin ice with his controversial remarks.',
          'She knew she was on thin ice when she missed the third deadline.',
        ],
      },
      {
        phrase: 'bury the hatchet',
        explanation:
          'To make peace with someone after a dispute; to end a conflict.',
        register: 'neutral',
        order: 3,
        examples: [
          'The two rivals finally buried the hatchet after years of conflict.',
          "It's time to bury the hatchet and move forward.",
          'They buried the hatchet and agreed to collaborate on the project.',
        ],
      },
      {
        phrase: 'see eye to eye',
        explanation: 'To agree with someone; to have the same opinion or view.',
        register: 'neutral',
        order: 4,
        examples: [
          "They don't always see eye to eye on design decisions.",
          'The partners saw eye to eye on most issues, which made the collaboration smooth.',
          "It's rare to see eye to eye with everyone on a team.",
        ],
      },
    ],
  },
  {
    title: 'Learning & Knowledge',
    order: 10,
    idioms: [
      {
        phrase: 'learn the ropes',
        explanation: 'To learn the basics of a job, activity, or situation.',
        register: 'neutral',
        order: 1,
        examples: [
          'It took him a few weeks to learn the ropes at the new company.',
          'She learned the ropes quickly and was soon managing her own clients.',
          'Every new employee needs time to learn the ropes.',
        ],
      },
      {
        phrase: "pick someone's brain",
        explanation:
          'To ask someone for their knowledge, advice, or ideas about something.',
        register: 'informal',
        order: 2,
        examples: [
          'Can I pick your brain about the new marketing strategy?',
          "She picked her mentor's brain before making the big decision.",
          "I'd love to pick your brain about starting a business.",
        ],
      },
      {
        phrase: 'connect the dots',
        explanation:
          'To find the link between separate pieces of information to understand a bigger picture.',
        register: 'neutral',
        order: 3,
        examples: [
          'Once I connected the dots, the whole situation made sense.',
          'It took the detective several hours to connect the dots.',
          'He was the first to connect the dots between the two seemingly unrelated events.',
        ],
      },
      {
        phrase: 'know something inside out',
        explanation: 'To know something extremely well and in great detail.',
        register: 'informal',
        order: 4,
        examples: [
          'She knows this software inside out.',
          "He knows the city inside out — he's lived there his whole life.",
          'You need to know the product inside out before you can sell it effectively.',
        ],
      },
      {
        phrase: 'trial and error',
        explanation:
          'A problem-solving method based on trying different solutions until one works.',
        register: 'neutral',
        order: 5,
        examples: [
          'We found the best approach through trial and error.',
          'Cooking is often a process of trial and error.',
          'By trial and error, the team finally got the system running correctly.',
        ],
      },
    ],
  },
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  // ── Grammar seed ────────────────────────────────────────────────────────────
  console.log('Seeding grammar data...');

  for (const section of sections) {
    const createdSection = await prisma.grammarSection.upsert({
      where: { id: `section-${section.order}` },
      update: { title: section.title, order: section.order },
      create: {
        id: `section-${section.order}`,
        title: section.title,
        order: section.order,
      },
    });

    for (const pattern of section.patterns) {
      const patternId = `pattern-${section.order}-${pattern.order}`;
      const createdPattern = await prisma.grammarPattern.upsert({
        where: { id: patternId },
        update: {
          title: pattern.title,
          formula: pattern.formula,
          notes: pattern.notes ?? null,
          order: pattern.order,
        },
        create: {
          id: patternId,
          sectionId: createdSection.id,
          title: pattern.title,
          formula: pattern.formula,
          notes: pattern.notes ?? null,
          order: pattern.order,
        },
      });

      // Delete old system examples for this pattern, then re-create
      await prisma.grammarExample.deleteMany({
        where: { patternId: createdPattern.id, userId: null },
      });

      for (const sentence of pattern.examples) {
        await prisma.grammarExample.create({
          data: { patternId: createdPattern.id, userId: null, sentence },
        });
      }
    }

    console.log(`  ✓ ${section.title} (${section.patterns.length} patterns)`);
  }

  // ── Idiom seed ──────────────────────────────────────────────────────────────
  console.log('Seeding idiom data...');

  for (const category of idiomCategories) {
    const createdCategory = await prisma.idiomCategory.upsert({
      where: { id: `idiom-cat-${category.order}` },
      update: { title: category.title, order: category.order },
      create: {
        id: `idiom-cat-${category.order}`,
        title: category.title,
        order: category.order,
      },
    });

    for (const idiom of category.idioms) {
      const idiomId = `idiom-${category.order}-${idiom.order}`;
      const createdIdiom = await prisma.idiom.upsert({
        where: { id: idiomId },
        update: {
          phrase: idiom.phrase,
          explanation: idiom.explanation,
          register: idiom.register ?? null,
          notes: idiom.notes ?? null,
          order: idiom.order,
        },
        create: {
          id: idiomId,
          categoryId: createdCategory.id,
          phrase: idiom.phrase,
          explanation: idiom.explanation,
          register: idiom.register ?? null,
          notes: idiom.notes ?? null,
          order: idiom.order,
        },
      });

      await prisma.idiomExample.deleteMany({
        where: { idiomId: createdIdiom.id, userId: null },
      });

      for (const sentence of idiom.examples) {
        await prisma.idiomExample.create({
          data: { idiomId: createdIdiom.id, userId: null, sentence },
        });
      }
    }

    console.log(`  ✓ ${category.title} (${category.idioms.length} idioms)`);
  }

  console.log('Done!');
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
