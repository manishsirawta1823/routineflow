import { create } from 'zustand'

interface UIState {
  authOpen: boolean
  setAuthOpen: (open: boolean) => void
}

export const useUI = create<UIState>((set) => ({
  authOpen: false,
  setAuthOpen: (authOpen) => set({ authOpen }),
}))
