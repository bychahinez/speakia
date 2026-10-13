import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Character from '../../../src/components/Character';
import Place from '../../../src/components/Place';
import { BackButton } from '../../../src/components/BackButton';
import { Button, Chip, Label } from '../../../src/components/ui';
import { CAST } from '../../../src/content/cast';
import { getEpisode, personalise } from '../../../src/content/episodes';
import { useLearnerName } from '../../../src/useLearnerName';
import { prepareLines, say, stopSpeaking } from '../../../src/voice';
import { C, F } from '../../../src/theme';

/** Screen 12 · Watch the original scene. Lines play one by one with subtitles; the speaker talks. */
export default function Watch() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ep = getEpisode(id)!;
  const { width } = useWindowDimensions();
  const name = useLearnerName();
  const scene = ep.scene.map((l) => ({ ...l, text: personalise(l.text, name ?? '') }));
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [talking, setTalking] = useState(false);
  const [ended, setEnded] = useState(false);
  const [subs, setSubs] = useState(true);
  const [slow, setSlow] = useState(false);
  const [run, setRun] = useState(0); // bumps to restart playback on Replay
  const alive = useRef(true);

  const people = Array.from(new Set(ep.scene.map((l) => l.who)));
  const line = scene[Math.min(index, scene.length - 1)];

  // Each spoken line gets a token; callbacks from a stopped/old line are ignored.
  const token = useRef(0);

  // play the current line whenever index/playing changes
  useEffect(() => {
    if (!playing || ended || name === null) return;
    const l = scene[index];
    const mine = ++token.current;
    const current = () => alive.current && mine === token.current;
    say(
      l.who,
      l.text,
      {
        onStart: () => current() && setTalking(true),
        onDone: () => {
          if (!current()) return;
          setTalking(false);
          setTimeout(() => {
            if (!current()) return;
            if (index + 1 >= ep.scene.length) {
              setEnded(true);
              setPlaying(false);
            } else setIndex((i) => i + 1);
          }, 350);
        },
      },
      slow
    );
    return () => {
      token.current++;
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, playing, run, name]);

  useEffect(() => () => {
    alive.current = false;
    stopSpeaking();
  }, []);

  // slow speed is a different recording: get the remaining lines ready as soon as it is chosen
  useEffect(() => {
    if (slow && name !== null) prepareLines(scene.slice(index), true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slow, name]);

  const togglePause = () => {
    if (playing) {
      token.current++;
      stopSpeaking();
      setPlaying(false);
      setTalking(false);
    } else setPlaying(true);
  };

  const replay = () => {
    token.current++;
    stopSpeaking();
    setTalking(false);
    setEnded(false);
    setIndex(0);
    setPlaying(true);
    setRun((r) => r + 1);
  };

  return (
    <View style={s.fill}>
      <View style={{ flex: 1 }}>
        <Place place={ep.place} width={width} height={520} />
        <SafeAreaView edges={['top']} style={s.top}>
          <BackButton />
          <View style={s.progress}>
            {ep.scene.map((_, i) => (
              <View key={i} style={[s.seg, { backgroundColor: i <= index ? C.sky : C.skyTint }]} />
            ))}
          </View>
        </SafeAreaView>

        {subs && (
          <View style={[s.bubble, line.who === people[0] ? { left: 18, borderBottomLeftRadius: 6 } : { right: 18, borderBottomRightRadius: 6 }]}>
            <Text style={[s.who, { color: CAST[line.who].dot === C.sun ? '#B98300' : CAST[line.who].dot }]}>
              {CAST[line.who].shortName.toUpperCase()}
            </Text>
            <Text style={s.line}>{line.text}</Text>
          </View>
        )}

        <View style={s.cast}>
          {people.map((p) => {
            const active = line.who === p && !ended;
            return (
              <View key={p} style={{ opacity: active || ended ? 1 : 0.75, transform: [{ scale: active ? 1.04 : 1 }] }}>
                <Character who={p} size={160} talking={active && talking} />
              </View>
            );
          })}
        </View>
      </View>

      <SafeAreaView edges={['bottom']} style={s.panel}>
        <Label>{`Scene · ${Math.min(index + 1, ep.scene.length)} of ${ep.scene.length}`}</Label>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Chip label={playing ? 'Pause' : ended ? 'Ended' : 'Play'} onPress={ended ? undefined : togglePause} />
          <Chip label="Replay" onPress={replay} />
          <Chip label={`Subtitles: ${subs ? 'on' : 'off'}`} selected={subs} onPress={() => setSubs(!subs)} tint={C.skyTint} />
          <Chip label={slow ? 'Speed: slow' : 'Speed: normal'} selected={slow} onPress={() => setSlow(!slow)} tint={C.sunTint} />
        </View>
        <Button
          label={ended ? 'Step into the story' : 'Listen until the end…'}
          disabled={!ended}
          onPress={() => router.push({ pathname: '/episode/[id]/role', params: { id: ep.id } })}
        />
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: C.cream },
  top: { position: 'absolute', top: 0, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  progress: { flex: 1, flexDirection: 'row', gap: 4, backgroundColor: C.white, borderRadius: 999, padding: 6, marginTop: 8 },
  seg: { flex: 1, height: 8, borderRadius: 4 },
  bubble: { position: 'absolute', top: 130, maxWidth: '78%', backgroundColor: C.white, borderRadius: 20, padding: 14, shadowColor: '#1E2440', shadowOpacity: 0.15, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  who: { fontFamily: F.heavy, fontSize: 11, marginBottom: 3 },
  line: { fontFamily: F.semi, fontSize: 16, lineHeight: 23, color: C.navy },
  cast: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around' },
  panel: { backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 12, marginTop: -20 },
});
