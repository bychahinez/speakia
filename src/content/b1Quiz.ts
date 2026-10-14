// B1 level test, written by the project's English teacher (5 parts, 20 questions, CEFR-based).
// Her sheet did not include the answer key: `answer` values were filled in from standard B1
// grammar and should be confirmed by her. Option order was restored where the PDF copy scrambled it.

export type QuizPart = 'grammar' | 'vocabulary' | 'linking' | 'conversation' | 'reading';

export const PARTS: Record<QuizPart, { title: string; skill: string; instruction: string }> = {
  grammar: { title: 'Grammar', skill: 'Language use', instruction: 'Choose the correct answer.' },
  vocabulary: { title: 'Vocabulary', skill: 'Language use', instruction: 'Choose the best word.' },
  linking: { title: 'Linking ideas', skill: 'Coherence and cohesion', instruction: 'Choose the best linking word.' },
  conversation: { title: 'Everyday conversation', skill: 'Spoken interaction', instruction: 'Choose the best reply.' },
  reading: { title: 'Reading', skill: 'Reading comprehension', instruction: 'Read the text and answer the question.' },
};

export const TEXTS = {
  email: {
    title: 'Text A · an email',
    body:
      'Hi Sara,\n\nSorry I haven’t written for so long! The last two months have been really busy because I started my new job at a travel agency in Tlemcen. I was nervous on the first day, but my colleagues are very friendly and they have helped me a lot. The only problem is the journey: it takes more than an hour by bus, so I’m thinking about moving closer to the office. I’d love to see you before the summer. Are you free on the 14th? We could have lunch at the café near the old market, if you like. Let me know!\n\nLove,\nMeriem',
  },
  notice: {
    title: 'Text B · a notice',
    body:
      'CITY LIBRARY: NEW OPENING HOURS\n\nFrom 1 November, the library will be open from 9:00 to 18:00, Sunday to Thursday. On Saturdays it will close at 13:00. The library is closed on Fridays. Members with a valid card can borrow up to four books for three weeks.',
  },
} as const;

export type QuizQuestion = {
  n: number;
  part: QuizPart;
  prompt: string;            // ___ marks the gap
  options: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;     // index into options (A = 0)
  text?: keyof typeof TEXTS; // reading questions refer to a text
};

export const B1_QUIZ: QuizQuestion[] = [
  // Part 1 · Grammar
  { n: 1, part: 'grammar', prompt: 'If I ___ more free time, I would learn Spanish.', options: ['have', 'had', 'will have', 'would have'], answer: 1 },
  { n: 2, part: 'grammar', prompt: 'I ___ in Oran since 2019.', options: ['live', 'am living', 'have lived', 'lived'], answer: 2 },
  { n: 3, part: 'grammar', prompt: 'When I got to the station, the train ___ already left.', options: ['has', 'had', 'was', 'did'], answer: 1 },
  { n: 4, part: 'grammar', prompt: 'This mosque ___ in the 18th century.', options: ['built', 'has built', 'was built', 'is building'], answer: 2 },
  { n: 5, part: 'grammar', prompt: 'When I was a child, I ___ play football in the street every day.', options: ['used to', 'use to', 'was used to', 'am used to'], answer: 0 },
  // Part 2 · Vocabulary
  { n: 6, part: 'vocabulary', prompt: 'Can you ___ my cat while I’m on holiday?', options: ['look for', 'look after', 'look up', 'look out'], answer: 1 },
  { n: 7, part: 'vocabulary', prompt: 'Our flight was ___ for two hours because of the fog.', options: ['delayed', 'missed', 'lost', 'spent'], answer: 0 },
  { n: 8, part: 'vocabulary', prompt: 'He ___ a lot of mistakes in his essay.', options: ['did', 'made', 'took', 'had'], answer: 1 },
  { n: 9, part: 'vocabulary', prompt: 'I forgot my pen. Could you ___ me yours?', options: ['borrow', 'lend', 'take', 'keep'], answer: 1 },
  // Part 3 · Linking ideas
  { n: 10, part: 'linking', prompt: '___ it was raining, we went for a walk.', options: ['Although', 'Because', 'However', 'So'], answer: 0 },
  { n: 11, part: 'linking', prompt: 'The hotel was very expensive. ___, the rooms were small and noisy.', options: ['Although', 'However', 'Because', 'So that'], answer: 1 },
  { n: 12, part: 'linking', prompt: 'She saved money every month ___ she could buy a laptop.', options: ['although', 'because of', 'so that', 'unless'], answer: 2 },
  // Part 4 · Everyday conversation
  { n: 13, part: 'conversation', prompt: 'A: Would you mind opening the window?\nB: ___', options: ['Not at all.', 'Yes, I open it.', 'No, I don’t mind it open.', 'Of course I mind.'], answer: 0 },
  { n: 14, part: 'conversation', prompt: 'A: I think we should take the bus.\nB: ___', options: ['I’m agree, but the bus is slow.', 'That’s a good idea, but the train is quicker.', 'Yes, I think so not.', 'You are agree with me?'], answer: 1 },
  { n: 15, part: 'conversation', prompt: 'In a shop: “I bought this phone here last week, but ___”', options: ['it doesn’t work properly. Could I get a refund?', 'it don’t work, give me money.', 'it not working, I want back.', 'it is not work good.'], answer: 0 },
  // Part 5 · Reading
  { n: 16, part: 'reading', text: 'email', prompt: 'Why hasn’t Meriem written to Sara?', options: ['She was ill.', 'She has been busy with a new job.', 'She moved to another city.', 'She lost Sara’s address.'], answer: 1 },
  { n: 17, part: 'reading', text: 'email', prompt: 'How does Meriem feel about her colleagues?', options: ['They make her nervous.', 'She doesn’t know them yet.', 'They are friendly and helpful.', 'She finds them too busy.'], answer: 2 },
  { n: 18, part: 'reading', text: 'email', prompt: 'What is Meriem thinking of doing?', options: ['Changing her job', 'Buying a car', 'Moving nearer to her office', 'Taking the train'], answer: 2 },
  { n: 19, part: 'reading', text: 'email', prompt: 'What is the main purpose of Meriem’s email?', options: ['To ask Sara for help', 'To invite Sara to meet for lunch', 'To describe Tlemcen', 'To complain about her job'], answer: 1 },
  { n: 20, part: 'reading', text: 'notice', prompt: 'A member wants to borrow books on Saturday at 15:00. What is true?', options: ['The library is open until 18:00.', 'The library is closed at that time.', 'She can borrow only two books.', 'She doesn’t need a card.'], answer: 1 },
];

/** Pass mark for the B1 quiz (teacher's rule: grammar and vocabulary must be at B1 to be B1). */
export const B1_PASS = 0.7;
