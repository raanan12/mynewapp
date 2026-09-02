import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { I18nManager } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors as themeColors } from '@/constants/theme';
import { useAutoPilot } from '@/hooks/use-auto-pilot';
import { useSync } from '@/hooks/use-sync';
import { useTheme } from '@/hooks/use-theme';
import { warmUpFeedback } from '@/services/feedback';

// RTL must be forced before the first render. On iOS the flag only takes full
// effect after the app is restarted, which is why it lives at module scope.
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

export default function RootLayout() {
  const { isDark, colors } = useTheme();

  // Sync runs before auto-pilot so the streak is the server's number by the
  // time we decide whether today's donation already happened.
  useSync();
  useAutoPilot();

  useEffect(() => {
    warmUpFeedback();
  }, []);

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      primary: themeColors.light.accent,
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={navigationTheme}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="add-card"
              options={{ presentation: 'modal', headerShown: true, title: 'הוספת כרטיס' }}
            />
          </Stack>
          <StatusBar style={isDark ? 'light' : 'dark'} />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
