import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/theme';

type CoinProps = {
  amount: number;
  size?: number;
  /** Dim the coin when the wallet cannot cover it. */
  muted?: boolean;
};

/** A shekel coin. Layered rings fake the milled edge without an image asset. */
export function Coin({ amount, size = 62, muted = false }: CoinProps) {
  const inner = size * 0.78;

  return (
    <View style={[styles.wrapper, { width: size, height: size, opacity: muted ? 0.35 : 1 }]}>
      <LinearGradient
        colors={[palette.goldSoft, palette.gold, palette.goldDeep]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={[styles.disc, { width: size, height: size, borderRadius: size / 2 }]}
      />
      <View
        style={[
          styles.innerRing,
          { width: inner, height: inner, borderRadius: inner / 2, top: (size - inner) / 2 },
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 5,
  },
  disc: {
    position: 'absolute',
  },
  innerRing: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  amount: {
    fontWeight: '900',
    color: palette.navy,
    marginTop: -2,
  },
  currency: {
    fontWeight: '700',
    color: palette.navy,
    opacity: 0.75,
    marginTop: -4,
  },
});
