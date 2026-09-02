import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/theme';

type CoinProps = {
  amount: number;
  size?: number;
  /** Dim the coin when it cannot be used right now (e.g. no card saved). */
  muted?: boolean;
};

/** A 3D brushed-gold coin. Layered rings fake the milled edge and metallic sheen without an image asset. */
export function Coin({ amount, size = 62, muted = false }: CoinProps) {
  const inner = size * 0.78;

  return (
    <View style={[styles.wrapper, { width: size, height: size, opacity: muted ? 0.35 : 1 }]}>
      <LinearGradient
        colors={[palette.goldRich, palette.gold, palette.goldDeep]}
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
      <Text style={[styles.amount, { fontSize: size * 0.34 }]} allowFontScaling={false}>
        {amount}
      </Text>
      <Text style={[styles.currency, { fontSize: size * 0.2 }]} allowFontScaling={false}>
        ₪
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.goldDeep,
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
    borderColor: 'rgba(255,255,255,0.5)',
  },
  highlight: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.35)',
    transform: [{ rotate: '-25deg' }],
  },
  amount: {
    fontWeight: '900',
    color: palette.charcoal,
    marginTop: -2,
  },
  currency: {
    fontWeight: '700',
    color: palette.charcoal,
    opacity: 0.7,
    marginTop: -4,
  },
});
