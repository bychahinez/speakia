import { Pressable } from 'react-native';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { C, shadow } from '../theme';

export function BackButton({ close = false, onPress }: { close?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={close ? 'Leave level' : 'Back'}
      onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/map')))}
      style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', marginTop: 8, ...shadow }}
    >
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
        <Path d={close ? 'M6 6l12 12M18 6L6 18' : 'M15 5l-7 7 7 7'} />
      </Svg>
    </Pressable>
  );
}
