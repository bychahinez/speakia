import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Icon } from '../../src/components/Icon';
import { Heading, OptionTile, Screen, StepBar, TopBar, k } from '../../src/components/kit';
import { Button } from '../../src/components/ui';
import { draft, loadDraft } from '../../src/draft';
import { LEVELS, Level, updateProfile } from '../../src/storage';
import { C, F } from '../../src/theme';

/** Screen 06 · Choose English level, or take the short speaking test. */
export default function LevelStep() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const [level, setLevel] = useState<Level | undefined>(draft.levelSource === 'manual' ? draft.level : undefined);
  const [unsure, setUnsure] = useState(false);

  useEffect(() => {
    if (edit) loadDraft().then(() => setLevel(draft.level));
  }, [edit]);

  const pick = (l: Level) => {
    setLevel(l);
    setUnsure(false);
  };

  const next = async () => {
    if (unsure) return router.push(edit ? '/onboarding/test?edit=1' : '/onboarding/test');
    if (!level) return;
    Object.assign(draft, { level, levelSource: 'manual' });
    if (edit) {
      await updateProfile({ level, levelSource: 'manual' });
      router.back();
    } else {
      router.push({ pathname: '/onboarding/result', params: { manual: '1' } });
    }
  };

  return (
    <Screen
      top={
        <>
          <TopBar />
          {!edit && <View style={{ paddingHorizontal: 24, paddingBottom: 8 }}><StepBar value={1} /></View>}
        </>
      }
      footer={
        <Button
          label={unsure ? 'Take the test' : edit ? 'Save' : 'Start my journey'}
          onPress={next}
          disabled={!unsure && !level}
        />
      }
    >
      <Heading kicker={edit ? undefined : 'Step 4 of 4'} title="What’s your English level?" sub="Choose a level, or let us help you find it." />
      <View style={s.grid}>
        {LEVELS.map((l) => (
          <OptionTile key={l.id} big={l.id} label={l.name} selected={!unsure && level === l.id} onPress={() => pick(l.id)} style={s.cell} />
        ))}
      </View>
      <Pressable
        onPress={() => { setUnsure(true); setLevel(undefined); }}
        accessibilityRole="radio"
        accessibilityState={{ selected: unsure }}
        style={[s.unsure, unsure && { borderColor: C.sunDark }]}
      >
        <View style={s.bulb}><Icon name="bulb" size={24} color="#B98300" /></View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={s.unsureTitle}>I’m not sure</Text>
          <Text style={k.tileSub as object}>Take a quick speaking test · 4 questions</Text>
        </View>
        {unsure && <View style={s.tick}><Icon name="check" size={13} color="#fff" stroke={3.4} /></View>}
      </Pressable>
    </Screen>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: { width: '48%', flexGrow: 1 },
  unsure: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.sunTint, borderRadius: 18, padding: 16, borderWidth: 2, borderColor: 'transparent' },
  bulb: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  unsureTitle: { fontFamily: F.heavy, fontSize: 16, color: C.navy },
  tick: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.sunDark, alignItems: 'center', justifyContent: 'center' },
});
