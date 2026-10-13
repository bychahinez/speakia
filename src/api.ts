import { CAST } from './content/cast';
import { Episode, Hints, RoleOption } from './content/episodes';
import { Level, idToken } from './storage';

// Set in .env at the project root (see README):
//   EXPO_PUBLIC_API_URL=https://speakia-api.<you>.workers.dev
// The server only answers learners signed in with Firebase (account or guest), so no key lives in the app.
const API = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

async function authHeaders(): Promise<Record<string, string>> {
  const token = await idToken();
  if (!token) throw new Error('Sign in to use voice and AI');
  return { authorization: `Bearer ${token}` };
}

/** No server configured: the app runs in demo mode with scripted replies and typing only. */
export const isDemo = !API;

export type TurnResult = {
  reply: string;
  done: boolean;
  goalProgress: number;
  bridgeWords: { from: string; to: string }[];
  hints: Hints;
  corrections: { said: string; better: string }[];
};

export type ChatLine = { from: 'you' | 'partner'; text: string };

/** The server speaks in three bands; CEFR levels map onto them. */
const band = (l: Level) => (l === 'A1' || l === 'A2' ? 'Beginner' : l === 'B1' || l === 'B2' ? 'Intermediate' : 'Advanced');

export async function transcribe(uri: string): Promise<string> {
  if (!API) throw new Error('No server configured');
  const form = new FormData();
  // React Native accepts this {uri,name,type} object as a file part
  form.append('file', { uri, name: 'speech.m4a', type: 'audio/m4a' } as unknown as Blob);
  const res = await fetch(`${API}/transcribe`, { method: 'POST', headers: await authHeaders(), body: form });
  if (!res.ok) throw new Error(`Transcription failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as { text?: string };
  return (data.text ?? '').trim();
}

export async function nextTurn(args: {
  episode: Episode;
  role: RoleOption;
  level: Level;
  major: string;
  learnerName?: string;
  history: ChatLine[];
  turn: number;
}): Promise<TurnResult> {
  const { episode, role, level, major, learnerName, history, turn } = args;
  if (!API) return demoTurn(role, history, turn, episode.maxTurns);

  const partner = CAST[role.partner];
  const player = CAST[role.player];
  const res = await fetch(`${API}/turn`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify({
      setting: episode.setting,
      partner: { name: partner.shortName, personality: partner.personality },
      player: { name: player.shortName },
      learnerName,
      goal: role.goal,
      level: band(level),
      major,
      turn,
      maxTurns: episode.maxTurns,
      history,
    }),
  });
  if (!res.ok) throw new Error(`The AI did not answer (${res.status}): ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as TurnResult;
}

// ---------- demo mode (no server) ----------

const FRENCH_HINTS: Record<string, string> = {
  navigateur: 'browser', 'téléphone': 'phone', telephone: 'phone', stage: 'internship', 'délai': 'deadline',
  delai: 'deadline', ordinateur: 'computer', 'application': 'app', projet: 'project', 'équipe': 'team',
};

function demoTurn(role: RoleOption, history: ChatLine[], turn: number, maxTurns: number): TurnResult {
  const last = [...history].reverse().find((l) => l.from === 'you')?.text ?? '';
  const words = last.toLowerCase().split(/[^a-zà-ÿ]+/);
  const bridgeWords = Object.entries(FRENCH_HINTS)
    .filter(([fr]) => words.includes(fr))
    .map(([from, to]) => ({ from, to }));
  const corrections: TurnResult['corrections'] = [];
  if (/\beverybody (test|use|like)\b/i.test(last)) {
    corrections.push({ said: last.match(/everybody \w+/i)![0], better: 'everybody can ' + last.match(/everybody (\w+)/i)![1] });
  }
  if (/\bis more better\b/i.test(last)) corrections.push({ said: 'is more better', better: 'is better' });
  const done = turn >= maxTurns;
  const reply = role.demoReplies[Math.min(turn - 1, role.demoReplies.length - 1)];
  return {
    reply,
    done,
    goalProgress: Math.min(1, turn / maxTurns),
    bridgeWords,
    corrections,
    hints: {
      idea: 'Answer their question, then add one more reason.',
      starter: 'That’s true, but…',
      example: 'That’s true, but we can still finish it in two weeks if we keep it simple.',
    },
  };
}
