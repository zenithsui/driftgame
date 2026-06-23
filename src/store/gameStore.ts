import { create } from "zustand";

export type GameState = "MENU" | "COUNTDOWN" | "PLAYING" | "PAUSED" | "ENDED";
export type GameMode = "PRACTICE" | "SCORE_ATTACK";
export type QualityPreset = "LOW" | "MEDIUM" | "HIGH";

interface ScoreSession {
  totalScore: number;
  longestDrift: number;
  highestMultiplier: number;
  highestSpeed: number;
}

interface GameStore {
  gameState: GameState;
  gameMode: GameMode;
  qualityPreset: QualityPreset;
  countdownValue: number;
  
  score: number;
  multiplier: number;
  driftAngle: number;
  speed: number;
  sessionTime: number;
  sessionDuration: number;
  
  driftComboTime: number;
  currentDriftScore: number;
  longestDriftTime: number;
  highestMultiplier: number;
  highestSpeed: number;
  
  counterSteerAssist: boolean;
  units: "KMH" | "MPH";
  
  session: ScoreSession | null;
  
  actions: {
    startGame: (mode: GameMode) => void;
    pauseGame: () => void;
    resumeGame: () => void;
    endGame: () => void;
    returnToMenu: () => void;
    setQuality: (q: QualityPreset) => void;
    toggleCounterSteerAssist: () => void;
    toggleUnits: () => void;
    
    updateDrift: (angle: number, speedMs: number, delta: number) => void;
    updateSpeed: (speedMs: number) => void;
    tickTimer: (delta: number) => void;
    setCountdown: (value: number) => void;
  };
}

const SESSION_DURATION = 90; // seconds for score attack

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: "MENU",
  gameMode: "PRACTICE",
  qualityPreset: "HIGH",
  countdownValue: 3,
  
  score: 0,
  multiplier: 1,
  driftAngle: 0,
  speed: 0,
  sessionTime: 0,
  sessionDuration: SESSION_DURATION,
  
  driftComboTime: 0,
  currentDriftScore: 0,
  longestDriftTime: 0,
  highestMultiplier: 1,
  highestSpeed: 0,
  
  counterSteerAssist: true,
  units: "KMH",
  
  session: null,
  
  actions: {
    startGame: (mode) => {
      set({
        gameState: "COUNTDOWN",
        gameMode: mode,
        countdownValue: 3,
        score: 0,
        multiplier: 1,
        driftAngle: 0,
        speed: 0,
        sessionTime: 0,
        driftComboTime: 0,
        currentDriftScore: 0,
        longestDriftTime: 0,
        highestMultiplier: 1,
        highestSpeed: 0,
        session: null,
      });
    },
    
    pauseGame: () => {
      if (get().gameState === "PLAYING") set({ gameState: "PAUSED" });
    },
    
    resumeGame: () => {
      if (get().gameState === "PAUSED") set({ gameState: "PLAYING" });
    },
    
    endGame: () => {
      const state = get();
      set({
        gameState: "ENDED",
        session: {
          totalScore: Math.floor(state.score),
          longestDrift: Math.round(state.longestDriftTime * 10) / 10,
          highestMultiplier: Math.round(state.highestMultiplier * 10) / 10,
          highestSpeed: Math.round(state.highestSpeed * 3.6),
        },
      });
    },
    
    returnToMenu: () => set({ gameState: "MENU" }),
    
    setQuality: (qualityPreset) => set({ qualityPreset }),
    
    toggleCounterSteerAssist: () =>
      set((s) => ({ counterSteerAssist: !s.counterSteerAssist })),
    
    toggleUnits: () =>
      set((s) => ({ units: s.units === "KMH" ? "MPH" : "KMH" })),
    
    updateDrift: (angle, speedMs, delta) => {
      const state = get();
      if (state.gameState !== "PLAYING") return;
      
      const isDrifting = angle > 12 && speedMs > 6;
      
      if (isDrifting) {
        const newComboTime = state.driftComboTime + delta;
        const newMultiplier = 1 + Math.floor(newComboTime / 2.5) * 0.5;
        const clampedMultiplier = Math.min(newMultiplier, 8);
        const driftPoints = angle * speedMs * clampedMultiplier * delta * 0.15;
        
        set({
          driftAngle: angle,
          driftComboTime: newComboTime,
          multiplier: clampedMultiplier,
          score: state.score + driftPoints,
          currentDriftScore: state.currentDriftScore + driftPoints,
          longestDriftTime: Math.max(state.longestDriftTime, newComboTime),
          highestMultiplier: Math.max(state.highestMultiplier, clampedMultiplier),
        });
      } else {
        const decayedCombo = Math.max(0, state.driftComboTime - delta * 2);
        set({
          driftAngle: angle,
          driftComboTime: decayedCombo,
          multiplier: decayedCombo > 0 ? state.multiplier : 1,
          currentDriftScore: decayedCombo > 0 ? state.currentDriftScore : 0,
        });
      }
    },
    
    updateSpeed: (speedMs) => {
      const kmh = speedMs * 3.6;
      set((s) => ({
        speed: speedMs,
        highestSpeed: Math.max(s.highestSpeed, speedMs),
      }));
    },
    
    tickTimer: (delta) => {
      const state = get();
      if (state.gameState !== "PLAYING") return;
      
      if (state.gameMode === "SCORE_ATTACK") {
        const newTime = state.sessionTime + delta;
        if (newTime >= state.sessionDuration) {
          get().actions.endGame();
        } else {
          set({ sessionTime: newTime });
        }
      } else {
        set({ sessionTime: state.sessionTime + delta });
      }
    },
    
    setCountdown: (value) => {
      if (value <= 0) {
        set({ gameState: "PLAYING", countdownValue: 0 });
      } else {
        set({ countdownValue: value });
      }
    },
  },
}));
