type SnackbarType = 'success' | 'error'

type SnackbarItem = {
  id: string
  message: string
  type: SnackbarType
}

export function useSnackbar() {
  const items = useState<SnackbarItem[]>('snackbar-items', () => [])

  function show(message: string, type: SnackbarType) {
    const id = `${Date.now()}-${Math.random()}`
    items.value = [...items.value, { id, message, type }]
    if (import.meta.client) {
      setTimeout(() => dismiss(id), 4000)
    }
  }

  function showSuccess(message: string) {
    show(message, 'success')
  }

  function showError(message: string) {
    show(message, 'error')
  }

  function dismiss(id: string) {
    items.value = items.value.filter(item => item.id !== id)
  }

  return { items, showSuccess, showError, dismiss }
}
