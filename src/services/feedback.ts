/**
 * Haptics + coin sound for the giving flow. Both respect the user's settings
 * and never throw - feedback failing must not block a donation.
 */

import * as Haptics from 'expo-haptics';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

import { useAppStore } from '@/store/app-store';

const coinSource = require('../../assets/sounds/coin.wav');

let player: AudioPlayer | null = null;
let audioModeReady = false;

async function ensurePlayer(): Promise<AudioPlayer> {
  if (!audioModeReady) {
    audioModeReady = true;
    // Tzedakah is often given with the phone on silent; play anyway.
    await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' });
  }
  player ??= createAudioPlayer(coinSource);
  return player;
}

export async function playCoinSound(): Promise<void> {
  if (!useAppStore.getState().settings.soundEnabled) return;

  try {
    const audio = await ensurePlayer();
    // expo-audio leaves the head at the end of the clip after playback, so the
    // rewind must land before play() or repeat drops are silent.
    await audio.seekTo(0);
    audio.play();
  } catch {
    // A missing/locked audio session must never break the donation.
  }
}

export function tapFeedback(): void {
  if (!useAppStore.getState().settings.hapticsEnabled) return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function coinDropFeedback(): void {
  if (!useAppStore.getState().settings.hapticsEnabled) return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

export function successFeedback(): void {
  if (!useAppStore.getState().settings.hapticsEnabled) return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function errorFeedback(): void {
  if (!useAppStore.getState().settings.hapticsEnabled) return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}

/** Called once on app start so the first coin drop has no load latency. */
export function warmUpFeedback(): void {
  void ensurePlayer().catch(() => {});
}
