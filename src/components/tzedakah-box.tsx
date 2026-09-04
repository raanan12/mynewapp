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
export const BOX_HEIGHT = 220;
/** Thickness of the gold metal frame around the glass panel. */
const FRAME_WIDTH = 6;
/** Vertical offset of the slot from the box center - coins aim here. */
export const SLOT_OFFSET_Y = -BOX_HEIGHT / 2 + 26;

type TzedakahBoxProps = {
  /** Total given today, shown on the gold plaque. */
  todayTotal: string;
  /** Admin-uploaded organization logo (app_texts.box_logo_url) - falls back
   *  to the bundled app icon when empty. */
  logoUrl?: string | null;
};

/**
 * Glass Tzedakah box in a gold metal frame. Built from layered views + a
 * real BlurView rather than a 3D engine, so it stays cheap on older devices
 * and works in Expo Go.
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

  // Static isometric tilt (perspective + rotateX/Y/Z) plus the coin-drop
  // bounce, combined in one transform array - RN has no `preserve-3d`, so
  // the whole box rotates as one rigid plane rather than separate faces.
  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateY: '-12deg' },
      { rotateX: '8deg' },
      { rotateZ: '1deg' },
      { scale: 1 + bounce.value * 0.03 },
    ],
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    opacity: (1 - ripple.value) * 0.7,
    transform: [{ scale: 0.3 + ripple.value * 2.4 }],
  }));

  return (
    <View style={styles.root}>
      <View style={styles.glow} pointerEvents="none" />

      <Animated.View style={[styles.frame, bodyStyle]}>
        <LinearGradient
          colors={[palette.frameGoldLight, palette.frameGold, palette.frameGoldDeep, palette.frameGold]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.glass}>
          <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={['rgba(255,255,255,0.65)', 'rgba(232,238,255,0.2)', 'rgba(255,240,250,0.25)']}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Scattered light glints - the touch that reads as "glass", not plastic. */}
          <View style={[styles.glint, styles.glintA]} pointerEvents="none" />
          <View style={[styles.glint, styles.glintB]} pointerEvents="none" />
          <View style={[styles.glint, styles.glintC]} pointerEvents="none" />

          <View style={styles.lid}>
            <View style={styles.slotRim}>
              <View style={styles.slotHalo} pointerEvents="none">
                <Animated.View style={[styles.ripple, rippleStyle]} />
              </View>
              <View style={styles.slot} />
            </View>
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
            </View>

            <View style={styles.amountBadge}>
              <LinearGradient
                colors={[palette.frameGoldLight, palette.frameGold, palette.frameGoldDeep]}
                start={{ x: 0.15, y: 0 }}
                end={{ x: 0.85, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.amountText}>{todayTotal}</Text>
            </View>
          </View>

          <View style={[styles.corner, styles.cornerTL]} pointerEvents="none" />
          <View style={[styles.corner, styles.cornerTR]} pointerEvents="none" />
          <View style={[styles.corner, styles.cornerBL]} pointerEvents="none" />
          <View style={[styles.corner, styles.cornerBR]} pointerEvents="none" />
        </View>
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
    width: BOX_WIDTH * 1.3,
    height: BOX_HEIGHT * 1.05,
    borderRadius: 999,
    backgroundColor: palette.frameGold,
    opacity: 0.22,
    shadowColor: palette.frameGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
  },
  frame: {
    width: BOX_WIDTH,
    height: BOX_HEIGHT,
    padding: FRAME_WIDTH,
    borderRadius: radius.lg,
    // Layered depth: a tight dark shadow for contact, this soft wide one for
    // the "floating in 3D space" read that a single shadow can't give.
    shadowColor: palette.charcoal,
    shadowOffset: { width: 6, height: 20 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 10,
  },
  glass: {
    flex: 1,
    borderRadius: radius.lg - FRAME_WIDTH / 2,
    overflow: 'hidden',
  },
  glint: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  glintA: {
    width: 5,
    height: 5,
    top: 30,
    left: 22,
    opacity: 0.85,
  },
  glintB: {
    width: 3,
    height: 3,
    top: 66,
    right: 30,
    opacity: 0.7,
  },
  glintC: {
    width: 4,
    height: 4,
    bottom: 46,
    left: 40,
    opacity: 0.6,
  },
  lid: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(197,160,89,0.4)',
  },
  slotRim: {
    padding: 3,
    borderRadius: radius.pill,
    backgroundColor: palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 90,
    height: 9,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(28,25,23,0.7)',
  },
  front: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  plate: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(197,160,89,0.4)',
    backgroundColor: 'rgba(255,255,255,0.55)',
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
    textShadowColor: 'rgba(255,255,255,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  amountBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  amountText: {
    color: palette.charcoal,
    fontSize: fontSize.md,
    fontWeight: '900',
    textShadowColor: 'rgba(255,255,255,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  shadow: {
    position: 'absolute',
    bottom: -12,
    left: '58%',
    width: BOX_WIDTH * 0.75,
    height: 16,
    marginLeft: -(BOX_WIDTH * 0.75) / 2,
    borderRadius: radius.pill,
    backgroundColor: palette.charcoal,
    opacity: 0.1,
    transform: [{ scaleX: 1.15 }],
  },
  corner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: 'rgba(197,160,89,0.7)',
  },
  cornerTL: {
    top: 6,
    left: 6,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: radius.sm,
  },
  cornerTR: {
    top: 6,
    right: 6,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: radius.sm,
  },
  cornerBL: {
    bottom: 6,
    left: 6,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: radius.sm,
  },
  cornerBR: {
    bottom: 6,
    right: 6,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: radius.sm,
  },
});
