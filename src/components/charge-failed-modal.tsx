import { BlurView } from 'expo-blur';
import { XCircle } from 'lucide-react-native';
import { Modal, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { fontSize, radius, shadow, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ChargeFailedModalProps = {
  message: string | null;
  onRetry: () => void;
  onDismiss: () => void;
};

/** "החיוב נדחה" - a blurred-backdrop modal for a failed charge, per the failure spec. */
export function ChargeFailedModal({ message, onRetry, onDismiss }: ChargeFailedModalProps) {
  const { colors } = useTheme();

  return (
    <Modal visible={message !== null} transparent animationType="fade" onRequestClose={onDismiss}>
      <BlurView intensity={30} tint="light" style={styles.backdrop}>
        {message ? (
          <Animated.View
            entering={FadeInDown.springify().damping(18)}
            style={[styles.card, shadow.raised, { backgroundColor: colors.surface }]}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(225,29,72,0.1)' }]}>
              <XCircle size={36} color={colors.danger} strokeWidth={2} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>החיוב נדחה</Text>
            <Text style={[styles.body, { color: colors.textMuted }]}>{message}</Text>

            <View style={styles.actions}>
              <Button title="נסה שוב" onPress={onRetry} style={styles.flex} />
              <Button title="סגירה" variant="secondary" onPress={onDismiss} style={styles.flex} />
            </View>
          </Animated.View>
        ) : null}
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '900',
  },
  body: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  flex: {
    flex: 1,
  },
});
