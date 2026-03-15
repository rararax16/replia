export default defineNuxtRouteMiddleware(async () => {
  const authState = await ensureAuthState()

  if (!authState.value?.authenticated) {
    return navigateTo('/login')
  }

  if (authState.value.user?.role !== 'ADMIN') {
    return navigateTo('/dashboard')
  }
})
