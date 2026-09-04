import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
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
  /** Scale bounce + golden ripple, called the moment a coin enters the slot. */
  receiveCoin: () => void;
};

export const BOX_WIDTH = 200;
export const BOX_HEIGHT = 210;
/** Vertical offset of the slot from the box center - coins aim here. */
export const SLOT_OFFSET_Y = -BOX_HEIGHT / 2 + 26;

type TzedakahBoxProps = {
  /** Total given today, shown on the frosted panel. */
  todayTotal: string;
  /** Admin-uploaded organization logo (app_texts.box_logo_url) - falls back
   *  to the bundled app icon when empty. */
  logoUrl?: string | null;
};

/**
 * Frosted acrylic Tzedakah box. Built from layered views + a real BlurView
 * rather than a 3D engine, so it stays cheap on older devices and works in
 * Expo Go.
 */
export const TzedakahBox = forwardRef<TzedakahBoxHandle, TzedakahBoxProps>(function TzedakahBox(
  { todayTotal, logoUrl },
  ref
) {
  const bounce = useSharedValue(0);
  const ripple = useSharedValue(0);

  useImperativeHandle(ref, () => ({
    receiveCoin() {
      bounce.value = withSequence(
        withTiming(1, { duration: 90 }),
        withSpring(0, { damping: 6, stiffness: 200 })
      );
      ripple.value = 0;
      ripple.value = withTiming(1, { duration: 620 });
    },
  }));

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + bounce.value * 0.03 }],
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    opacity: (1 - ripple.value) * 0.7,
    transform: [{ scale: 0.3 + ripple.value * 2.4 }],
  }));

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.body, bodyStyle]}>
        <BlurView intensity={45} tint="light" style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.08)']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.lid}>
          <View style={styles.slotHalo} pointerEvents="none">
            <Animated.View style={[styles.ripple, rippleStyle]} />
          </View>
          <View style={styles.slot} />
        </View>

        <View style={styles.front}>
          <View style={styles.plate}>
            {logoUrl ? (
              <Image source={{ uri: logoUrl }} style={styles.logo} contentFit="contain" />
            ) : (
              <Image
                source={require('../../assets/images/icon.png')}
                style={styles.logo}
                contentFit="contain"
              />
            )}
            <View style={styles.plateRule} />
            <Text style={styles.plateSub}>נתרם היום</Text>
            <Text style={styles.plateAmount}>{todayTotal}</Text>
          </View>

          <View style={styles.rivetRow}>
            {[0, 1, 2, 3].map((index) => (
              <View key={index} style={styles.rivet} />
            ))}
          </View>
        </View>

        {/* Ornate gold corner accents - the touch that reads as "crafted
         *  box" rather than a flat rounded rectangle. */}
        <View style={[styles.corner, styles.cornerTL]} pointerEvents="none" />
        <View style={[styles.corner, styles.cornerTR]} pointerEvents="none" />
        <View style={[styles.corner, styles.cornerBL]} pointerEvents="none" />
        <View style={[styles.corner, styles.cornerBR]} pointerEvents="none" />
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
  body: {
    width: BOX_WIDTH,
    height: BOX_HEIGHT,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(197,160,89,0.55)',
    shadowColor: palette.charcoal,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  lid: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(197,160,89,0.35)',
  },
  slotHalo: {
    position: 'absolute',
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ripple: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: palette.gold,
  },
  slot: {
    width: 96,
    height: 11,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(28,25,23,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(197,160,89,0.5)',
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
    borderColor: 'rgba(197,160,89,0.4)',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  logo: {
    width: 72,
    height: 40,
  },
  plateRule: {
    width: 54,
    height: 1,
    backgroundColor: palette.gold,
    marginVertical: spacing.xs + 2,
  },
  plateSub: {
    color: palette.taupe,
    fontSize: fontSize.xs,
  },
  plateAmount: {
    color: palette.charcoal,
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
    backgroundColor: palette.gold,
    opacity: 0.7,
  },
  shadow: {
    position: 'absolute',
    bottom: -14,
    width: BOX_WIDTH * 0.8,
    height: 14,
    borderRadius: radius.pill,
    backgroundColor: palette.charcoal,
    opacity: 0.08,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: palette.gold,
    opacity: 0.8,
  },
  cornerTL: {
    top: 4,
    left: 4,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: radius.sm,
  },
  cornerTR: {
    top: 4,
    right: 4,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: radius.sm,
  },
  cornerBL: {
    bottom: 4,
    left: 4,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: radius.sm,
  },
  cornerBR: {
    bottom: 4,
    right: 4,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: radius.sm,
  },
});
