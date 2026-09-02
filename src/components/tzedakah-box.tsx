import { LinearGradient } from 'expo-linear-gradient';
import { forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { fontSize, palette, radius, spacing } from '@/constants/theme';

export type TzedakahBoxHandle = {
  /** Squash + glow, called the moment a coin enters the slot. */
  receiveCoin: () => void;
};

export const BOX_WIDTH = 200;
export const BOX_HEIGHT = 210;
/** Vertical offset of the slot from the box center - coins aim here. */
export const SLOT_OFFSET_Y = -BOX_HEIGHT / 2 + 26;

type TzedakahBoxProps = {
  /** Total given today, engraved on the front plate. */
  todayTotal: string;
};

/**
 * Stylized 3D Tzedakah box. Built from layered views rather than a 3D engine so
 * it stays cheap on older devices and works in Expo Go.
 */
export const TzedakahBox = forwardRef<TzedakahBoxHandle, TzedakahBoxProps>(function TzedakahBox(
  { todayTotal },
  ref
) {
  const squash = useSharedValue(0);
  const glow = useSharedValue(0);

  useImperativeHandle(ref, () => ({
    receiveCoin() {
      squash.value = withSequence(
        withTiming(1, { duration: 110 }),
        withSpring(0, { damping: 7, stiffness: 220 })
      );
      glow.value = withSequence(withTiming(1, { duration: 140 }), withTiming(0, { duration: 620 }));
    },
  }));

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: 1 - squash.value * 0.06 }, { scaleX: 1 + squash.value * 0.04 }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value * 0.85,
    transform: [{ scale: 1 + glow.value * 0.12 }],
  }));

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none" />

      <Animated.View style={[styles.body, bodyStyle]}>
        {/* Lid - rotated to fake perspective. */}
        <LinearGradient
          colors={[palette.navySoft, palette.navy]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.lid}>
          <View style={styles.slot} />
        </LinearGradient>

        <LinearGradient
          colors={[palette.navy, palette.navyDeep]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.front}>
          <View style={styles.plate}>
            <Text style={styles.plateTitle}>צְדָקָה</Text>
            <View style={styles.plateRule} />
            <Text style={styles.plateSub}>נתרם היום</Text>
            <Text style={styles.plateAmount}>{todayTotal}</Text>
          </View>

          <View style={styles.rivetRow}>
            {[0, 1, 2, 3].map((index) => (
              <View key={index} style={styles.rivet} />
            ))}
          </View>
        </LinearGradient>
      </Animated.View>

      <View style={styles.shadow} pointerEvents="none" />
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    width: BOX_WIDTH,
    height: BOX_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: BOX_WIDTH + 60,
    height: BOX_HEIGHT + 60,
    borderRadius: radius.xl + 20,
    backgroundColor: palette.gold,
    opacity: 0,
  },
  body: {
    width: BOX_WIDTH,
    height: BOX_HEIGHT,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: palette.gold,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  lid: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: palette.goldDeep,
  },
  slot: {
    width: 96,
    height: 12,
    borderRadius: radius.pill,
    backgroundColor: '#05080F',
    borderWidth: 1,
    borderColor: palette.goldDeep,
  },
  front: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  plate: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.5)',
    backgroundColor: 'rgba(212,175,55,0.08)',
  },
  plateTitle: {
    color: palette.gold,
    fontSize: fontSize.lg,
    fontWeight: '800',
    letterSpacing: 3,
  },
  plateRule: {
    width: 54,
    height: 1,
    backgroundColor: palette.goldDeep,
    marginVertical: spacing.xs + 2,
  },
  plateSub: {
    color: '#B8C4D9',
    fontSize: fontSize.xs,
  },
  plateAmount: {
    color: palette.cream,
    fontSize: fontSize.lg,
    fontWeight: '800',
    marginTop: 2,
  },
  rivetRow: {
    position: 'absolute',
    bottom: spacing.sm,
    flexDirection: 'row',
    gap: spacing.lg,
  },
  rivet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: palette.goldDeep,
    opacity: 0.8,
  },
  shadow: {
    position: 'absolute',
    bottom: -14,
    width: BOX_WIDTH * 0.8,
    height: 14,
    borderRadius: radius.pill,
    backgroundColor: '#000000',
    opacity: 0.16,
  },
});
