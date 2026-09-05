import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, View } from 'react-native';

import { palette, radius, spacing } from '@/constants/theme';
import { useAppPopup } from '@/store/app-store';
import { toDateKey } from '@/utils/format';

const STORAGE_KEY = 'opening-popup-last-shown';

/** Admin-configured popup, shown at most once per day on cold start. */
export function OpeningPopup() {
  const { enabled, imageUrl, linkUrl } = useAppPopup();
  const [visible, setVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!enabled || !imageUrl) return;
    let active = true;

    void AsyncStorage.getItem(STORAGE_KEY).then((last) => {
      if (active && last !== toDateKey()) setVisible(true);
    });

    return () => {
      active = false;
    };
  }, [enabled, imageUrl]);

  function close() {
    setVisible(false);
    void AsyncStorage.setItem(STORAGE_KEY, toDateKey());
  }

  function handlePress() {
    close();
    if (linkUrl) {
      void Linking.openURL(linkUrl);
    } else {
      router.push('/(tabs)');
    }
  }

  if (!enabled || !imageUrl) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="סגירה" />

        <View style={styles.card}>
          <Pressable onPress={handlePress}>
            <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />
          </Pressable>

          <Pressable
            style={styles.closeButton}
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="סגירה">
            <X size={20} color={palette.white} strokeWidth={2.25} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28,25,23,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(28,25,23,0.55)',
  },
});
