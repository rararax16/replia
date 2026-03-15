export default defineNuxtRouteMiddleware(async () => {
  const authState = await ensureAuthState()

  if (authState.value?.authenticated) {
    return navigateTo('/dashboard')
  }
})
