import { Tabs } from 'expo-router';
import { Gift, History, Settings, ShieldCheck, WalletCards } from 'lucide-react-native';
import { StyleSheet } from 'react-native';

import { fontSize, radius, shadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppText } from '@/store/app-store';

export default function TabsLayout() {
  const { colors } = useTheme();
  const tabGiving = useAppText('tab_giving');
  const tabWallet = useAppText('tab_wallet');
  const tabHistory = useAppText('tab_history');
  const tabTrust = useAppText('tab_trust');
  const tabSettings = useAppText('tab_settings');

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
          title: tabGiving,
          tabBarIcon: ({ color, size }) => <Gift size={size} color={color} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: tabWallet,
          tabBarIcon: ({ color, size }) => <WalletCards size={size} color={color} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: tabHistory,
          tabBarIcon: ({ color, size }) => <History size={size} color={color} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen
        name="trust"
        options={{
          title: tabTrust,
          tabBarIcon: ({ color, size }) => <ShieldCheck size={size} color={color} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: tabSettings,
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} strokeWidth={1.75} />,
        }}
      />
    </Tabs>
  );
}

