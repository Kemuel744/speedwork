// Notification sound utility
// Uses the Web Audio API to generate a pleasant notification chime without needing an audio file

let audioCtx: AudioContext | null = null;

export function playNotificationSound() {
  try {
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }

    // Resume context if suspended (browser autoplay policy)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // Two-tone chime
    const frequencies = [830, 1050];
    frequencies.forEach((freq, i) => {
      const oscillator = audioCtx!.createOscillator();
      const gainNode = audioCtx!.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, now);

      gainNode.gain.setValueAtTime(0, now + i * 0.12);
      gainNode.gain.linearRampToValueAtTime(0.15, now + i * 0.12 + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.3);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx!.destination);

      oscillator.start(now + i * 0.12);
      oscillator.stop(now + i * 0.12 + 0.35);
    });
  } catch (e) {
    // Silently fail if audio is not available
    console.warn('Could not play notification sound:', e);
  }
}
