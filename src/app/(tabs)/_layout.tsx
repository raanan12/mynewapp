import { Tabs } from 'expo-router';
import { Gift, History, Settings, ShieldCheck, WalletCards } from 'lucide-react-native';
import { StyleSheet } from 'react-native';

import { fontSize, radius, shadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 16,
          height: 68,
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          borderRadius: radius.xl,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          ...shadow.raised,
        },
        tabBarItemStyle: { paddingTop: 10 },
        tabBarLabelStyle: { fontSize: fontSize.xs, fontWeight: '700' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'נתינה',
          tabBarIcon: ({ color, size }) => <Gift size={size} color={color} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'כרטיס',
          tabBarIcon: ({ color, size }) => <WalletCards size={size} color={color} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'היסטוריה',
          tabBarIcon: ({ color, size }) => <History size={size} color={color} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen
        name="trust"
        options={{
          title: 'שקיפות',
          tabBarIcon: ({ color, size }) => <ShieldCheck size={size} color={color} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'הגדרות',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} strokeWidth={1.75} />,
        }}
      />
    </Tabs>
  );
}

