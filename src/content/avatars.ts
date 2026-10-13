import { CAST, CastId, CastMember } from './cast';

// Learner avatars are built by the learner from a few simple choices, drawn with the same parts
// as the story cast so they match the illustrated style. Story characters stay the story's.

export type HairStyle = 'short' | 'sidepart' | 'curly' | 'long' | 'bun' | 'cropped' | 'hijab';
export type Facial = 'none' | 'stubble' | 'beard';

export type AvatarSpec = {
  skin: number;       // index into SKINS
  hair: HairStyle;
  hairColor: number;  // index into HAIR_COLORS
  hijabColor: number; // index into HIJAB_COLORS
  top: number;        // index into TOPS
  glasses: boolean;
  earrings: boolean;
  facial: Facial;
};

export const SKINS = [
  { skin: '#F3D0B0', shade: '#D9AE8A' },
  { skin: '#EDC09C', shade: '#D3A27C' },
  { skin: '#D9A27F', shade: '#BD8461' },
  { skin: '#C98B63', shade: '#AD704A' },
  { skin: '#A86F4C', shade: '#8C5636' },
  { skin: '#7C4F34', shade: '#633B24' },
];
export const HAIR_COLORS = ['#17110E', '#3B2A20', '#6B4423', '#A0522D', '#C9A27E', '#9AA0AE'];
export const HIJAB_COLORS = ['#34C79A', '#2F3A66', '#FF8A65', '#4C7DFF', '#E9DCC9', '#B9A3E3'];
export const TOPS = [
  { top: '#4C7DFF', shirt: '#2F5BDB', tint: '#E6ECFF' },
  { top: '#FF8A65', shirt: '#FFF4E6', tint: '#FFE7DE' },
  { top: '#34C79A', shirt: '#23A27C', tint: '#D9F5EB' },
  { top: '#FFC83D', shirt: '#E0A100', tint: '#FFF3CF' },
  { top: '#2F3A66', shirt: '#FFFFFF', tint: '#E6E8F2' },
  { top: '#B9A3E3', shirt: '#8F78C4', tint: '#EEE8FB' },
];

export const HAIR_STYLES: { id: HairStyle; label: string }[] = [
  { id: 'short', label: 'Short' },
  { id: 'sidepart', label: 'Side part' },
  { id: 'curly', label: 'Curly' },
  { id: 'long', label: 'Long' },
  { id: 'bun', label: 'Bun' },
  { id: 'cropped', label: 'Cropped' },
  { id: 'hijab', label: 'Hijab' },
];

const HAIR_PARTS: Record<HairStyle, string[]> = {
  short: ['cap'],
  sidepart: ['sidepart'],
  curly: ['curls'],
  long: ['long', 'sweep'],
  bun: ['bun', 'fringe'],
  cropped: ['buzz'],
  hijab: ['hijab'],
};

export const DEFAULT_AVATAR: AvatarSpec = {
  skin: 2, hair: 'sidepart', hairColor: 0, hijabColor: 1, top: 2, glasses: false, earrings: false, facial: 'none',
};

/** Ready-made looks, used for "Surprise me" and to convert the earlier fixed avatars. */
const PRESETS: Record<string, AvatarSpec> = {
  'learner-1': DEFAULT_AVATAR,
  'learner-2': { skin: 0, hair: 'long', hairColor: 2, hijabColor: 0, top: 1, glasses: false, earrings: true, facial: 'none' },
  'learner-3': { skin: 3, hair: 'hijab', hairColor: 0, hijabColor: 1, top: 3, glasses: true, earrings: false, facial: 'none' },
  'learner-4': { skin: 4, hair: 'cropped', hairColor: 0, hijabColor: 0, top: 0, glasses: true, earrings: false, facial: 'stubble' },
};

export type Look = Pick<
  CastMember,
  'tint' | 'skin' | 'shade' | 'hair' | 'brow' | 'beard' | 'top' | 'lapel' | 'shirt' | 'hijab' | 'string' | 'features'
> & { strap?: string; blink: number };

/** Turn a learner's choices into the parts the Character drawing understands. */
export function buildLook(a: AvatarSpec): Look {
  const skin = SKINS[a.skin] ?? SKINS[2];
  const hair = HAIR_COLORS[a.hairColor] ?? HAIR_COLORS[0];
  const top = TOPS[a.top] ?? TOPS[0];
  const hijab = a.hair === 'hijab';
  const features = [...HAIR_PARTS[a.hair], 'shirt'];
  if (!hijab) features.push('neck');
  if (a.glasses) features.push('glasses');
  if (a.earrings && !hijab) features.push('earrings');
  if (a.facial === 'stubble') features.push('stubble');
  if (a.facial === 'beard') features.push('beard');
  return {
    tint: top.tint, skin: skin.skin, shade: skin.shade,
    hair, brow: hijab ? '#3A2A22' : hair, beard: hijab ? '#3A2A22' : hair,
    top: top.top, shirt: top.shirt, lapel: '#000', string: '#000',
    hijab: HIJAB_COLORS[a.hijabColor] ?? HIJAB_COLORS[0],
    features, blink: 1,
  };
}

/** A random but tasteful look for "Surprise me". */
export function randomAvatar(): AvatarSpec {
  const pick = <T,>(n: number) => Math.floor(Math.random() * n) as T;
  const hair = HAIR_STYLES[pick<number>(HAIR_STYLES.length)].id;
  return {
    skin: pick(SKINS.length),
    hair,
    hairColor: pick(HAIR_COLORS.length - 1), // grey is a deliberate choice, not a surprise
    hijabColor: pick(HIJAB_COLORS.length),
    top: pick(TOPS.length),
    glasses: Math.random() < 0.3,
    earrings: hair !== 'hijab' && Math.random() < 0.3,
    facial: hair === 'hijab' || hair === 'long' || hair === 'bun' ? 'none' : (['none', 'none', 'stubble', 'beard'] as Facial[])[pick<number>(4)],
  };
}

export function isAvatarSpec(v: unknown): v is AvatarSpec {
  const a = v as AvatarSpec;
  return !!a && typeof a === 'object' && HAIR_STYLES.some((h) => h.id === a.hair) && typeof a.skin === 'number';
}

/** Accept a saved avatar in any format (including the earlier fixed avatars) and return a spec. */
export function toAvatarSpec(v: unknown): AvatarSpec {
  if (isAvatarSpec(v)) return { ...DEFAULT_AVATAR, ...v };
  if (typeof v === 'string' && PRESETS[v]) return PRESETS[v];
  return DEFAULT_AVATAR;
}

/** Anything the Character component can draw: a story character, or a learner's avatar. */
export type LookSource = CastId | AvatarSpec;

export function getLook(src: LookSource): Look {
  if (typeof src === 'string') {
    const c = CAST[src];
    // a story character; any other string (e.g. an older saved avatar id) becomes a learner look
    return c ? { ...c, blink: c.voice.index } : buildLook(toAvatarSpec(src));
  }
  return buildLook(toAvatarSpec(src));
}
