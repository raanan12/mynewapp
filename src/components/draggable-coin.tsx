import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Coin } from '@/components/coin';
import { coinDropFeedback } from '@/services/feedback';

/** Swipe further than this (or flick fast enough) and the coin is released. */
const RELEASE_DISTANCE = 64;
const RELEASE_VELOCITY = -700;

type DraggableCoinProps = {
  amount: number;
  /** Offset from the coin's resting spot to the box slot, in px. */
  target: { x: number; y: number };
  disabled?: boolean;
  /** Fired once the coin visually enters the slot. */
  onDrop: (amount: number) => void;
};

/**
 * A coin the user can flick up into the Tzedakah box - or just tap, which
 * plays the same flight. Tap is the fast path for the sub-10-second flow.
 */
export function DraggableCoin({ amount, target, disabled = false, onDrop }: DraggableCoinProps) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const scale = useSharedValue(1);
  const spin = useSharedValue(0);
  const opacity = useSharedValue(1);

  function complete() {
    coinDropFeedback();
    onDrop(amount);
  }

  function reset() {
    'worklet';
    x.value = 0;
    y.value = 0;
    scale.value = 1;
    spin.value = 0;
    opacity.value = 1;
  }

  function fly() {
    'worklet';
    const duration = 420;
    const easing = Easing.out(Easing.cubic);

    x.value = withTiming(target.x, { duration, easing });
    scale.value = withTiming(0.4, { duration, easing });
    spin.value = withTiming(720, { duration, easing });
    y.value = withTiming(target.y, { duration, easing }, (finished) => {
      if (!finished) return;
      opacity.value = 0;
      runOnJS(complete)();
      reset();
    });
  }

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .onUpdate((event) => {
      x.value = event.translationX;
      // Allow a little downward slack so the drag feels physical.
      y.value = Math.min(event.translationY, 24);
    })
    .onEnd((event) => {
      if (event.translationY < -RELEASE_DISTANCE || event.velocityY < RELEASE_VELOCITY) {
        fly();
      } else {
        x.value = withSpring(0, { damping: 14 });
        y.value = withSpring(0, { damping: 14 });
      }
    });

  const tap = Gesture.Tap()
    .enabled(!disabled)
    .maxDuration(400)
    .onEnd(() => {
      fly();
    });

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: scale.value },
      { rotateY: `${spin.value}deg` },
    ],
  }));

  return (
    <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
      <Animated.View
        accessibilityRole="button"
        accessibilityLabel={`תרומה של ${amount} שקלים`}
        accessibilityHint="החליקו למעלה או הקישו כדי להכניס לקופה"
        style={animatedStyle}>
        <Coin amount={amount} muted={disabled} />
      </Animated.View>
    </GestureDetector>
  );
}
