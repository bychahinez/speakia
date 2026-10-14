import { B1_PASS, B1_QUIZ, QuizPart } from './content/b1Quiz';
import type { Assessment } from './api';
import { Level } from './storage';

export const QUESTIONS = [
  { title: 'Introduce yourself', sub: 'Tell us your name, what you study and where.' },
  { title: 'Tell us about something', sub: 'you enjoyed doing recently.' },
  { title: 'Describe a project', sub: 'you worked on, at university or on your own.' },
  { title: 'Is AI useful for university students?', sub: 'Give your opinion and explain why.' },
];

const LINKERS = /\b(because|so|but|however|although|though|while|since|therefore|instead|also|actually|for example|first|then|finally|on the other hand|in my opinion|i think|i believe)\b/gi;

export type Estimate = { level: Level; confident: boolean };

/**
 * A rough practice estimate from four short answers, based on how much the learner said,
 * how varied the words were and how often they linked ideas. It is not a CEFR certification:
 * it never awards C2, and with too little speech it says so instead of guessing.
 */
export function estimateLevel(answers: string[]): Estimate {
  const words = answers.join(' ').toLowerCase().match(/[a-z']+/g) ?? [];
  const answered = answers.filter((a) => a.trim().split(/\s+/).length >= 4).length;
  if (words.length < 30 || answered < 3) return { level: 'A2', confident: false };

  const perAnswer = words.length / answers.length;
  const variety = new Set(words).size / words.length;
  const linkers = (answers.join(' ').match(LINKERS) ?? []).length / answers.length;
  const longWords = words.filter((w) => w.length >= 7).length / words.length;

  const score =
    Math.min(perAnswer / 80, 1) * 45 +   // amount of speech (a confident 45 s answer is ~80 words)
    Math.min(variety / 0.75, 1) * 15 +   // vocabulary range
    Math.min(linkers / 4, 1) * 20 +      // connected ideas
    Math.min(longWords / 0.25, 1) * 20;  // richer vocabulary

  const level: Level = score >= 85 ? 'C1' : score >= 68 ? 'B2' : score >= 46 ? 'B1' : score >= 20 ? 'A2' : 'A1';
  return { level, confident: true };
}

// ---------- B1 quiz (written part of the placement test) ----------


export type QuizResult = {
  correct: number;
  total: number;
  passed: boolean;
  byPart: Record<QuizPart, { correct: number; total: number }>;
};

/** The quiz result from this session, read by the speaking part and the result screen. */
export let lastQuiz: QuizResult | null = null;

/** Score the learner's picks (option index per question, null when skipped). */
export function scoreQuiz(picks: (number | null)[]): QuizResult {
  const byPart = {} as QuizResult['byPart'];
  let correct = 0;
  B1_QUIZ.forEach((q, i) => {
    const part = (byPart[q.part] ??= { correct: 0, total: 0 });
    part.total += 1;
    if (picks[i] === q.answer) {
      part.correct += 1;
      correct += 1;
    }
  });
  lastQuiz = { correct, total: B1_QUIZ.length, passed: correct / B1_QUIZ.length >= B1_PASS, byPart };
  return lastQuiz;
}

export function clearQuiz() {
  lastQuiz = null;
}

const ORDER: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/**
 * Final level: the speaking estimate, but someone who doesn't pass the B1 grammar and vocabulary
 * quiz isn't B1 (the teacher's CEFR rule), so their level is capped at A2.
 */
export function combineLevel(speaking: Level, quiz: QuizResult | null): Level {
  if (!quiz || quiz.passed) return speaking;
  return ORDER.indexOf(speaking) > ORDER.indexOf('A2') ? 'A2' : speaking;
}

/** The AI speaking evaluation from this session (null when the quick estimate was used instead). */
export let lastAssessment: Assessment | null = null;
export function setAssessment(a: Assessment | null) {
  lastAssessment = a;
}
