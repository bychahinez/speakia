import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Character from '../../src/components/Character';
import { Heading, Screen, TopBar, k } from '../../src/components/kit';
import { Button } from '../../src/components/ui';
import { draft, finishOnboarding } from '../../src/draft';
import { LEVELS, Level, updateProfile } from '../../src/storage';
import { C, F, shadow } from '../../src/theme';

/** Screen 08 · Level result (from the test) or level welcome (manual choice). */
export default function LevelResult() {
  const p = useLocalSearchParams<{ level?: Level; manual?: string; low?: string; edit?: string }>();
  const manual = !!p.manual;
  const low = !!p.low;
  const level = (manual ? draft.level : p.level) ?? 'B1';
  const info = LEVELS.find((l) => l.id === level)!;

  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 70, delay: 150, useNativeDriver: true }).start();
  }, [pop]);

  const start = async () => {
    if (p.edit) {
      await updateProfile({ level, levelSource: 'test' });
      router.dismissAll(); // back to the tabs, where Me is open
    } else {
      finishOnboarding();
    }
  };

  if (low) {
    return (
      <Screen
        top={<TopBar />}
        footer={
          <>
            <Button label="Retry the test" onPress={() => router.replace(p.edit ? '/onboarding/test?edit=1' : '/onboarding/test')} />
            <Button label="Choose my level" variant="secondary" onPress={() => router.replace(p.edit ? '/onboarding/level?edit=1' : '/onboarding/level')} />
          </>
        }
      >
        <View style={{ alignItems: 'center', marginTop: 12 }}><Character who="sara" size={150} /></View>
        <Heading title="We need a little more speech" sub="Your answers were too short for us to estimate a level. Try again and say a bit more each time, or choose your level yourself." />
      </Screen>
    );
  }

  return (
    <Screen
      top={<TopBar />}
      footer={<Button label={p.edit ? 'Save my new level' : 'Start my journey'} onPress={start} />}
    >
      <Heading
        title={manual ? `Welcome to ${level}` : 'Your Speakia level'}
        sub={manual ? 'Selected level' : 'Estimated speaking level'}
      />
      <Animated.View
        style={[s.card, shadow, { opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }] }]}
      >
        <View style={s.badge}>
          <Text style={s.level}>{level}</Text>
        </View>
        <Text style={s.ribbon}>{info.name}</Text>
        <Text style={s.about}>{info.about}</Text>
      </Animated.View>
      <View style={s.cast}>
        <Character who="yacine" size={96} happy />
        <Character who="sara" size={96} happy />
      </View>
      <Text style={[k.title, { fontSize: 22, lineHeight: 28 }]}>Your journey starts here.</Text>
      {!manual && <Text style={k.tileSub as object}>This is a practice estimate, not an official CEFR certification. You can change it anytime in Me.</Text>}
    </Screen>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.white, borderRadius: 28, padding: 24, alignItems: 'center', gap: 10, marginTop: 8 },
  badge: { width: 128, height: 128, borderRadius: 64, borderWidth: 8, borderColor: C.skyTint, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  level: { fontFamily: F.display, fontSize: 52, color: C.skyInk, letterSpacing: -1 },
  ribbon: { fontFamily: F.heavy, fontSize: 16, color: C.navy, backgroundColor: C.sun, paddingHorizontal: 22, paddingVertical: 8, borderRadius: 12, overflow: 'hidden', marginTop: -26 },
  about: { fontFamily: F.semi, fontSize: 15, lineHeight: 22, color: C.muted, textAlign: 'center' },
  cast: { flexDirection: 'row', justifyContent: 'center', gap: 24 },
});
