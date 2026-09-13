import { create } from 'zustand'

interface UIState {
  authOpen: boolean
  setAuthOpen: (open: boolean) => void
  /** set by the nav center "+" button; consumed by the Today page to open the editor */
  pendingAdd: boolean
  requestAdd: () => void
  clearAdd: () => void
}

export const useUI = create<UIState>((set) => ({
  authOpen: false,
  setAuthOpen: (authOpen) => set({ authOpen }),
  pendingAdd: false,
  requestAdd: () => set({ pendingAdd: true }),
  clearAdd: () => set({ pendingAdd: false }),
}))
