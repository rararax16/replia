export default defineNuxtRouteMiddleware(async () => {
  const authState = await ensureAuthState()

  return navigateTo(authState.value?.authenticated ? '/dashboard' : '/login')
})
