import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';

import { Screen } from '@/components/screen';
import { fontSize, radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(flipAnimation, {
      toValue: isFlipped ? 180 : 0,
      duration: 700,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [flipAnimation, isFlipped]);

  const frontRotateY = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backRotateY = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  return (
    <Screen>
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? '#0b1020' : '#f4f6ff',
          },
        ]}>
        <View style={styles.cardScene}>
          <Animated.View
            style={[
              styles.cardFace,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                transform: [{ perspective: 1200 }, { rotateY: frontRotateY }],
              },
              styles.frontFace,
            ]}>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>ברוכים הבאים</Text>
            <Text style={[styles.title, { color: colors.text }]}>שלום אמיתי</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>המסך מוכן לנסיעה הבאה שלך</Text>

            <Pressable
              accessibilityRole="button"
              onPress={() => setIsFlipped(true)}
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}>
              <Text style={[styles.buttonText, { color: colors.onPrimary }]}>התחל</Text>
            </Pressable>
          </Animated.View>

          <Animated.View
            pointerEvents={isFlipped ? 'auto' : 'none'}
            style={[
              styles.cardFace,
              styles.backFace,
              {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
                transform: [{ perspective: 1200 }, { rotateY: backRotateY }],
              },
            ]}>
            <Text style={[styles.eyebrow, { color: '#dfe9ff' }]}>מוכן</Text>
            <Text style={[styles.title, { color: '#ffffff' }]}>העולם שלך פתוח</Text>
            <Text style={[styles.subtitle, { color: '#edf5ff' }]}>המסך התהפך בהצלחה והעיצוב עבר ל RTL</Text>

            <Pressable
              accessibilityRole="button"
              onPress={() => setIsFlipped(false)}
              style={({ pressed }) => [
                styles.secondaryButton,
                {
                  backgroundColor: '#ffffff',
                  opacity: pressed ? 0.9 : 1,
                },
              ]}>
              <Text style={[styles.buttonText, { color: colors.primary }]}>חזור</Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    writingDirection: 'rtl',
  },
  cardScene: {
    width: '100%',
    maxWidth: 380,
    height: 520,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  frontFace: {
    alignItems: 'flex-end',
  },
  backFace: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    letterSpacing: 0.75,
    marginBottom: spacing.sm,
    textAlign: 'right',
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    lineHeight: 46,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    lineHeight: 28,
    textAlign: 'right',
    marginBottom: spacing.xl,
  },
  primaryButton: {
    minWidth: 170,
    minHeight: 54,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  secondaryButton: {
    minWidth: 170,
    minHeight: 54,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  buttonText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    textAlign: 'center',
  },
});
