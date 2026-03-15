export type AuthUserRole = 'ADMIN' | 'MEMBER'

export type AuthUser = {
  id: string
  tenantId: string
  email: string
  role: AuthUserRole
}

export type AuthState = {
  authenticated: boolean
  user: AuthUser | null
}

function getAuthRequestHeaders() {
  if (import.meta.server) {
    return useRequestHeaders(['cookie'])
  }

  return undefined
}

export function useAuthStateRef() {
  return useState<AuthState | null>('auth-state', () => null)
}

export async function ensureAuthState(force = false) {
  const authState = useAuthStateRef()

  if (!force && authState.value) {
    return authState
  }

  authState.value = await $fetch<AuthState>('/api/auth/me', {
    headers: getAuthRequestHeaders()
  })

  return authState
}

export function clearAuthState() {
  const authState = useAuthStateRef()
  authState.value = null
}

export function clearSessionScopedData() {
  clearNuxtData()
}
