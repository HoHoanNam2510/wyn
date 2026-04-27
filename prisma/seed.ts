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

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

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

  console.log('Done!');
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
