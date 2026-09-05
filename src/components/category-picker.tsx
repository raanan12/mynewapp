import { Image } from 'expo-image';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { resolveCategoryIcon } from '@/lib/category-icon';
import { tapFeedback } from '@/services/feedback';
import { useCategories } from '@/store/app-store';
import type { CategoryId } from '@/types';

type CategoryPickerProps = {
  value: CategoryId;
  onChange: (id: CategoryId) => void;
};

const TILE_SIZE = 90;

/** A single soft white card wrapping uniform 90x90 tiles - scrollable so it
 *  still holds up if the admin adds more categories than fit on screen. */
export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  const { colors } = useTheme();
  const categories = useCategories();

  return (
    <View style={styles.card}>
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
                {
                  backgroundColor: selected ? colors.accent : '#F7F4EE',
                  borderColor: selected ? colors.accent : '#E8E2D5',
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              {category.iconImageUrl ? (
                <Image source={{ uri: category.iconImageUrl }} style={styles.iconImage} contentFit="contain" />
              ) : (
                <Icon size={26} color={selected ? colors.onAccent : '#333333'} strokeWidth={1.75} />
              )}
              <Text
                style={[styles.label, { color: selected ? colors.onAccent : '#333333' }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}>
                {category.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    borderRadius: 20,
    padding: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    ...Platform.select({ android: { elevation: 3 } }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexGrow: 1,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
  },
  iconImage: {
    width: 28,
    height: 28,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
    width: '100%',
  },
});
