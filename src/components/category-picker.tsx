import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { fontSize, radius, shadow, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { resolveCategoryIcon } from '@/lib/category-icon';
import { tapFeedback } from '@/services/feedback';
import { useCategories } from '@/store/app-store';
import type { CategoryId } from '@/types';

type CategoryPickerProps = {
  value: CategoryId;
  onChange: (id: CategoryId) => void;
};

const TILE_SIZE = 72;

/** Square tiles - icon on top, label below - so every category stays the
 *  same proportions regardless of how long its Hebrew label is. */
export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  const { colors } = useTheme();
  const categories = useCategories();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {categories.map((category) => {
        const selected = category.id === value;
        const Icon = resolveCategoryIcon(category.icon);

        return (
          <Pressable
            key={category.id}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => {
              tapFeedback();
              onChange(category.id);
            }}
            style={({ pressed }) => [
              styles.tile,
              selected && shadow.card,
              {
                backgroundColor: selected ? colors.accent : colors.surface,
                borderColor: selected ? colors.accent : colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}>
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: selected ? 'rgba(255,255,255,0.2)' : colors.surfaceAlt },
              ]}>
              <Icon size={20} color={selected ? colors.onAccent : colors.textMuted} strokeWidth={1.75} />
            </View>
            <Text
              style={[styles.label, { color: selected ? colors.onAccent : colors.text }]}
              numberOfLines={2}>
              {category.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  tile: {
    width: TILE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textAlign: 'center',
  },
});
