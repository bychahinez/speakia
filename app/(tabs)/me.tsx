import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../src/components/Character';
import { DEFAULT_AVATAR } from '../../src/content/avatars';
import { MenuRow, Sheet, k } from '../../src/components/kit';
import { Button } from '../../src/components/ui';
import { isDemo } from '../../src/api';
import { Profile, deleteEverything, getAccountEmail, getProfile, levelName, signOut, updateProfile } from '../../src/storage';
import { C, F, shadow } from '../../src/theme';

const GOALS = ['Presentations', 'Group work', 'Internship interviews', 'Social confidence'];

/** Screen 17 · Me. Profile and preferences in one place. */
export default function Me() {
  const [p, setP] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [sheet, setSheet] = useState<'goals' | 'privacy' | 'help' | 'voice' | null>(null);
  const [goals, setGoals] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      getProfile().then((x) => { setP(x); setGoals(x?.goals ?? []); });
      setEmail(getAccountEmail());
    }, [])
  );

  const saveGoals = async () => {
    await updateProfile({ goals });
    setP((x) => (x ? { ...x, goals } : x));
    setSheet(null);
  };

  const logout = () =>
    Alert.alert('Log out?', 'Your progress is saved in your account. Sign in again on any phone to continue.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: async () => { await signOut(); router.replace('/'); } },
    ]);

  const deleteAll = () =>
    Alert.alert('Delete all data?', 'This deletes your account, profile and progress from this phone and from our servers. It cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const r = await deleteEverything();
          setSheet(null);
          if (r === 'relogin') {
            Alert.alert('Sign in again to delete', 'For your security, log out, sign in again, then delete your account right away.');
            return;
          }
          router.replace('/');
        },
      },
    ]);

  return (
    <SafeAreaView style={s.fill} edges={['top']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={k.title}>Me</Text>

        <View style={[s.profile, shadow]}>
          <Pressable onPress={() => router.push('/onboarding/avatar?edit=1')} accessibilityRole="button" accessibilityLabel="Change avatar">
            <View style={s.avatarRing}><Avatar who={p?.avatar ?? DEFAULT_AVATAR} size={76} /></View>
          </Pressable>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={s.name} numberOfLines={1}>{p?.name ?? 'Student'}</Text>
            <Text style={s.meta} numberOfLines={1}>{p?.major}</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
              {p && <Text style={s.chip}>{p.level} · {levelName(p.level)}</Text>}
            </View>
          </View>
        </View>
        {(p?.university || p?.goals.length) ? (
          <Text style={[s.meta, { paddingHorizontal: 6 }]}>
            {[p?.university, p?.year].filter(Boolean).join(' · ')}
            {p?.goals.length ? `${p?.university ? '\n' : ''}Goal: ${p.goals.join(', ').toLowerCase()}` : ''}
          </Text>
        ) : null}

        <View style={[s.group, shadow]}>
          <MenuRow icon="edit" label="Edit profile" onPress={() => router.push('/onboarding/profile?edit=1')} />
          <MenuRow icon="user" label="Change avatar" onPress={() => router.push('/onboarding/avatar?edit=1')} />
          <MenuRow icon="school" label="Change major" value={p?.major} onPress={() => router.push('/onboarding/major?edit=1')} />
          <MenuRow icon="target" label="Change goals" onPress={() => setSheet('goals')} />
          <MenuRow icon="chart" label="Change level" value={p?.level} onPress={() => router.push('/onboarding/level?edit=1')} />
          <MenuRow icon="mic" label="Retake speaking test" onPress={() => router.push('/onboarding/test?edit=1')} />
        </View>

        <View style={[s.group, shadow]}>
          <MenuRow icon="wifi" label="Voice & AI" value={isDemo ? 'Demo mode' : 'Connected'} onPress={() => setSheet('voice')} />
          <MenuRow icon="shield" label="Privacy" onPress={() => setSheet('privacy')} />
          <MenuRow icon="help" label="Help" onPress={() => setSheet('help')} />
          {email
            ? <MenuRow icon="logout" label="Log out" value={email} danger onPress={logout} />
            : (
              <>
                <MenuRow icon="user" label="Create an account" value="Keep your progress" onPress={() => router.push('/signup')} />
                <MenuRow icon="trash" label="Start over" danger onPress={deleteAll} />
              </>
            )}
        </View>
      </ScrollView>

      <Sheet visible={sheet === 'goals'} onClose={() => setSheet(null)} title="Your goals">
        <Text style={k.sub}>What do you want to get better at? Pick any.</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {GOALS.map((g) => {
            const on = goals.includes(g);
            return (
              <Pressable
                key={g}
                onPress={() => setGoals((x) => (on ? x.filter((y) => y !== g) : [...x, g]))}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                style={[s.goal, on && { backgroundColor: C.skyInk, borderColor: C.skyInk }]}
              >
                <Text style={[s.goalText, on && { color: C.white }]}>{g}</Text>
              </Pressable>
            );
          })}
        </View>
        <Button label="Save" onPress={saveGoals} />
      </Sheet>

      <Sheet visible={sheet === 'voice'} onClose={() => setSheet(null)} title={isDemo ? 'Demo mode' : 'Connected'}>
        <Text style={k.sub}>
          {isDemo
            ? 'No server is set up yet, so characters use scripted replies and you answer by typing. Add the server address to turn on voice and AI.'
            : 'Voice and AI replies are on. Characters speak with their own voices; if a voice can’t load, your phone’s voice reads the line instead.'}
        </Text>
      </Sheet>

      <Sheet visible={sheet === 'privacy'} onClose={() => setSheet(null)} title="Privacy">
        <Text style={k.sub}>
          {email
            ? 'Your profile and progress are saved in your Speakia account (Google Firebase) and on this phone. Only you can read them.'
            : 'As a guest, your profile and progress are saved on this phone. Create an account to keep them if you change phones.'}
          {' '}When voice is on, each recording goes through our server to Groq’s speech-to-text service to be turned into text.
          Speakia does not save your recordings. Character lines are turned into speech by Fish Audio; only the
          character’s words are sent, never your voice.
        </Text>
        <Button label="Delete all my data" variant="secondary" onPress={deleteAll} />
      </Sheet>

      <Sheet visible={sheet === 'help'} onClose={() => setSheet(null)} title="Help">
        <Text style={s.q}>How do stars work?</Text>
        <Text style={k.sub}>Stars show how independently you spoke: 3 stars with no hints, 2 with one or two hints, 1 with more.</Text>
        <Text style={s.q}>Can I mix French or Arabic?</Text>
        <Text style={k.sub}>Yes. If you use a French word, your partner gives you the English one so you can keep going.</Text>
        <Text style={s.q}>The microphone isn’t working</Text>
        <Text style={k.sub}>Allow the microphone for Expo Go in your phone’s Settings, or tap “Type instead”.</Text>
      </Sheet>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: C.cream },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.white, borderRadius: 24, padding: 16 },
  avatarRing: { padding: 3, borderRadius: 44, borderWidth: 3, borderColor: C.skyTint },
  name: { fontFamily: F.display, fontSize: 26, color: C.navy, letterSpacing: -0.4 },
  meta: { fontFamily: F.semi, fontSize: 14, lineHeight: 20, color: C.muted },
  chip: { fontFamily: F.heavy, fontSize: 12, color: C.skyInk, backgroundColor: C.skyTint, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
  group: { backgroundColor: C.white, borderRadius: 22, padding: 6 },
  goal: { paddingHorizontal: 14, minHeight: 44, justifyContent: 'center', borderRadius: 999, borderWidth: 2, borderColor: '#E7E9F3', backgroundColor: C.white },
  goalText: { fontFamily: F.bold, fontSize: 14, color: C.navy },
  q: { fontFamily: F.heavy, fontSize: 15, color: C.navy, marginTop: 4 },
});
