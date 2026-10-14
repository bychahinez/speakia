import { useEffect, useRef } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Character from '../../../src/components/Character';
import { Button, Card, Label, Title } from '../../../src/components/ui';
import { CAST, CastId } from '../../../src/content/cast';
import { EPISODES, getEpisode } from '../../../src/content/episodes';
import { addAttempt } from '../../../src/storage';
import { C, F } from '../../../src/theme';

/** Screen 15 · Result: stars (= independence), real numbers, one thing to say better. */
export default function Result() {
  const p = useLocalSearchParams<{
    id: string; player: CastId; partner: CastId; hints: string; words: string; turns: string; ms: string;
    spoken?: string; convinced?: string; last?: string; corrections: string;
  }>();
  const ep = getEpisode(p.id)!;
  const hints = Number(p.hints ?? 0);
  const words = Number(p.words ?? 0);
  const turns = Math.max(1, Number(p.turns ?? 1));
  const ms = Number(p.ms ?? 0);
  const stars = hints === 0 ? 3 : hints <= 2 ? 2 : 1;
  const label = stars === 3 ? 'Independent' : stars === 2 ? 'Assisted' : 'Guided';
  let corrections: { said: string; better: string }[] = [];
  try {
    corrections = JSON.parse(p.corrections ?? '[]');
  } catch {}

  const saved = useRef(false);
  useEffect(() => {
    if (saved.current) return; // save once, even if the screen re-renders
    saved.current = true;
    addAttempt({ episodeId: ep.id, role: CAST[p.player].shortName, stars, hints, words, turns, speakingMs: ms, finishedAt: Date.now() });
  }, [ep.id, p.player, stars, hints, words, turns, ms]);

  const next = EPISODES.find((e) => e.level === ep.level + 1);
  const sec = Math.round(ms / 1000);
  const partnerName = CAST[p.partner].shortName;
  const convinced = p.convinced !== '0'; // older links without the flag count as convinced
  const typedTurns = Math.max(0, turns - Number(p.spoken ?? turns));
  const tips = nextSteps({ stars, hints, convinced, typedTurns, turns, wordsPerTurn: words / turns, partnerName });

  return (
    <SafeAreaView style={s.fill}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={{ alignItems: 'center', gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
            {[0, 1, 2].map((i) => (
              <PopStar key={i} on={i < stars} big={i === 1} delay={250 + i * 300} />
            ))}
          </View>
          <Label>{`Level ${ep.level} complete · ${label}`}</Label>
          <Title style={{ textAlign: 'center' }}>{convinced ? `You convinced ${partnerName}.` : 'Scene complete.'}</Title>
        </View>

        <View style={s.partnerRow}>
          <Character who={p.partner} size={80} happy />
          <View style={s.bubble}>
            <Text style={[s.who, { color: CAST[p.partner].dot === C.sun ? '#B98300' : C.mintDark }]}>{CAST[p.partner].shortName.toUpperCase()}</Text>
            <Text style={s.bubbleText}>{p.last || (convinced ? 'Okay, deal. Nice arguments!' : 'Let’s talk about it again later.')}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Stat label="Words / turn" value={String(Math.round(words / turns))} tint={C.skyTint} />
          <Stat label="Hints" value={String(hints)} tint={C.peachTint} />
          <Stat label="Spoke for" value={sec ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}` : 'typed'} tint={C.sunTint} />
        </View>

        <Card style={{ gap: 8 }}>
          <Text style={s.cardTitle}>Say it better</Text>
          {corrections.length === 0 ? (
            <Text style={s.better}>No mistakes spotted in your answers.</Text>
          ) : (
            corrections.map((c, i) => (
              <View key={i} style={{ gap: 2 }}>
                <Text style={s.said}>{c.said}</Text>
                <Text style={s.better}>{c.better}</Text>
              </View>
            ))
          )}
        </Card>

        <Card style={{ gap: 6 }}>
          <Text style={s.cardTitle}>Your next step</Text>
          {tips.map((t) => (
            <Text key={t} style={s.tip}>{t}</Text>
          ))}
        </Card>

        {next && (
          <View style={s.unlock}>
            <Text style={s.unlockText}>
              <Text style={{ fontFamily: F.heavy }}>Next: {next.title}. </Text>
              {next.summary}
            </Text>
          </View>
        )}
      </ScrollView>
      <View style={{ paddingHorizontal: 24, paddingBottom: 12, gap: 10 }}>
        <Button label="Continue the story" onPress={() => router.replace('/map')} />
      </View>
    </SafeAreaView>
  );
}

/** Up to two pieces of advice that match what actually happened in this scene. */
function nextSteps(r: {
  stars: number; hints: number; convinced: boolean; typedTurns: number; turns: number; wordsPerTurn: number; partnerName: string;
}): string[] {
  const tips: string[] = [];
  if (r.hints > 0) {
    tips.push(
      `You used ${r.hints} hint${r.hints > 1 ? 's' : ''}. Answer without hints next time to get ${r.stars === 2 ? 'the third star' : 'more stars'}.`
    );
  }
  if (!r.convinced) tips.push(`${r.partnerName} isn’t convinced yet. Give two clear reasons, each with “because”, before the scene ends.`);
  if (r.typedTurns > 0) {
    tips.push(
      r.typedTurns === r.turns
        ? 'You typed every answer. Try saying them out loud next time: that’s what builds your speaking.'
        : `You typed ${r.typedTurns} of your ${r.turns} answers. Try speaking all of them next time.`
    );
  }
  if (r.wordsPerTurn < 8) tips.push(`Your answers were short (about ${Math.round(r.wordsPerTurn)} words). Add a reason or an example to say more.`);
  if (tips.length === 0) {
    tips.push(`Perfect run: no hints, and you convinced ${r.partnerName}. Replay from the other side of the debate, or go on to the next episode.`);
  }
  return tips.slice(0, 2);
}

function PopStar({ on, big, delay }: { on: boolean; big: boolean; delay: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 600, delay, easing: Easing.out(Easing.back(2)), useNativeDriver: true }).start();
  }, [v, delay]);
  return (
    <Animated.Text style={{ fontSize: big ? 64 : 46, color: on ? C.sun : '#EDE5D6', transform: [{ scale: v }] }}>★</Animated.Text>
  );
}

function Stat({ label, value, tint }: { label: string; value: string; tint: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: tint, borderRadius: 18, padding: 12 }}>
      <Text style={{ fontFamily: F.bold, fontSize: 11, color: '#3D4466' }}>{label}</Text>
      <Text style={{ fontFamily: F.display, fontSize: 24, color: C.navy }}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: C.cream },
  content: { padding: 24, gap: 16 },
  partnerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  bubble: { flex: 1, backgroundColor: C.white, borderRadius: 18, borderBottomLeftRadius: 6, padding: 12 },
  who: { fontFamily: F.heavy, fontSize: 11 },
  bubbleText: { fontFamily: F.semi, fontSize: 14, color: C.navy },
  cardTitle: { fontFamily: F.display, fontSize: 18, color: C.navy },
  said: { fontFamily: F.semi, fontSize: 14, color: C.muted, textDecorationLine: 'line-through' },
  better: { fontFamily: F.bold, fontSize: 15, color: C.navy, lineHeight: 21 },
  tip: { fontFamily: F.semi, fontSize: 14, color: C.navy, lineHeight: 20 },
  unlock: { backgroundColor: C.mintTint, borderRadius: 18, padding: 14 },
  unlockText: { fontFamily: F.body, fontSize: 13, color: C.navy, lineHeight: 19 },
});
