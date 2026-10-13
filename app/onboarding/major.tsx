import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { IconName } from '../../src/components/Icon';
import { Heading, OptionTile, Screen, StepBar, TopBar } from '../../src/components/kit';
import { Button } from '../../src/components/ui';
import { draft, loadDraft } from '../../src/draft';
import { updateProfile } from '../../src/storage';

// Season 1 is written for Computer Science; the other majors unlock as their stories are written.
const AVAILABLE = 'Computer Science / IT';
const MAJORS: { label: string; icon: IconName }[] = [
  { label: 'Computer Science / IT', icon: 'laptop' },
  { label: 'Engineering', icon: 'gear' },
  { label: 'Medicine / Health', icon: 'health' },
  { label: 'Business / Economics', icon: 'chart' },
  { label: 'Natural Sciences', icon: 'flask' },
  { label: 'Languages / Humanities', icon: 'globe' },
  { label: 'Law', icon: 'law' },
  { label: 'Arts / Design', icon: 'palette' },
  { label: 'Social Sciences', icon: 'people' },
  { label: 'Other', icon: 'more' },
];

/** Screen 05 · Choose major (also "Change major" from Me). Only Computer Science is open for now. */
export default function MajorStep() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const [major, setMajor] = useState(AVAILABLE);

  useEffect(() => {
    if (edit) loadDraft();
  }, [edit]);

  const next = async () => {
    draft.major = major;
    if (edit) {
      await updateProfile({ major });
      router.back();
    } else {
      router.push('/onboarding/level');
    }
  };

  return (
    <Screen
      top={
        <>
          <TopBar />
          {!edit && <View style={{ paddingHorizontal: 24, paddingBottom: 8 }}><StepBar value={0.75} /></View>}
        </>
      }
      footer={<Button label={edit ? 'Save' : 'Continue'} onPress={next} />}
    >
      <Heading
        kicker={edit ? undefined : 'Step 3 of 4'}
        title="What do you study?"
        sub="Season 1 is written for Computer Science. More majors are coming soon."
      />
      <View style={s.grid}>
        {MAJORS.map((m) => (
          <OptionTile
            key={m.label}
            label={m.label}
            icon={m.icon}
            selected={major === m.label}
            soon={m.label !== AVAILABLE}
            onPress={() => setMajor(m.label)}
            style={s.cell}
          />
        ))}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: { width: '48%', flexGrow: 1 },
});
