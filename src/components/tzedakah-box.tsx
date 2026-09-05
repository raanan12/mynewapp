import { Image } from 'expo-image';
import { forwardRef, useImperativeHandle } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { fontSize, palette, radius } from '@/constants/theme';

export type TzedakahBoxHandle = {
  /** Scale bounce + golden ripple, called the moment a coin enters the slot. */
  receiveCoin: () => void;
};

// Matches the source art's own aspect ratio (2016x2094) so the box never
// gets stretched.
export const BOX_WIDTH = 260;
export const BOX_HEIGHT = Math.round(BOX_WIDTH * (2094 / 2016));
/** Vertical offset of the slot from the box center - coins aim here. */
export const SLOT_OFFSET_Y = BOX_HEIGHT * 0.12 - BOX_HEIGHT / 2;
/** Max tilt angle (degrees) for the touch-driven 3D tilt. */
const MAX_TILT = 9;

type TzedakahBoxProps = {
  /** Total given today, shown on the nameplate. */
  todayTotal: string;
  /** Admin-uploaded organization logo (app_texts.box_logo_url) - falls back
   *  to the bundled app icon when empty. */
  logoUrl?: string | null;
};

/**
 * Real glass-and-gold box art (assets/images/tzedakah-box.png, transparent
 * background) with the amount overlaid on its nameplate, plus a touch-driven
 * 3D tilt (RN's native equivalent of react-parallax-tilt - that library
 * itself is web-only).
 */
export const TzedakahBox = forwardRef<TzedakahBoxHandle, TzedakahBoxProps>(function TzedakahBox(
  { todayTotal, logoUrl },
  ref
) {
  const bounce = useSharedValue(0);
  const ripple = useSharedValue(0);
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

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

  const tilt = Gesture.Pan()
    .onUpdate((event) => {
      // event.x/y are within the box's own bounds - map them to a tilt
      // around the opposite axis (touch the right side, the box leans
      // away to the left), same convention as react-parallax-tilt.
      const nx = event.x / BOX_WIDTH - 0.5;
      const ny = event.y / BOX_HEIGHT - 0.5;
      tiltY.value = nx * MAX_TILT * 2;
      tiltX.value = -ny * MAX_TILT * 2;
    })
    .onEnd(() => {
      tiltX.value = withSpring(0, { damping: 10 });
      tiltY.value = withSpring(0, { damping: 10 });
    });

  const boxStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 700 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
      { scale: 1 + bounce.value * 0.03 },
    ],
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    opacity: (1 - ripple.value) * 0.7,
    transform: [{ scale: 0.3 + ripple.value * 2.4 }],
  }));

  return (
    <GestureDetector gesture={tilt}>
      <View style={styles.root}>
        <Animated.View style={[styles.box, boxStyle]}>
          <Image
            source={require('../../assets/images/tzedakah-box.png')}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
          />

          <View style={styles.logoWrap} pointerEvents="none">
            {logoUrl ? (
              <Image source={{ uri: logoUrl }} style={styles.logo} contentFit="contain" />
            ) : (
              <Image
                source={require('../../assets/images/icon.png')}
                style={styles.logo}
                contentFit="contain"
              />
            )}
          </View>

          <View style={styles.plateWrap} pointerEvents="none">
            <Text style={styles.plateSub}>נתרם היום</Text>
            <Text style={styles.amountText}>{todayTotal}</Text>
          </View>

          <View style={styles.slotHalo} pointerEvents="none">
            <Animated.View style={[styles.ripple, rippleStyle]} />
          </View>
        </Animated.View>

        <View style={styles.shadow} pointerEvents="none" />
      </View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  root: {
    width: BOX_WIDTH,
    height: BOX_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: BOX_WIDTH,
    height: BOX_HEIGHT,
  },
  logoWrap: {
    position: 'absolute',
    top: '22%',
    left: '15%',
    width: '70%',
    height: '26%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  plateWrap: {
    position: 'absolute',
    top: '53%',
    left: '18%',
    width: '64%',
    height: '13%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plateSub: {
    color: palette.charcoal,
    fontSize: fontSize.xs - 1,
    fontWeight: '700',
    opacity: 0.75,
  },
  amountText: {
    color: palette.charcoal,
    fontSize: fontSize.md,
    fontWeight: '900',
  },
  slotHalo: {
    position: 'absolute',
    top: '11%',
    left: '50%',
    width: 10,
    height: 10,
    marginLeft: -5,
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
  shadow: {
    position: 'absolute',
    bottom: -10,
    width: BOX_WIDTH * 0.75,
    height: 16,
    borderRadius: radius.pill,
    backgroundColor: palette.charcoal,
    opacity: 0.1,
  },
});
