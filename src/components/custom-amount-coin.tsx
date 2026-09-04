import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { palette } from '@/constants/theme';

type CustomAmountCoinProps = {
  size?: number;
  muted?: boolean;
};

/** A pearl/silver coin for "custom amount" - same 3D coin treatment as
 *  `Coin`, but distinct metal so it reads as an action, not a denomination. */
export function CustomAmountCoin({ size = 62, muted = false }: CustomAmountCoinProps) {
  const inner = size * 0.78;

  return (
    <View style={[styles.wrapper, { width: size, height: size, opacity: muted ? 0.35 : 1 }]}>
      <LinearGradient
        colors={[palette.silverRich, palette.silver, palette.silverDeep]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={[styles.disc, { width: size, height: size, borderRadius: size / 2 }]}
      />
      <View
        style={[
          styles.innerRing,
          { width: inner, height: inner, borderRadius: inner / 2, top: (size - inner) / 2 },
        ]}
      />
      <View
        style={[
          styles.highlight,
          { width: size * 0.4, height: size * 0.22, top: size * 0.12, left: size * 0.18 },
        ]}
      />
      <Sparkles size={size * 0.36} color={palette.charcoal} strokeWidth={1.75} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.silverDeep,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  disc: {
    position: 'absolute',
  },
  innerRing: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  highlight: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.45)',
    transform: [{ rotate: '-25deg' }],
  },
});
