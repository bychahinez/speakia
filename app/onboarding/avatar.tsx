import { ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Character, { Avatar } from '../../src/components/Character';
import { Icon } from '../../src/components/Icon';
import { Heading, Screen, StepBar, TopBar, k } from '../../src/components/kit';
import { Button } from '../../src/components/ui';
import {
  AvatarSpec, DEFAULT_AVATAR, Facial, HAIR_COLORS, HAIR_STYLES, HIJAB_COLORS, SKINS, TOPS, buildLook, randomAvatar,
} from '../../src/content/avatars';
import { draft, loadDraft } from '../../src/draft';
import { updateProfile } from '../../src/storage';
import { C, F } from '../../src/theme';

/** Onboarding step 1 (and "Change avatar" from Me): build a character that looks like you. */
export default function AvatarStep() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const [look, setLook] = useState<AvatarSpec>(draft.avatar ?? DEFAULT_AVATAR);
  const pop = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (edit) loadDraft().then(() => setLook(draft.avatar ?? DEFAULT_AVATAR));
  }, [edit]);

  const set = (patch: Partial<AvatarSpec>) => {
    setLook((l) => ({ ...l, ...patch }));
    pop.setValue(0.94);
    Animated.spring(pop, { toValue: 1, friction: 4, tension: 160, useNativeDriver: true }).start();
  };

  const hijab = look.hair === 'hijab';

  const next = async () => {
    draft.avatar = look;
    if (edit) {
      await updateProfile({ avatar: look });
      router.back();
    } else {
      router.push('/onboarding/profile');
    }
  };

  return (
    <Screen
      top={
        <>
          <TopBar />
          {!edit && <View style={{ paddingHorizontal: 24, paddingBottom: 8 }}><StepBar value={0.25} /></View>}
        </>
      }
      footer={<Button label={edit ? 'Save' : 'Continue'} onPress={next} />}
    >
      <Heading kicker={edit ? undefined : 'Step 1 of 4'} title="Create your look" sub="Make a character that looks like you. You can change it anytime." />

      <View style={s.stageRow}>
        <Animated.View style={[s.stage, { backgroundColor: buildLook(look).tint, transform: [{ scale: pop }] }]}>
          <Character who={look} size={150} happy />
        </Animated.View>
      </View>
      <Pressable onPress={() => set(randomAvatar())} accessibilityRole="button" style={s.surprise}>
        <Icon name="sparkle" size={18} color={C.skyInk} />
        <Text style={s.surpriseText}>Surprise me</Text>
      </Pressable>

      <Section title="Skin tone">
        {SKINS.map((c, i) => (
          <Swatch key={c.skin} color={c.skin} selected={look.skin === i} label={`Skin tone ${i + 1}`} onPress={() => set({ skin: i })} />
        ))}
      </Section>

      <Section title="Hair">
        {HAIR_STYLES.map((h) => {
          const on = look.hair === h.id;
          return (
            <Pressable
              key={h.id}
              onPress={() => set({ hair: h.id, ...(h.id === 'hijab' ? { earrings: false, facial: 'none' as Facial } : {}) })}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={h.label}
              style={s.styleOpt}
            >
              <View style={[s.styleRing, on && { borderColor: C.skyInk }]}>
                <Avatar who={{ ...look, hair: h.id }} size={54} />
              </View>
              <Text style={[s.styleLabel, on && { color: C.skyInk }]}>{h.label}</Text>
            </Pressable>
          );
        })}
      </Section>

      {hijab ? (
        <Section title="Hijab colour">
          {HIJAB_COLORS.map((c, i) => (
            <Swatch key={c} color={c} selected={look.hijabColor === i} label={`Hijab colour ${i + 1}`} onPress={() => set({ hijabColor: i })} />
          ))}
        </Section>
      ) : (
        <Section title="Hair colour">
          {HAIR_COLORS.map((c, i) => (
            <Swatch key={c} color={c} selected={look.hairColor === i} label={`Hair colour ${i + 1}`} onPress={() => set({ hairColor: i })} />
          ))}
        </Section>
      )}

      <Section title="Extras">
        <Toggle label="Glasses" on={look.glasses} onPress={() => set({ glasses: !look.glasses })} />
        {!hijab && <Toggle label="Earrings" on={look.earrings} onPress={() => set({ earrings: !look.earrings })} />}
        {!hijab && <Toggle label="Stubble" on={look.facial === 'stubble'} onPress={() => set({ facial: look.facial === 'stubble' ? 'none' : 'stubble' })} />}
        {!hijab && <Toggle label="Beard" on={look.facial === 'beard'} onPress={() => set({ facial: look.facial === 'beard' ? 'none' : 'beard' })} />}
      </Section>

      <Section title="Top">
        {TOPS.map((t, i) => (
          <Swatch key={t.top} color={t.top} selected={look.top === i} label={`Top colour ${i + 1}`} onPress={() => set({ top: i })} />
        ))}
      </Section>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={k.fieldLabel}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
        {children}
      </ScrollView>
    </View>
  );
}

function Swatch({ color, selected, label, onPress }: { color: string; selected: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={label} hitSlop={4}
      style={[s.swatchRing, selected && { borderColor: C.skyInk }]}>
      <View style={[s.swatch, { backgroundColor: color }]}>
        {selected && <Icon name="check" size={16} color="#fff" stroke={3.4} />}
      </View>
    </Pressable>
  );
}

function Toggle({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="switch" accessibilityState={{ checked: on }}
      style={[s.toggle, on && { backgroundColor: C.skyInk, borderColor: C.skyInk }]}>
      <Text style={[s.toggleText, on && { color: C.white }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  stageRow: { alignItems: 'center' },
  stage: { width: 190, height: 190, borderRadius: 95, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden', borderWidth: 4, borderColor: C.white },
  surprise: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 16, borderRadius: 999, backgroundColor: C.skyTint, marginTop: -4 },
  surpriseText: { fontFamily: F.heavy, fontSize: 14, color: C.skyInk },
  row: { gap: 10, paddingRight: 8, alignItems: 'flex-start' },
  swatchRing: { padding: 3, borderRadius: 26, borderWidth: 3, borderColor: 'transparent' },
  swatch: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(30,36,64,0.12)' },
  styleOpt: { alignItems: 'center', gap: 4, width: 66 },
  styleRing: { padding: 2, borderRadius: 34, borderWidth: 3, borderColor: 'transparent' },
  styleLabel: { fontFamily: F.bold, fontSize: 12, color: C.muted },
  toggle: { minHeight: 44, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 999, borderWidth: 2, borderColor: '#E7E9F3', backgroundColor: C.white },
  toggleText: { fontFamily: F.bold, fontSize: 14, color: C.navy },
});
