"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useScrollStore } from "@/stores/scrollStore";
import { useUIStore } from "@/stores/uiStore";

const TRACKS = [
  "/audio/acts/act1-ominous-rumble.mp3",
  "/audio/acts/act2-scifi-ambient-drone.mp3",
  "/audio/acts/act3-ambient-flow-pad.mp3",
  "/audio/acts/act4-light-ambient-glitch.mp3",
  "/audio/acts/act5-strings-drums.mp3",
] as const;

const FADE_DURATION = 2.5; // seconds
const MASTER_VOLUME = 0.55;

export function AudioManager() {
  const [muted, setMuted] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const gainNodesRef = useRef<GainNode[]>([]);
  const audioElsRef = useRef<HTMLAudioElement[]>([]);
  const activeTrackRef = useRef<number>(-1);
  const transitionIdRef = useRef(0);

  const isReady = useUIStore((s) => s.isReady);

  // Build the Web Audio graph. Must be called from a user gesture.
  const initAudio = useCallback(() => {
    if (ctxRef.current) return;

    const ctx = new AudioContext();
    ctxRef.current = ctx;

    // Master gain → destination
    const master = ctx.createGain();
    master.gain.setValueAtTime(MASTER_VOLUME, ctx.currentTime);
    master.connect(ctx.destination);
    masterGainRef.current = master;

    TRACKS.forEach((url, i) => {
      const el = new Audio(url);
      el.loop = true;
      el.preload = "none";
      audioElsRef.current[i] = el;

      const src = ctx.createMediaElementSource(el);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      src.connect(gain);
      gain.connect(master);
      gainNodesRef.current[i] = gain;
    });

    setInitialized(true);
  }, []);

  // Crossfade from whatever is playing to `nextIndex`.
  const crossFade = useCallback((nextIndex: number) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const prev = activeTrackRef.current;
    if (prev === nextIndex) return;

    const nextGain = gainNodesRef.current[nextIndex];
    const nextEl = audioElsRef.current[nextIndex];
    if (nextGain && nextEl) {
      const transitionId = ++transitionIdRef.current;
      const now = ctx.currentTime;
      const prevGain = prev >= 0 ? gainNodesRef.current[prev] : null;

      nextGain.gain.cancelScheduledValues(now);
      nextGain.gain.setValueAtTime(0, now);

      nextEl
        .play()
        .then(() => {
          if (transitionIdRef.current !== transitionId) {
            nextGain.gain.cancelScheduledValues(ctx.currentTime);
            nextGain.gain.setValueAtTime(0, ctx.currentTime);
            nextEl.pause();
            return;
          }

          const startTime = ctx.currentTime;

          if (prev >= 0 && prevGain) {
            prevGain.gain.cancelScheduledValues(startTime);
            prevGain.gain.setValueAtTime(prevGain.gain.value, startTime);
            prevGain.gain.linearRampToValueAtTime(
              0,
              startTime + FADE_DURATION
            );
            window.setTimeout(() => {
              if (activeTrackRef.current === prev) {
                audioElsRef.current[prev]?.pause();
              }
            }, FADE_DURATION * 1000 + 100);
          }

          nextGain.gain.cancelScheduledValues(startTime);
          nextGain.gain.setValueAtTime(0, startTime);
          nextGain.gain.linearRampToValueAtTime(1, startTime + FADE_DURATION);
          activeTrackRef.current = nextIndex;
        })
        .catch(() => {
          // Keep the previous track active so a future act change can retry.
        });
    }
  }, []);

  // Once both initialized and the scene is ready, start Act 0.
  useEffect(() => {
    if (!initialized || !isReady) return;
    crossFade(0);
  }, [initialized, isReady, crossFade]);

  // Subscribe to Zustand act changes and crossfade.
  useEffect(() => {
    if (!initialized) return;
    const unsub = useScrollStore.subscribe((state, prev) => {
      if (state.activeAct !== prev.activeAct) {
        crossFade(state.activeAct);
      }
    });
    return unsub;
  }, [initialized, crossFade]);

  // Apply mute/unmute to the master gain.
  useEffect(() => {
    const master = masterGainRef.current;
    const ctx = ctxRef.current;
    if (!master || !ctx) return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(muted ? 0 : MASTER_VOLUME, now + 0.4);
  }, [muted]);

  const handleClick = () => {
    if (!initialized) {
      initAudio();
      return;
    }

    setMuted((m) => !m);
  };

  return (
    <button
      className="audio-toggle"
      onClick={handleClick}
      aria-label={muted || !initialized ? "Enable audio" : "Mute audio"}
      title={muted || !initialized ? "Enable audio" : "Mute audio"}
    >
      {muted || !initialized ? (
        // Speaker off
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        // Speaker on with waves
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      )}
    </button>
  );
}
