export function useInstagramSetupGuidePreference() {
  const hideGuide = useState('replia_hide_ig_setup', () => false)

  return {
    hideGuide
  }
}
