"use client";

import { useEffect } from "react";

function playSynthesizedSound(type: string) {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  
  // Browsers require a user gesture to resume AudioContext. 
  // If the user hasn't interacted, this will stay suspended.
  const ctx = new AudioContext();
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => { /* Ignore autoplay blocks */ });
  }

  const playTone = (frequency: number, startTimeOffset: number, duration: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, ctx.currentTime + startTimeOffset);

    gain.gain.setValueAtTime(0, ctx.currentTime + startTimeOffset);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + startTimeOffset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTimeOffset + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + startTimeOffset);
    osc.stop(ctx.currentTime + startTimeOffset + duration);
  };

  if (type === "kudo") {
    // Celebratory chime (ascending arpeggio C major)
    playTone(523.25, 0, 0.15);    // C5
    playTone(659.25, 0.1, 0.15);  // E5
    playTone(783.99, 0.2, 0.3);   // G5
  } else {
    // Default pop/ping
    playTone(880, 0, 0.15); // A5
  }
}

export default function NotificationSoundListener({ soundsEnabled }: { soundsEnabled: boolean }) {
  useEffect(() => {
    if (!soundsEnabled) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "PLAY_NOTIFICATION_SOUND") {
        playSynthesizedSound(event.data.soundType);
      }
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleMessage);
    }
    // Listen to local window messages for the "Probar Sonido" button
    window.addEventListener("message", handleMessage);

    return () => {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleMessage);
      }
      window.removeEventListener("message", handleMessage);
    };
  }, [soundsEnabled]);

  return null;
}
