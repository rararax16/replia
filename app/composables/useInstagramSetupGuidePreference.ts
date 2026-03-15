export function useInstagramSetupGuidePreference() {
  const hiddenCookie = useCookie<string>('replia_hide_instagram_setup_guide', {
    default: () => '0',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax'
  })

  const hideGuide = computed({
    get: () => hiddenCookie.value === '1',
    set: (value: boolean) => {
      hiddenCookie.value = value ? '1' : '0'
    }
  })

  return {
    hideGuide
  }
}
