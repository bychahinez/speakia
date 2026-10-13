import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { C } from '../theme';

// Line icons on a 24×24 grid. Each entry is a list of path strings.
const PATHS = {
  mail: ['M3 6h18v12H3z', 'M3 7l9 6 9-6'],
  lock: ['M6 11h12v9H6z', 'M9 11V8a3 3 0 0 1 6 0v3'],
  eye: ['M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z'],
  eyeOff: ['M3 3l18 18', 'M10.6 6.1A10 10 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3 3.6M6.4 7.6C3.7 9.4 2 12 2 12s3.5 6 10 6a9.6 9.6 0 0 0 4.2-1'],
  back: ['M15 5l-7 7 7 7'],
  close: ['M6 6l12 12M18 6L6 18'],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  chevron: ['M9 5l7 7-7 7'],
  mic: ['M9 3h6v11a3 3 0 0 1-6 0z', 'M5 11a7 7 0 0 0 14 0M12 18v3'],
  user: ['M4 21a8 8 0 0 1 16 0'],
  school: ['M2 9l10-5 10 5-10 5z', 'M6 11v5c3 2 9 2 12 0v-5'],
  calendar: ['M4 6h16v14H4z', 'M4 10h16M8 3v5M16 3v5'],
  plus: ['M12 5v14M5 12h14'],
  laptop: ['M5 5h14v10H5z', 'M2 19h20'],
  gear: ['M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z', 'M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1'],
  health: ['M6 3v6a6 6 0 0 0 12 0V3', 'M12 15v2a4 4 0 0 0 8 0v-3'],
  chart: ['M5 20v-6M12 20V8M19 20V4'],
  flask: ['M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3', 'M7 15h10'],
  globe: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18'],
  law: ['M12 3v18M7 21h10M4 7h16', 'M4 7l-2 6a3 3 0 0 0 4 0zM20 7l-2 6a3 3 0 0 0 4 0z'],
  palette: ['M12 3a9 9 0 0 0 0 18c1.5 0 2-1 2-2s-1-2 0-3 2 0 3 0a4 4 0 0 0 4-4c0-5-4-9-9-9z'],
  people: ['M2 20a6 6 0 0 1 12 0M14 20a5 5 0 0 1 8 0'],
  more: ['M5 12h.01M12 12h.01M19 12h.01'],
  bulb: ['M9 18h6M10 21h4', 'M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z'],
  logout: ['M10 4H5v16h5', 'M15 8l4 4-4 4M19 12H9'],
  shield: ['M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z'],
  help: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7M12 17h.01'],
  target: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'],
  edit: ['M4 20h4L19 9l-4-4L4 16z', 'M13 7l4 4'],
  sparkle: ['M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z'],
  replay: ['M4 12a8 8 0 1 0 2.3-5.7', 'M4 4v5h5'],
  stop: [],
  wifi: ['M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01'],
  trash: ['M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3'],
  star: [],
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 22, color = C.navy, stroke = 2.2 }: { name: IconName; size?: number; color?: string; stroke?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name].map((d) => <Path key={d} d={d} />)}
      {name === 'user' && <Circle cx={12} cy={8} r={4} />}
      {name === 'people' && <><Circle cx={8} cy={8} r={3.5} /><Circle cx={18} cy={9} r={2.8} /></>}
      {name === 'eye' && <Circle cx={12} cy={12} r={3} />}
      {name === 'stop' && <Rect x={6} y={6} width={12} height={12} rx={2} fill={color} stroke="none" />}
      {name === 'star' && <Path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.4 6.5 20.3l1-6.2L3 9.7l6.2-.9z" fill={color} stroke="none" />}
    </Svg>
  );
}
