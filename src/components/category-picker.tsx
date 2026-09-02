import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { fontSize, radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { tapFeedback } from '@/services/feedback';
import { useCategories } from '@/store/app-store';
import type { CategoryId } from '@/types';

type CategoryPickerProps = {
  value: CategoryId;
  onChange: (id: CategoryId) => void;
};

/** Horizontal chips - the donation target is picked before the coin drops. */
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
              styles.chip,
              {
                backgroundColor: selected ? colors.primary : colors.surface,
                borderColor: selected ? colors.primary : colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}>
            <Ionicons
              name={category.icon as keyof typeof Ionicons.glyphMap}
              size={16}
              color={selected ? colors.onPrimary : colors.textMuted}
            />
            <Text
              style={[styles.label, { color: selected ? colors.onPrimary : colors.text }]}
              numberOfLines={1}>
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
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
});
