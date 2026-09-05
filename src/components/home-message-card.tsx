import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { fontSize, radius, shadow, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useHomeMessage } from '@/store/app-store';

/** Optional "atmosphere sentence" - admin-editable text + image, hidden
 *  entirely when the admin hasn't set any text. */
export function HomeMessageCard() {
  const { colors } = useTheme();
  const { text, imageUrl } = useHomeMessage();

  if (!text.trim()) return null;

  return (
    <View style={[styles.card, shadow.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" /> : null}
      <Text style={[styles.text, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: radius.md,
  },
  text: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
});
