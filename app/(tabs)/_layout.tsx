import { Tabs } from 'expo-router';
import { ColorValue, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { C, F } from '../../src/theme';

const ICONS: Record<string, string[]> = {
  map: ['M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z', 'M9 4v14M15 6v14'],
  seasons: ['M12 3l9 5-9 5-9-5z', 'M3 13l9 5 9-5'],
  progress: ['M5 20v-6M12 20V8M19 20V4'],
  me: ['M4 21a8 8 0 0 1 16 0'],
};

function Icon({ name, color, focused }: { name: string; color: ColorValue; focused?: boolean }) {
  return (
    <View style={{ paddingHorizontal: 18, paddingVertical: 4, borderRadius: 999, backgroundColor: focused ? C.skyTint : 'transparent' }}>
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name].map((d) => (
        <Path key={d} d={d} />
      ))}
      {name === 'me' && <Circle cx={12} cy={8} r={4} />}
    </Svg>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.skyInk,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: { backgroundColor: C.white, borderTopColor: C.line, height: 76, paddingTop: 8, paddingBottom: 12 },
        tabBarLabelStyle: { fontFamily: F.bold, fontSize: 11 },
        sceneStyle: { backgroundColor: C.cream },
      }}
    >
      <Tabs.Screen name="map" options={{ title: 'Map', tabBarIcon: ({ color, focused }) => <Icon name="map" color={color} focused={focused} /> }} />
      <Tabs.Screen name="seasons" options={{ title: 'Seasons', tabBarIcon: ({ color, focused }) => <Icon name="seasons" color={color} focused={focused} /> }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress', tabBarIcon: ({ color, focused }) => <Icon name="progress" color={color} focused={focused} /> }} />
      <Tabs.Screen name="me" options={{ title: 'Me', tabBarIcon: ({ color, focused }) => <Icon name="me" color={color} focused={focused} /> }} />
    </Tabs>
  );
}
