import { Tabs } from 'expo-router';
import { Image } from 'expo-image';
import { Gift, History, Settings, ShieldCheck, WalletCards, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, type ColorValue } from 'react-native';

import { fontSize, radius, shadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { tryResolveIcon } from '@/lib/category-icon';
import { useAppText } from '@/store/app-store';

type TabIconProps = { override: string; defaultIcon: LucideIcon; color: ColorValue; size: number };

/** Admin override (icon key or full image URL) if set, else the hardcoded
 *  default - a stable component so its identity never changes across renders. */
function TabIcon({ override, defaultIcon: DefaultIcon, color, size }: TabIconProps) {
  if (override.startsWith('http')) {
    return <Image source={{ uri: override }} style={{ width: size, height: size }} contentFit="contain" />;
  }

  // Picking among a fixed set of pre-existing Lucide icon components by
  // reference is not the "defining a new component during render" case
  // this rule targets - it just doesn't have a nested-closure shape it
  // recognizes as safe (see the identical pattern in category-picker.tsx).
  const ResolvedIcon = tryResolveIcon(override);
  if (ResolvedIcon) {
    // eslint-disable-next-line react-hooks/static-components
    return <ResolvedIcon size={size} color={color as string} strokeWidth={1.75} />;
  }

  return <DefaultIcon size={size} color={color as string} strokeWidth={1.75} />;
}

export default function TabsLayout() {
  const { colors } = useTheme();
  const tabGiving = useAppText('tab_giving');
  const tabWallet = useAppText('tab_wallet');
  const tabHistory = useAppText('tab_history');
  const tabTrust = useAppText('tab_trust');
  const tabSettings = useAppText('tab_settings');
  const iconGiving = useAppText('tab_icon_giving');
  const iconWallet = useAppText('tab_icon_wallet');
  const iconHistory = useAppText('tab_icon_history');
  const iconTrust = useAppText('tab_icon_trust');
  const iconSettings = useAppText('tab_icon_settings');

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
          tabBarIcon: ({ color, size }) => (
            <TabIcon override={iconGiving} defaultIcon={Gift} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: tabWallet,
          tabBarIcon: ({ color, size }) => (
            <TabIcon override={iconWallet} defaultIcon={WalletCards} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: tabHistory,
          tabBarIcon: ({ color, size }) => (
            <TabIcon override={iconHistory} defaultIcon={History} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="trust"
        options={{
          title: tabTrust,
          tabBarIcon: ({ color, size }) => (
            <TabIcon override={iconTrust} defaultIcon={ShieldCheck} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: tabSettings,
          tabBarIcon: ({ color, size }) => (
            <TabIcon override={iconSettings} defaultIcon={Settings} color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
