import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Avatar } from '../../src/components/Character';
import { Icon } from '../../src/components/Icon';
import { Field, Heading, Screen, StepBar, TopBar, k } from '../../src/components/kit';
import { Button } from '../../src/components/ui';
import { DEFAULT_AVATAR } from '../../src/content/avatars';
import { draft, loadDraft } from '../../src/draft';
import { updateProfile } from '../../src/storage';
import { C, F } from '../../src/theme';

const YEARS = ['1st year', '2nd year', '3rd year', 'Master 1', 'Master 2', 'PhD'];

/** Screen 04 · Create profile, onboarding step 2 (also "Edit profile" from Me). */
export default function ProfileStep() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const [ready, setReady] = useState(!edit);
  const [avatar, setAvatar] = useState(draft.avatar ?? DEFAULT_AVATAR);
  // the look is edited on its own screen: show the latest one when coming back here
  useFocusEffect(useCallback(() => { if (draft.avatar) setAvatar(draft.avatar); }, []));
  const [name, setName] = useState(draft.name ?? '');
  const [university, setUniversity] = useState(draft.university ?? '');
  const [year, setYear] = useState(draft.year);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!edit) return;
    loadDraft().then(() => {
      setAvatar(draft.avatar ?? DEFAULT_AVATAR);
      setName(draft.name ?? '');
      setUniversity(draft.university ?? '');
      setYear(draft.year);
      setReady(true);
    });
  }, [edit]);

  const nameErr = touched && !name.trim() ? 'Tell us your first name.' : '';

  const next = async () => {
    setTouched(true);
    if (!name.trim()) return;
    Object.assign(draft, { name: name.trim().slice(0, 40), university: university.trim(), year });
    if (edit) {
      await updateProfile({ name: name.trim().slice(0, 40), university: university.trim() || undefined, year });
      router.back();
    } else {
      router.push('/onboarding/major');
    }
  };

  if (!ready) return null;

  return (
    <Screen
      top={
        <>
          <TopBar />
          {!edit && <View style={{ paddingHorizontal: 24, paddingBottom: 8 }}><StepBar value={0.5} /></View>}
        </>
      }
      footer={<Button label={edit ? 'Save' : 'Continue'} onPress={next} />}
    >
      <Heading
        kicker={edit ? undefined : 'Step 2 of 4'}
        title={edit ? 'Edit profile' : 'Let’s get to know you'}
        sub="This helps us make the story yours."
      />

      <View style={s.lookRow}>
        <View style={s.bigAvatar}>
          <Avatar who={avatar} size={96} />
        </View>
        <Pressable
          onPress={() => (edit ? router.push('/onboarding/avatar?edit=1') : router.back())}
          accessibilityRole="button"
          style={s.editLook}
        >
          <Icon name="edit" size={16} color={C.skyInk} />
          <Text style={s.editLookText}>Edit look</Text>
        </Pressable>
      </View>

      <Field
        label="First name"
        icon="user"
        value={name}
        onChangeText={setName}
        onBlur={() => setTouched(true)}
        placeholder="Yousra"
        maxLength={40}
        autoCapitalize="words"
        autoComplete="given-name"
        error={nameErr}
      />
      <Field
        label="University (optional)"
        icon="school"
        value={university}
        onChangeText={setUniversity}
        placeholder="Your university"
        autoCapitalize="words"
      />
      <View style={{ gap: 8 }}>
        <Text style={k.fieldLabel}>Year of study (optional)</Text>
        <View style={s.years}>
          {YEARS.map((y) => {
            const on = y === year;
            return (
              <Pressable
                key={y}
                onPress={() => setYear(on ? undefined : y)}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                style={[s.year, on && { backgroundColor: C.skyInk, borderColor: C.skyInk }]}
              >
                <Text style={[s.yearText, on && { color: C.white }]}>{y}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  lookRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  bigAvatar: { padding: 5, borderRadius: 60, backgroundColor: C.white, borderWidth: 3, borderColor: C.skyTint },
  editLook: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 14, borderRadius: 999, backgroundColor: C.skyTint },
  editLookText: { fontFamily: F.heavy, fontSize: 14, color: C.skyInk },
  years: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  year: { paddingHorizontal: 14, minHeight: 44, justifyContent: 'center', borderRadius: 999, borderWidth: 2, borderColor: '#E7E9F3', backgroundColor: C.white },
  yearText: { fontFamily: F.bold, fontSize: 14, color: C.navy },
});
