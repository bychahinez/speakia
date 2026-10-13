# Speakia mobile design

Design source of truth. Read before any UI change; refresh it when a decision changes.

## App read

Story-driven English speaking practice for Algerian university students: watch a scene, pick a
role, speak with an AI character. Playful, illustrated, branded (Duolingo-adjacent) but calm,
because the audience is adult students, not kids.

- Platforms: iOS and Android first-class, web best-effort.
- Posture: unified brand, native navigation chrome (stack transitions, tab bar from Expo Router).
- Offline: N/A for progress (local-first, AsyncStorage); voice/AI needs the server, demo mode without it.

## Dials

| Dial | Value | Why |
|---|---|---|
| DESIGN_EXPRESSION | 7 | Illustrated story world is the product; chrome stays native |
| MOTION_INTENSITY | 5 | Press springs, current-stop pulse, entrance stagger; all off under reduced motion |
| VISUAL_DENSITY | 3 | One idea per screen, generous targets |

## Commitments

- Tokens live in `src/theme.ts` (`C` colours, `F` fonts, `shadow`). No hex in screen files.
- Fonts: Bricolage Grotesque (display) + Plus Jakarta Sans (body).
- One bold element per screen. On the Map it is the road of illustrated stops; the season header
  and the bottom dock stay quiet.
- Map stops: faded circle (`STOP_TINT`) with a colourful icon on top (`StopIcon`). Status is never
  colour alone: done = mint ring + check + stars, current = blue ring + START + pulse + avatar,
  locked = grey + lock + "Locked", coming soon = yellow ring + "Coming soon".
- Animations use the native driver; `AccessibilityInfo.isReduceMotionEnabled` turns decorative motion off.

## Known gaps (app-wide, not yet addressed)

- Icons are hand-drawn SVG paths (`src/components/Icon.tsx`) rather than one icon library.
- No dark mode.
- No max content width on web.
