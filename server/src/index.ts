/**
 * Speakia API: a free Cloudflare Worker that keeps the AI keys off the phone.
 *
 *   POST /transcribe   multipart "file" (audio)  -> { text }
 *   POST /turn         JSON (see TurnRequest)    -> TurnResult
 *   GET  /speak?who=sara&text=...&slow=1          -> audio/mpeg (Fish Audio voice for that character)
 *
 * Every request must carry a Firebase ID token (Authorization: Bearer <token>) from a signed-in
 * learner (email account or anonymous guest). The token is checked against Google's public keys,
 * so nothing secret lives in the app.
 *
 * Secrets (set with `npx wrangler secret put NAME`):
 *   GROQ_API_KEY   from console.groq.com (free plan)
 *   FISH_API_KEY   from fish.audio > API keys
 * Vars in wrangler.toml: FIREBASE_PROJECT_ID, CHAT_MODEL, STT_MODEL, FISH_MODEL, FISH_VOICE_<CHARACTER>.
 * Optional KV binding AUDIO stores voiced lines (the Cache API does nothing on *.workers.dev).
 */

import { createRemoteJWKSet, jwtVerify } from 'jose';

export interface Env {
  GROQ_API_KEY: string;
  FISH_API_KEY?: string;
  FIREBASE_PROJECT_ID: string;
  CHAT_MODEL?: string;
  STT_MODEL?: string;
  FISH_MODEL?: string;
  FISH_VOICE_SARA?: string;
  FISH_VOICE_YACINE?: string;
  FISH_VOICE_BENALI?: string;
  FISH_VOICE_HADDAD?: string;
  AUDIO?: KVNamespace; // optional: stores generated lines so each is made only once
}

// Google's public keys for Firebase ID tokens (cached by jose between requests).
const FIREBASE_KEYS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

/** The learner's Firebase uid if the request carries a valid ID token for our project, else null. */
async function verifiedUser(req: Request, env: Env): Promise<string | null> {
  const header = req.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token || !env.FIREBASE_PROJECT_ID) return null;
  try {
    const { payload } = await jwtVerify(token, FIREBASE_KEYS, {
      issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
      audience: env.FIREBASE_PROJECT_ID,
      algorithms: ['RS256'],
    });
    return typeof payload.sub === 'string' && payload.sub ? payload.sub : null;
  } catch {
    return null;
  }
}

type ChatLine = { from: 'you' | 'partner'; text: string };

type TurnRequest = {
  setting: string;
  partner: { name: string; personality: string };
  player: { name: string };
  learnerName?: string;
  goal: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  major: string;
  turn: number;
  maxTurns: number;
  history: ChatLine[];
};

const GROQ = 'https://api.groq.com/openai/v1';
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type, authorization',
  'access-control-expose-headers': 'x-speakia-voice',
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', ...CORS } });

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    const url = new URL(req.url);
    if (req.method === 'GET' && url.pathname === '/') return json({ ok: true, service: 'speakia-api' });
    const route = `${req.method} ${url.pathname}`;
    if (!['POST /transcribe', 'POST /turn', 'GET /speak'].includes(route)) return json({ error: 'Not found' }, 404);
    if (!(await verifiedUser(req, env))) return json({ error: 'Sign in to use voice and AI' }, 401);

    try {
      if (route === 'POST /transcribe') return await transcribe(req, env);
      if (route === 'POST /turn') return await turn(req, env);
      return await speak(url, env, ctx);
    } catch (e) {
      return json({ error: e instanceof Error ? e.message : 'Server error' }, 500);
    }
  },
};

async function transcribe(req: Request, env: Env) {
  const form = await req.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') return json({ error: 'Missing audio file' }, 400);

  const out = new FormData();
  out.append('file', file, 'speech.m4a');
  out.append('model', env.STT_MODEL || 'whisper-large-v3-turbo');
  out.append('response_format', 'json');
  // A short prompt helps Whisper keep English and not "translate" French words students mix in.
  out.append('prompt', 'A university student speaking English, sometimes using a French or Arabic word.');

  const res = await fetch(`${GROQ}/audio/transcriptions`, {
    method: 'POST',
    headers: { authorization: `Bearer ${env.GROQ_API_KEY}` },
    body: out,
  });
  if (!res.ok) return json({ error: `Transcription failed: ${await res.text()}` }, 502);
  const data = (await res.json()) as { text?: string };
  return json({ text: (data.text ?? '').trim() });
}

function systemPrompt(raw: TurnRequest) {
  // the name is typed by the learner: keep it to a plain first name before it goes in the prompt
  const learnerName = (raw.learnerName ?? '').replace(/[^\p{L}\p{M} '-]/gu, '').trim().slice(0, 40);
  const r = { ...raw, learnerName };
  const style =
    r.level === 'Beginner'
      ? 'Use very simple words and short sentences (A2 level). Speak slowly and clearly.'
      : r.level === 'Advanced'
        ? 'Speak naturally like a fluent student, with some idioms.'
        : 'Use clear, everyday spoken English (B1-B2 level).';

  return `You are ${r.partner.name}, a university student in Algeria (${r.partner.personality}).
You are in a spoken English roleplay with a learner${r.learnerName ? ` called ${r.learnerName}` : ''}, a fellow student who is on ${r.player.name}'s side.
Setting: ${r.setting}
The learner's goal: ${r.goal}. The learner studies ${r.major}.

Rules for "reply":
- Stay in character. 1 or 2 short spoken sentences, max 30 words. ${style}${r.learnerName ? `
- You know the learner. Call them ${r.learnerName} now and then, like a friend would (not in every reply).` : ''}
- Disagree politely at first and ask ONE natural follow-up question that pushes the learner to give a reason.
- Never correct grammar inside the reply.
- If the learner used a French or Arabic word, understand it and continue naturally.
- When the learner has given at least two clear reasons, or this is turn ${r.maxTurns} or later, agree warmly and set "done": true.
Current learner turn: ${r.turn} of ${r.maxTurns}.

Return ONLY a JSON object with exactly these keys:
{
 "reply": string,
 "done": boolean,
 "goalProgress": number between 0 and 1,
 "bridgeWords": [{"from": "<French/Arabic word the learner used>", "to": "<English word>"}],
 "hints": {"idea": "<what the learner could say next, no full sentence>", "starter": "<first 3-6 words of an answer>", "example": "<one full example answer, max 25 words>"},
 "corrections": [{"said": "<exact short phrase from the learner's LAST message>", "better": "<corrected phrase>"}]
}
"corrections": at most 2, only real mistakes, empty array if none. "bridgeWords": empty array if none.
The hints are for the learner's NEXT answer to your reply.`;
}

async function turn(req: Request, env: Env) {
  const r = (await req.json()) as TurnRequest;
  if (!r?.history?.length) return json({ error: 'Missing history' }, 400);

  const messages = [
    { role: 'system', content: systemPrompt(r) },
    ...r.history.slice(-12).map((l) => ({
      role: l.from === 'partner' ? 'assistant' : 'user',
      content: l.from === 'partner' ? JSON.stringify({ reply: l.text }) : l.text,
    })),
  ];

  const res = await fetch(`${GROQ}/chat/completions`, {
    method: 'POST',
    headers: { authorization: `Bearer ${env.GROQ_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: env.CHAT_MODEL || 'openai/gpt-oss-120b',
      messages,
      temperature: 0.7,
      // gpt-oss is a reasoning model: keep the thinking short (speed) and out of the reply
      reasoning_effort: 'low',
      include_reasoning: false,
      max_completion_tokens: 1024,
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    console.log(`groq turn failed ${res.status}: ${detail.slice(0, 300)}`);
    return json({ error: `AI failed: ${detail}` }, 502);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  let out: Record<string, unknown> = {};
  try {
    out = JSON.parse(data.choices?.[0]?.message?.content ?? '{}');
  } catch {
    out = {};
  }

  // Defensive defaults so the app never breaks on a sloppy AI answer.
  const hints = (out.hints ?? {}) as Record<string, string>;
  return json({
    reply: typeof out.reply === 'string' && out.reply ? out.reply : 'Sorry, can you say that again?',
    done: Boolean(out.done) || r.turn >= r.maxTurns + 1,
    goalProgress: typeof out.goalProgress === 'number' ? out.goalProgress : Math.min(1, r.turn / r.maxTurns),
    bridgeWords: Array.isArray(out.bridgeWords) ? out.bridgeWords.slice(0, 3) : [],
    hints: {
      idea: hints.idea || 'Answer the question, then add one more reason.',
      starter: hints.starter || 'That’s true, but…',
      example: hints.example || 'That’s true, but I still think my idea is better because it is simpler.',
    },
    corrections: Array.isArray(out.corrections) ? out.corrections.slice(0, 2) : [],
  });
}

// ---------- character voices (Fish Audio) ----------

const VOICES: Record<string, keyof Env> = {
  sara: 'FISH_VOICE_SARA',
  yacine: 'FISH_VOICE_YACINE',
  benali: 'FISH_VOICE_BENALI',
  haddad: 'FISH_VOICE_HADDAD',
};

/**
 * Speak one line in a character's voice. The same line in the same voice always sounds the same,
 * so generated audio is kept in KV (when bound): a line any learner has heard is never made twice.
 * The x-speakia-voice header says "stored" or "generated", which the app logs with its timings.
 */
async function speak(url: URL, env: Env, ctx: ExecutionContext) {
  if (!env.FISH_API_KEY) return json({ error: 'Voices are not set up on the server' }, 503);
  const who = url.searchParams.get('who') ?? '';
  const text = (url.searchParams.get('text') ?? '').trim();
  const slow = url.searchParams.get('slow') === '1';
  if (!VOICES[who]) return json({ error: 'Unknown character' }, 400);
  if (!text || text.length > 400) return json({ error: 'Text must be 1 to 400 characters' }, 400);

  const model = env.FISH_MODEL || 's2.1-pro-free';
  const voice = env[VOICES[who]] as string | undefined;
  const audioHeaders = { 'content-type': 'audio/mpeg', 'cache-control': 'private, max-age=2592000', ...CORS };

  // Key: everything that changes the audio, nothing about who asked.
  const key = await sha256(`${model}|${voice ?? 'default'}|${slow ? 1 : 0}|${text}`);
  if (env.AUDIO) {
    const stored = await env.AUDIO.get(key, 'arrayBuffer');
    if (stored) return new Response(stored, { headers: { ...audioHeaders, 'x-speakia-voice': 'stored' } });
  }

  const started = Date.now();
  const res = await fetch('https://api.fish.audio/v1/tts', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.FISH_API_KEY}`, 'content-type': 'application/json', model },
    body: JSON.stringify({
      text,
      ...(voice ? { reference_id: voice } : {}),
      format: 'mp3',
      mp3_bitrate: 64,
      latency: 'low',
      chunk_length: 100,
      prosody: { speed: slow ? 0.85 : 1 },
    }),
  });
  if (!res.ok || !res.body) return json({ error: `Voice failed: ${res.ok ? 'empty audio' : await res.text()}` }, 502);
  console.log(`fish ${who}: first byte after ${Date.now() - started} ms (${text.length} chars)`);

  // Stream to the learner now; save a copy to KV in the background.
  const [toLearner, toStore] = res.body.tee();
  if (env.AUDIO) {
    const store = env.AUDIO;
    ctx.waitUntil(
      new Response(toStore).arrayBuffer().then((buf) => {
        console.log(`fish ${who}: complete after ${Date.now() - started} ms (${buf.byteLength} bytes)`);
        return store.put(key, buf, { expirationTtl: 60 * 60 * 24 * 90 });
      })
    );
  } else {
    ctx.waitUntil(toStore.cancel());
  }
  return new Response(toLearner, { headers: { ...audioHeaders, 'x-speakia-voice': 'generated' } });
}

async function sha256(s: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
