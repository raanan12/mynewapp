import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { fontSize, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/utils/format';

export default function HomeScreen() {
  const { colors } = useTheme();

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>MyNewApp</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Edit src/app/index.tsx to change this screen. Today is {formatDate(new Date())}.
        </Text>
        <Button title="Get started" onPress={() => {}} style={styles.action} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: fontSize.md,
    lineHeight: 24,
  },
  action: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
});
