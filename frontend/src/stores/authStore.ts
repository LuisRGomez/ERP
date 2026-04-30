import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  token: string | null
  refreshToken: string | null
  userId: string | null
  empresaId: string | null
  setTokens: (access: string, refresh: string) => void
  setEmpresaId: (id: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      userId: null,
      empresaId: null,
      setTokens: (access, refresh) => set({ token: access, refreshToken: refresh }),
      setEmpresaId: (id) => set({ empresaId: id }),
      logout: () => set({ token: null, refreshToken: null, userId: null, empresaId: null }),
    }),
    { name: 'auth' },
  ),
)
