import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Easing, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View, useWindowDimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';
import {
  AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState,
} from 'expo-audio';
import Character from '../../../src/components/Character';
import Place from '../../../src/components/Place';
import { BackButton } from '../../../src/components/BackButton';
import { CAST } from '../../../src/content/cast';
import { getEpisode, guideRole, Hints, personalise } from '../../../src/content/episodes';
import { ChatLine, isDemo, nextTurn, transcribe, TurnResult } from '../../../src/api';
import { getProfile, Level } from '../../../src/storage';
import { say, stopSpeaking } from '../../../src/voice';
import { C, F } from '../../../src/theme';
import { Dialog } from '../../../src/dialog';

type Phase = 'partner' | 'you' | 'recording' | 'thinking';
const MAX_MS = 45_000;       // auto-stop a recording at 45 s
const FREEZE_MS = 6_000;     // offer a hint after 6 s of silence

/** Screen 14 · Interactive speaking: the core of Speakia. */
export default function Speak() {
  const { id, role: roleParam } = useLocalSearchParams<{ id: string; role: string }>();
  const ep = getEpisode(id)!;
  const guide = ep.guide;
  const role = guide ? guideRole(guide) : ep.roles[Number(roleParam ?? 0)];
  const partner = CAST[role.partner];
  const player = role.player ? CAST[role.player] : null;
  const { width } = useWindowDimensions();

  const [history, setHistory] = useState<ChatLine[]>([]);
  const [phase, setPhase] = useState<Phase>('partner');
  const [talking, setTalking] = useState(false);
  const [hints, setHints] = useState<Hints>(role.firstHints);
  const [hintLevel, setHintLevel] = useState(0);
  const [offerHint, setOfferHint] = useState(false);
  const [bridge, setBridge] = useState<TurnResult['bridgeWords']>([]);
  const [typing, setTyping] = useState(isDemo);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<{ level: Level; major: string; name: string }>({ level: 'B1', major: 'Computer Science / IT', name: '' });

  const stats = useRef({ hints: 0, words: 0, turns: 0, spokenTurns: 0, speakingMs: 0, corrections: [] as TurnResult['corrections'] });
  const alive = useRef(true);
  const recStart = useRef(0);
  const scroll = useRef<ScrollView>(null);

  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const recState = useAudioRecorderState(recorder, 250);

  // ---- partner speaks: a live reaction first (AI), then the scripted line (voiced in advance) ----
  const speakParts = (parts: { text: string; live?: boolean }[], after: () => void) => {
    const queue = parts.filter((p) => p.text.trim());
    const next = () => {
      const part = queue.shift();
      if (!part) return after();
      speakPartner(part.text, next, part.live);
    };
    next();
  };

  // ---- partner speaks ----
  // `live`: AI replies are new text, so they play while the audio is still arriving
  const speakPartner = (text: string, after: () => void, live = false) => {
    setPhase('partner');
    say(role.partner, text, {
      onStart: () => alive.current && setTalking(true),
      onDone: () => {
        if (!alive.current) return;
        setTalking(false);
        after();
      },
    }, false, live);
  };

  useEffect(() => {
    getProfile().then((p) => {
      if (!alive.current) return;
      if (p) setProfile({ level: p.level, major: p.major, name: p.name });
      const opening = personalise(role.opening, p?.name);
      setHistory([{ from: 'partner', text: opening }]);
      speakPartner(opening, () => setPhase('you'));
    });
    return () => {
      alive.current = false;
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- freeze rescue: offer a hint after 6 s of silence on your turn ----
  useEffect(() => {
    if (phase !== 'you') return;
    const t = setTimeout(() => setOfferHint(true), FREEZE_MS);
    return () => clearTimeout(t);
  }, [phase]);

  // ---- auto-stop at 45 s ----
  useEffect(() => {
    if (phase === 'recording' && (recState.durationMillis ?? 0) >= MAX_MS) stopRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recState.durationMillis, phase]);

  useEffect(() => {
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
  }, [history.length]);

  // ---- recording ----
  const startRecording = async () => {
    setError('');
    if (isDemo) {
      setTyping(true);
      setError('Voice needs the server. In demo mode, type your answer.');
      return;
    }
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        setTyping(true);
        setError('Microphone is off. You can type instead, or allow the microphone in Settings.');
        return;
      }
      stopSpeaking();
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      recStart.current = Date.now();
      setOfferHint(false);
      setPhase('recording');
    } catch (e) {
      setError('Could not start the microphone. Try again or type.');
    }
  };

  const stopRecording = async () => {
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      const ms = Date.now() - recStart.current;
      const uri = recorder.uri;
      setPhase('thinking');
      if (!uri) throw new Error('no audio');
      const text = await transcribe(uri);
      if (!text) {
        setError('We didn’t catch that. Try again, or type.');
        setPhase('you');
        return;
      }
      await answer(text, ms);
    } catch (e) {
      const why = e instanceof Error ? e.message : String(e);
      console.warn('[speakia] recording failed:', why);
      setError(
        why.startsWith('Sign in')
          ? 'You’re not signed in, so your answer can’t be heard. Sign in from Me, or type your answer.'
          : 'We couldn’t turn your answer into text. Try again, or type it.'
      );
      setPhase('you');
    }
  };

  // ---- one learner turn ----
  const answer = async (text: string, spokenMs: number) => {
    const turn = stats.current.turns + 1;
    const newHistory: ChatLine[] = [...history, { from: 'you', text }];
    setHistory(newHistory);
    setPhase('thinking');
    setOfferHint(false);
    stats.current.turns = turn;
    stats.current.words += text.split(/\s+/).filter(Boolean).length;
    stats.current.speakingMs += spokenMs;
    if (spokenMs > 0) stats.current.spokenTurns += 1;
    // guided episodes: after answer N the partner says scripted line N
    const line = guide?.lines[Math.min(turn, guide.lines.length - 1)];
    try {
      const r = await nextTurn({ episode: ep, role, level: profile.level, major: profile.major, learnerName: profile.name, history: newHistory, turn, next: line?.say });
      if (!alive.current) return;
      if (guide && line) {
        stats.current.corrections.push(...(r.corrections ?? []));
        setBridge(r.bridgeWords ?? []);
        setHints(line.hints ?? hints);
        setHintLevel(0);
        const reaction = (r.reply || line.react || '').trim();
        const said = reaction ? `${reaction} ${line.say}` : line.say;
        setHistory((h) => [...h, { from: 'partner', text: said }]);
        const last = turn >= guide.lines.length - 1;
        speakParts([{ text: reaction, live: true }, { text: line.say }], () => (last ? finish(true, said) : setPhase('you')));
        return;
      }
      stats.current.corrections.push(...(r.corrections ?? []));
      setBridge(r.bridgeWords ?? []);
      setHints(r.hints ?? hints);
      setHintLevel(0);
      setHistory((h) => [...h, { from: 'partner', text: r.reply }]);
      const finished = r.done || turn >= ep.maxTurns + 2;
      speakPartner(r.reply, () => (finished ? finish(!!r.done, r.reply) : setPhase('you')), true);
    } catch (e) {
      const why = e instanceof Error ? e.message : String(e);
      console.warn('[speakia] AI turn failed:', why);
      setError(
        why.startsWith('Sign in')
          ? 'You’re not signed in, so the characters can’t answer. Your answer is kept: sign in from Me, then come back and send it.'
          : 'The connection dropped. Your answer is kept; try sending it again.'
      );
      setHistory(history); // roll back so the learner can resend
      stats.current.turns = turn - 1;
      setDraft(text);
      setTyping(true);
      setPhase('you');
    }
  };

  const sendTyped = () => {
    const t = draft.trim();
    if (!t || phase !== 'you') return;
    setDraft('');
    answer(t, 0); // typed answers do not count as speaking time
  };

  const nextHint = () => {
    if (hintLevel >= 3) return;
    setHintLevel((l) => l + 1);
    stats.current.hints += 1;
    setOfferHint(true);
  };

  /** `convinced`: the AI judged the learner's goal reached; `lastLine`: the partner's final reply. */
  const finish = (convinced: boolean, lastLine: string) => {
    const st = stats.current;
    router.replace({
      pathname: '/episode/[id]/result',
      params: {
        id: ep.id,
        player: role.player ?? '',
        partner: role.partner,
        guided: guide ? '1' : '0',
        hints: String(st.hints),
        words: String(st.words),
        turns: String(st.turns),
        ms: String(st.speakingMs),
        spoken: String(st.spokenTurns),
        convinced: convinced ? '1' : '0',
        last: lastLine,
        corrections: JSON.stringify(st.corrections.slice(0, 2)),
      },
    });
  };

  const leave = () =>
    Dialog.alert('Leave this level?', 'Your answers in this level will not be saved.', [
      { text: 'Keep playing', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => router.back() },
    ]);

  const lastPartner = [...history].reverse().find((l) => l.from === 'partner')?.text ?? '';
  const seconds = Math.floor((recState.durationMillis ?? 0) / 1000);
  const status =
    phase === 'partner' ? `${partner.shortName} is speaking…`
    : phase === 'recording' ? `Listening… 0:${String(seconds).padStart(2, '0')} / 0:45`
    : phase === 'thinking' ? `${partner.shortName} is thinking…`
    : 'Your turn';

  return (
    <View style={s.fill}>
      {/* stage */}
      <View style={{ height: 300 }}>
        <Place place={ep.place} width={width} height={300} />
        <SafeAreaView edges={['top']} style={s.top}>
          <BackButton close onPress={leave} />
          <View style={s.progress}>
            {Array.from({ length: ep.maxTurns }).map((_, i) => (
              <View key={i} style={[s.seg, { backgroundColor: i < stats.current.turns ? C.mint : C.skyTint }]} />
            ))}
          </View>
        </SafeAreaView>
        <View style={s.partner}>
          <Character who={role.partner} size={170} talking={talking} />
        </View>
        <View style={s.partnerBubble}>
          <Text style={[s.who, { color: partner.dot === C.sun ? '#B98300' : C.mintDark }]}>{partner.shortName.toUpperCase()}</Text>
          <Text style={s.bubbleText}>{lastPartner}</Text>
        </View>
      </View>

      {/* 'padding' on both platforms: Android is edge-to-edge, so the window no longer resizes for the keyboard */}
      <KeyboardAvoidingView style={s.sheet} behavior="padding">
        <View style={s.mission}>
          <Text style={s.missionText}>
            {player && <Text style={{ fontFamily: F.heavy }}>You’re on {player.shortName}’s side. </Text>}
            {role.mission}
          </Text>
        </View>

        <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
          {history.map((l, i) =>
            l.from === 'you' ? (
              <View key={i} style={[s.msg, s.mine]}>
                <Text style={s.msgWho}>YOU</Text>
                <Text style={s.msgText}>{l.text}</Text>
              </View>
            ) : i === 0 ? null : (
              <View key={i} style={[s.msg, s.theirs]}>
                <Text style={[s.msgWho, { color: C.muted }]}>{partner.shortName.toUpperCase()}</Text>
                <Text style={s.msgText}>{l.text}</Text>
              </View>
            )
          )}
          {bridge.map((b) => (
            <Text key={b.from} style={s.bridge}>
              {b.from} → <Text style={{ textDecorationLine: 'underline' }}>{b.to}</Text> · keep going!
            </Text>
          ))}
        </ScrollView>

        {(offerHint || hintLevel > 0) && phase === 'you' && (
          <View style={s.hintCard}>
            <Text style={s.hintTitle}>{hintLevel === 0 ? 'Take your time. Need an idea?' : 'Hint'}</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(['1 · Idea', '2 · Starter', '3 · Example'] as const).map((label, i) => (
                <Pressable
                  key={label}
                  onPress={() => i + 1 > hintLevel && nextHint()}
                  style={[s.ladder, { backgroundColor: i < hintLevel ? C.peach : C.peachTint }]}
                  accessibilityRole="button"
                >
                  <Text style={s.ladderText}>{label}</Text>
                </Pressable>
              ))}
            </View>
            {hintLevel > 0 && (
              <Text style={s.hintText}>{hintLevel === 1 ? hints.idea : hintLevel === 2 ? hints.starter : hints.example}</Text>
            )}
          </View>
        )}

        {!!error && <Text style={s.error}>{error}</Text>}

        {typing && (
          <View style={s.typeRow}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Type your answer in English"
              placeholderTextColor="#9AA0BC"
              style={s.input}
              editable={phase === 'you'}
              onSubmitEditing={sendTyped}
              returnKeyType="send"
              accessibilityLabel="Type your answer"
            />
            <Pressable onPress={sendTyped} style={s.send} accessibilityRole="button" accessibilityLabel="Send">
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M5 12h14M13 6l6 6-6 6" />
              </Svg>
            </Pressable>
          </View>
        )}

        <SafeAreaView edges={['bottom']} style={s.controls}>
          <Pressable onPress={() => setTyping((t) => !t)} style={s.side} accessibilityRole="button" accessibilityLabel="Type instead">
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth={2} strokeLinecap="round">
              <Rect x={3} y={6} width={18} height={12} rx={2} />
              <Path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10" />
            </Svg>
          </Pressable>
          <View style={{ alignItems: 'center', gap: 8 }}>
            <MicButton
              phase={phase}
              onPress={phase === 'recording' ? stopRecording : phase === 'you' ? startRecording : undefined}
            />
            <Text style={s.status}>{status}</Text>
          </View>
          <Pressable onPress={nextHint} disabled={phase !== 'you'} style={[s.side, { backgroundColor: C.peachTint, borderColor: C.peachTint }]} accessibilityRole="button" accessibilityLabel="Next hint">
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M9 18h6M10 21h4" />
              <Path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />
            </Svg>
          </Pressable>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

function MicButton({ phase, onPress }: { phase: Phase; onPress?: () => void }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const active = phase === 'you' || phase === 'recording';
  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: phase === 'recording' ? 900 : 1600, easing: Easing.out(Easing.ease), useNativeDriver: true }));
    loop.start();
    return () => {
      loop.stop();
      pulse.setValue(0);
    };
  }, [active, phase, pulse]);

  const bg = phase === 'recording' ? C.peach : active ? C.skyInk : '#AEB6D8';
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole="button" accessibilityLabel={phase === 'recording' ? 'Stop recording' : 'Start speaking'}>
      <View style={{ width: 84, height: 84 }}>
        {active && (
          <Animated.View
            style={{
              position: 'absolute', width: 84, height: 84, borderRadius: 42, backgroundColor: bg,
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }],
            }}
          />
        )}
        <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
          {phase === 'thinking' ? (
            <ActivityIndicator color="#fff" />
          ) : phase === 'recording' ? (
            <View style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: '#fff' }} />
          ) : (
            <Svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <Rect x={9} y={3} width={6} height={11} rx={3} />
              <Path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
            </Svg>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: C.cream },
  top: { position: 'absolute', top: 0, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  progress: { flex: 1, flexDirection: 'row', gap: 4, backgroundColor: C.white, borderRadius: 999, padding: 6, marginTop: 8 },
  seg: { flex: 1, height: 8, borderRadius: 4 },
  partner: { position: 'absolute', left: 4, bottom: 6 },
  partnerBubble: {
    position: 'absolute', left: 170, right: 16, top: 112, backgroundColor: C.white, borderRadius: 20, borderBottomLeftRadius: 6, padding: 12,
    shadowColor: '#1E2440', shadowOpacity: 0.15, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 4,
  },
  who: { fontFamily: F.heavy, fontSize: 11, marginBottom: 2 },
  bubbleText: { fontFamily: F.semi, fontSize: 15, lineHeight: 21, color: C.navy },
  sheet: { flex: 1, backgroundColor: C.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -24, paddingHorizontal: 18, paddingTop: 16 },
  mission: { backgroundColor: C.cream, borderRadius: 14, padding: 10, borderWidth: 1.5, borderColor: C.line },
  missionText: { fontFamily: F.body, fontSize: 13, color: C.navy },
  msg: { maxWidth: '86%', borderRadius: 18, padding: 10 },
  mine: { alignSelf: 'flex-end', backgroundColor: C.skyTint, borderBottomRightRadius: 6 },
  theirs: { alignSelf: 'flex-start', backgroundColor: C.cream, borderBottomLeftRadius: 6 },
  msgWho: { fontFamily: F.heavy, fontSize: 10, color: C.skyInk, marginBottom: 2 },
  msgText: { fontFamily: F.semi, fontSize: 14, lineHeight: 20, color: C.navy },
  bridge: { alignSelf: 'flex-end', fontFamily: F.heavy, fontSize: 13, color: C.navy, backgroundColor: C.sunTint, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, overflow: 'hidden' },
  hintCard: { backgroundColor: '#FFF6F2', borderRadius: 20, padding: 12, gap: 8, marginBottom: 6 },
  hintTitle: { fontFamily: F.heavy, fontSize: 14, color: C.navy },
  ladder: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  ladderText: { fontFamily: F.heavy, fontSize: 12, color: C.navy },
  hintText: { fontFamily: F.semi, fontSize: 14, lineHeight: 20, color: C.navy },
  error: { fontFamily: F.bold, fontSize: 13, color: '#B4372A', marginBottom: 6 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  input: { flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 2, borderColor: C.skyTint, paddingHorizontal: 14, fontFamily: F.semi, fontSize: 15, color: C.navy, backgroundColor: C.white },
  send: { width: 48, height: 48, borderRadius: 14, backgroundColor: C.skyInk, alignItems: 'center', justifyContent: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, paddingBottom: 8, paddingTop: 4 },
  side: { width: 56, height: 56, borderRadius: 18, borderWidth: 2, borderColor: C.skyTint, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  status: { fontFamily: F.heavy, fontSize: 13, color: C.navy },
});
