import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Character from '../src/components/Character';
import Place from '../src/components/Place';
import { Button, Logo } from '../src/components/ui';
import { startRoute } from '../src/storage';
import { C, F } from '../src/theme';

/** Screen 01 · Welcome. Signed-in learners (and returning guests) go straight to the map. */
export default function Welcome() {
  const { width } = useWindowDimensions();
  const [state, setState] = useState<'loading' | 'new' | 'returning' | 'onboarding'>('loading');
  const rise = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startRoute().then((r) => setState(r === 'map' ? 'returning' : r === 'onboarding' ? 'onboarding' : 'new'));
  }, []);
  useEffect(() => {
    if (state === 'new') Animated.timing(rise, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [state, rise]);

  if (state === 'loading') {
    return (
      <View style={[s.fill, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={C.skyInk} />
      </View>
    );
  }
  if (state === 'returning') return <Redirect href="/map" />;
  if (state === 'onboarding') return <Redirect href="/onboarding/avatar" />;

  const fade = (d: number) => ({
    opacity: rise,
    transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [d, 0] }) }],
  });

  return (
    <SafeAreaView style={s.fill}>
      <Animated.View style={[s.brand, fade(-12)]}>
        <Logo size={44} />
        <Text style={s.tag}>Step into the story. Speak.</Text>
      </Animated.View>

      <Animated.View style={[s.stage, fade(20)]}>
        <Place place="gate" width={width - 32} height={300} />
        <View style={s.cast}>
          <Character who="yacine" size={124} />
          <Character who="sara" size={124} />
        </View>
      </Animated.View>

      <Animated.View style={[s.bottom, fade(30)]}>
        <Text style={s.lead}>Your story starts on campus.{'\n'}Your voice moves it forward.</Text>
        <Button label="Get started" onPress={() => router.push('/signup')} />
        <Button label="I already have an account" variant="secondary" onPress={() => router.push('/signin')} />
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: C.cream },
  brand: { alignItems: 'center', gap: 8, paddingTop: 20 },
  tag: { fontFamily: F.display, fontSize: 20, color: C.navy, letterSpacing: -0.3 },
  stage: { marginTop: 20, marginHorizontal: 16, borderRadius: 28, overflow: 'hidden', alignItems: 'center', height: 300 },
  cast: { position: 'absolute', bottom: -8, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 40 },
  bottom: { flex: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16, gap: 12, justifyContent: 'flex-end' },
  lead: { fontFamily: F.semi, fontSize: 16, lineHeight: 24, color: C.muted, textAlign: 'center', marginBottom: 6 },
});
