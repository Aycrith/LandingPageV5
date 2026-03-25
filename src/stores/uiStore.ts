import { create } from "zustand";

interface UIState {
  /** Loading veil visible */
  isLoading: boolean;
  /** Loading progress 0-1 */
  loadProgress: number;
  /** Scene fully initialized and ready */
  isReady: boolean;
  /** Dev HUD visible */
  showHud: boolean;
  /** Hidden DOM CTA is focused or hovered */
  isCtaFocused: boolean;

  setLoadProgress: (p: number) => void;
  setReady: () => void;
  dismissLoading: () => void;
  toggleHud: () => void;
  setCtaFocused: (focused: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isLoading: true,
  loadProgress: 0,
  isReady: false,
  showHud: false,
  isCtaFocused: false,

  setLoadProgress: (p) => set({ loadProgress: Math.min(1, p) }),
  setReady: () => set({ isReady: true }),
  dismissLoading: () => set({ isLoading: false }),
  toggleHud: () => set((s) => ({ showHud: !s.showHud })),
  setCtaFocused: (focused) => set({ isCtaFocused: focused }),
}));
